import axios from 'axios';
import env from '../config/env.js';

/**
 * Low-level Bigship HTTP client (Unified Outbound API, https://api.bigship.direct/).
 * Credentials stay server-side only — never log the password, access key or token.
 *
 * Flow:
 *  login → user-rate-calculator (checkout quote)
 *  → create-order (draft) → courier-wise-shipment-cost → place-order (AWB, charges wallet)
 *  → track-order / order-shipment-details / download-shipment-documents → cancel-order
 *
 * Bigship has no webhooks: tracking is pulled (see bigshipTrackingSync).
 */
class BigshipClient {
  constructor() {
    this._token = null;
    this._tokenExpiresAt = 0;
    this._loginPromise = null;
  }

  isConfigured() {
    return Boolean(env.BIGSHIP.IS_CONFIGURED);
  }

  _assertConfigured() {
    if (!this.isConfigured()) {
      const err = new Error(
        'Bigship is not configured. Set BIGSHIP_USER_NAME, BIGSHIP_PASSWORD and BIGSHIP_ACCESS_KEY in the backend environment.'
      );
      err.statusCode = 503;
      throw err;
    }
  }

  async authenticate(force = false) {
    this._assertConfigured();

    const now = Date.now();
    if (!force && this._token && now < this._tokenExpiresAt - 60_000) {
      return this._token;
    }
    // Share one in-flight login between concurrent requests
    if (this._loginPromise) return this._loginPromise;

    this._loginPromise = (async () => {
      try {
        const { data } = await axios.post(
          `${env.BIGSHIP.BASE_URL}/api/outbound/login`,
          {
            username: env.BIGSHIP.USER_NAME,
            password: env.BIGSHIP.PASSWORD,
            access_key: env.BIGSHIP.ACCESS_KEY
          },
          { timeout: 25_000, headers: { 'Content-Type': 'application/json' } }
        );

        const token = data?.data?.token;
        if (!token) {
          const err = new Error(
            `Bigship login failed: ${data?.message || 'no token returned'}. Check BIGSHIP_USER_NAME / PASSWORD / ACCESS_KEY.`
          );
          err.statusCode = 401;
          throw err;
        }
        if (String(data?.data?.is_outbound_service_enabled) === '0') {
          console.warn('[Bigship] Login ok but outbound service is not enabled on this account.');
        }

        const expires = Date.parse(data?.data?.tokenExpiringAt || '');
        this._token = token;
        // Fall back to 50 minutes if the expiry is missing/unparseable
        this._tokenExpiresAt = Number.isFinite(expires) ? expires : Date.now() + 50 * 60 * 1000;
        console.log('[Bigship] Login successful.');
        return this._token;
      } catch (error) {
        this._token = null;
        this._tokenExpiresAt = 0;
        if (error.statusCode) throw error;
        const status = error.response?.status;
        const msg = error.response?.data?.message || error.message || 'Bigship login failed.';
        console.error('[Bigship] Login error:', msg, status ? `(HTTP ${status})` : '');
        const err = new Error(
          [400, 401, 403, 422].includes(status)
            ? `Bigship login rejected: ${msg}`
            : `Bigship login error: ${msg}`
        );
        err.statusCode = [400, 401, 403, 422].includes(status) ? 401 : 502;
        err.bigship = error.response?.data;
        throw err;
      } finally {
        this._loginPromise = null;
      }
    })();
    return this._loginPromise;
  }

  /**
   * @param {string} method
   * @param {string} path e.g. 'api/outbound/profile'
   * @param {{params?:object,data?:object|FormData,retry?:boolean}} opts
   * @returns {Promise<any>} the `data` field of Bigship's {status,message,status_code,data} envelope
   */
  async request(method, path, { params, data, retry = true } = {}) {
    this._assertConfigured();
    const token = await this.authenticate();
    const url = `${env.BIGSHIP.BASE_URL}/${String(path).replace(/^\//, '')}`;
    const isForm = typeof FormData !== 'undefined' && data instanceof FormData;

    try {
      console.log(`[Bigship] ${method.toUpperCase()} ${path}`);
      const response = await axios({
        method,
        url,
        params,
        data,
        timeout: 45_000,
        headers: {
          ...(isForm ? {} : { 'Content-Type': 'application/json' }),
          Authorization: `Bearer ${token}`
        }
      });
      const body = response.data;
      // Bigship can answer HTTP 200 with status:false
      if (body && body.status === false) {
        const err = new Error(body.message || 'Bigship request failed');
        err.statusCode = Number(body.status_code) >= 400 ? Number(body.status_code) : 400;
        err.bigship = body;
        throw err;
      }
      return body;
    } catch (error) {
      if (error.bigship && error.statusCode) throw error;

      const status = error.response?.status;
      const body = error.response?.data;

      if (status === 401 && retry) {
        await this.authenticate(true);
        return this.request(method, path, { params, data, retry: false });
      }
      if (status === 429 && retry) {
        await new Promise((r) => setTimeout(r, 1500));
        return this.request(method, path, { params, data, retry: false });
      }

      const firstValidation = body?.errors && Object.values(body.errors)?.[0]?.[0];
      const msg = firstValidation || body?.message || body?.error || error.message || 'Bigship API request failed';
      console.error(`[Bigship] ${method.toUpperCase()} ${path} failed:`, msg, status ? `(HTTP ${status})` : '');
      const err = new Error(msg);
      err.statusCode = status && status >= 400 && status < 500 ? (status === 401 ? 502 : status) : 502;
      err.bigship = body;
      throw err;
    }
  }

  // ---- Account / warehouses -------------------------------------------------

  async getProfile() {
    const res = await this.request('get', 'api/outbound/profile');
    return res?.data || {};
  }

  /** Domestic (B2C/B2B) warehouses are listed under segment "local". */
  async listWarehouses({ page = 1, perPage = 25, segment = 'local' } = {}) {
    const res = await this.request('get', 'api/outbound/get-warehouse-list', {
      params: { page: String(page), perPage: String(perPage), segment_type: segment }
    });
    return res?.data?.warehouse || [];
  }

  // ---- Rates ----------------------------------------------------------------

  /**
   * Rate calculator without creating an order. B2C allows exactly one box.
   * @returns {Promise<Array>} courier rate rows
   */
  async calculateRates({
    sourcePincode,
    destPincode,
    invoiceValue,
    cod = false,
    codAmount,
    weightKg,
    lengthCm = 10,
    breadthCm = 10,
    heightCm = 10,
    segment = 'domestic_b2c'
  }) {
    const body = {
      segment_type: segment,
      sourcePincode: String(sourcePincode),
      destPincode: String(destPincode),
      invoiceValue: Math.max(1, Math.round(Number(invoiceValue) || 1)),
      paymentModeId: cod ? 2 : 1,
      riskTypeId: 2,
      boxes: [
        {
          no_of_box: 1,
          box_length: Math.max(1, Math.ceil(lengthCm)),
          box_width: Math.max(1, Math.ceil(breadthCm)),
          box_height: Math.max(1, Math.ceil(heightCm)),
          box_dead_weight: Math.max(1, Math.ceil(weightKg))
        }
      ]
    };
    if (cod) body.codAmount = Math.max(1, Math.round(Number(codAmount ?? invoiceValue) || 1));
    const res = await this.request('post', 'api/outbound/user-rate-calculator', { data: body });
    return Array.isArray(res?.data) ? res.data : [];
  }

  // ---- Orders ---------------------------------------------------------------

  /** Create a draft order. Returns { CustomGlobalOrderId }. */
  async createOrder(payload) {
    const res = await this.request('post', 'api/outbound/create-order', { data: payload });
    return res?.data || {};
  }

  /** Serviceable couriers + freight for a draft order. */
  async getCourierRates(customOrderId) {
    const res = await this.request('post', 'api/outbound/courier-wise-shipment-cost', {
      data: { MasterCustomOrderId: String(customOrderId) }
    });
    return res?.data?.calculatedRates || [];
  }

  /**
   * Place / manifest the order with a chosen courier. Charges the Bigship wallet and returns the AWB.
   * Domestic orders must be multipart/form-data.
   */
  async placeOrder({ customOrderId, courierId, riskTypeId = 2 }) {
    const form = new FormData();
    form.append('MasterCustomOrderId', String(customOrderId));
    form.append('courierId', String(courierId));
    form.append('riskTypeId', String(riskTypeId));
    const res = await this.request('post', 'api/outbound/place-order', { data: form });
    return res?.data || {};
  }

  async cancelOrder(customOrderId, reason = 'Cancelled by seller') {
    // The docs name this field both CustomGlobalOrderId and MasterCustomOrderId — send both.
    // The live API also requires `reason` (it is missing from the PDF).
    return this.request('post', 'api/outbound/cancel-order', {
      data: {
        CustomGlobalOrderId: String(customOrderId),
        MasterCustomOrderId: String(customOrderId),
        reason: String(reason || 'Cancelled by seller').slice(0, 250)
      }
    });
  }

  async trackOrder({ customOrderId, trackingNumber } = {}) {
    const params = {};
    if (customOrderId) params.CustomGlobalOrderId = String(customOrderId);
    else if (trackingNumber) params.TrackingNumber = String(trackingNumber);
    const res = await this.request('get', 'api/outbound/track-order', { params });
    return res?.data || {};
  }

  async getOrderDetails(customOrderId) {
    const res = await this.request('get', 'api/outbound/order-shipment-details', {
      params: { MasterCustomOrderId: String(customOrderId) }
    });
    return res?.data || {};
  }

  /** @param {'label'|'invoice'|'manifest'|'ewaybill'} documentType */
  async getDocumentUrl(customOrderId, documentType) {
    const res = await this.request('get', 'api/outbound/download-shipment-documents', {
      params: { CustomGlobalOrderId: String(customOrderId), document_type: documentType }
    });
    return res?.data?.AttachmentData || '';
  }
}

export const bigshipClient = new BigshipClient();
export default bigshipClient;
