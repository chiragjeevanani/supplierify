import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import settingsService from './settingsService.js';
import bigshipClient from './bigshipClient.js';
import env from '../config/env.js';
import { updateOrderTimeline, ALLOWED_TRANSITIONS } from './orderService.js';

/**
 * Parse pack label like "150g" / "300 g" / "0.5kg" into kilograms.
 */
export function parseWeightToKg(weightLabel) {
  if (weightLabel == null || weightLabel === '') return null;
  if (typeof weightLabel === 'number' && Number.isFinite(weightLabel) && weightLabel > 0) {
    return weightLabel;
  }
  const s = String(weightLabel).trim().toLowerCase().replace(/\s+/g, '');
  const m = s.match(/^([\d.]+)(kg|g|gm|grams?)?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = (m[2] || 'g').toLowerCase();
  if (unit.startsWith('kg')) return n;
  return n / 1000;
}

function sanitizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

const utcStamp = (d) => new Date(d).toISOString().slice(0, 19).replace('T', ' ');

/**
 * Bigship tracking status text → store order status.
 * Bigship tags look like: "Pickup Pending", "Picked Up", "In-Transit", "Out for Delivery",
 * "Delivered", "Undelivered", "RTO In Transit", "RTO Delivered", "Cancelled".
 * Returns null when the status must not move the store order (early warehouse states).
 */
export function mapBigshipStatusToOrderStatus(statusText) {
  if (!statusText) return null;
  const s = String(statusText).trim().toUpperCase().replace(/[_-]+/g, ' ');

  if (s.includes('CANCEL') || s === 'LOST' || s.includes('DESTROYED') || s.includes('DAMAGED')) {
    return 'CANCELLED';
  }

  if (s.includes('RTO') || s.includes('RETURN')) {
    if (s.includes('DELIVERED') || s.includes('COMPLETED') || s === 'RETURNED') return 'CANCELLED';
    return null; // return still on the way: only the shipment status changes
  }

  if (s.includes('DELIVERED') && !s.includes('UNDELIVERED')) return 'DELIVERED';
  if (s.includes('OUT FOR DELIVERY') || s.includes('OFD')) return 'OUT_FOR_DELIVERY';
  if (
    s.includes('IN TRANSIT') ||
    s.includes('SHIPPED') ||
    s.includes('PICKED') ||
    s.includes('PICKUP DONE') ||
    s.includes('PICKUP COMPLETE') ||
    s.includes('DISPATCHED') ||
    s.includes('REACHED') ||
    s.includes('CONNECTED') ||
    s.includes('UNDELIVERED') ||
    s.includes('NDR') ||
    s.includes('EXCEPTION')
  ) {
    return 'SHIPPED';
  }
  // Pickup pending / manifested / AWB assigned etc. must NOT move the store order:
  // admin Accept → ACCEPTED, admin Pack → PACKED. Bigship only drives transit and beyond.
  return null;
}

/** Bigship track-order → compact checkpoint list for the customer (newest first, max 25). */
export function extractTrackingHistory(tracking) {
  const raw = Array.isArray(tracking?.tracking_histories) ? tracking.tracking_histories : [];
  return raw
    .map((h) => ({
      status: String(h?.order_status || h?.tag || '').trim(),
      message: String(h?.message || '').trim(),
      at: h?.checkpoint_time ? new Date(String(h.checkpoint_time).trim().replace(/\s*([-:])\s*/g, '$1')) : null
    }))
    .filter((h) => (h.status || h.message) && h.at && !Number.isNaN(h.at.getTime()))
    .sort((a, b) => b.at - a.at)
    .slice(0, 25);
}

export function canTransitionOrderStatus(from, to) {
  if (!from || !to || from === to) return from === to;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (allowed.includes(to)) return true;
  // Couriers often skip intermediate warehouse steps
  const forwardJumps = {
    PENDING: ['CONFIRMED', 'ACCEPTED', 'PACKED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    CONFIRMED: ['ACCEPTED', 'PACKED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    ACCEPTED: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    PACKED: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    PROCESSING: ['ACCEPTED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED']
  };
  return (forwardJumps[from] || []).includes(to);
}

export function resolvePackageMetrics(orderItem, product, defaults) {
  const name = orderItem.name || product?.name || 'Product';

  let weightKg = null;
  if (product?.shippingWeightKg != null && Number(product.shippingWeightKg) > 0) {
    weightKg = Number(product.shippingWeightKg);
  } else {
    weightKg = parseWeightToKg(orderItem.weight) || parseWeightToKg(product?.weight);
  }
  if (weightKg == null && defaults.weightKg != null && defaults.weightKg > 0) {
    weightKg = defaults.weightKg;
  }

  const pick = (own, fallback) =>
    (own != null && Number(own) > 0 && Number(own)) || fallback || null;
  const length = pick(product?.lengthCm, defaults.lengthCm);
  const breadth = pick(product?.breadthCm, defaults.breadthCm);
  const height = pick(product?.heightCm, defaults.heightCm);

  // Did this product define its own pack size? (otherwise the order uses one standard box)
  const ownDims = [product?.lengthCm, product?.breadthCm, product?.heightCm].every(
    (v) => v != null && Number(v) > 0
  );

  const missing = [];
  if (weightKg == null || weightKg <= 0) {
    missing.push('weight (set product.shippingWeightKg or pack weight like "150g", or BIGSHIP_DEFAULT_WEIGHT_KG)');
  }
  if (length == null) missing.push('lengthCm (product or BIGSHIP_DEFAULT_LENGTH_CM)');
  if (breadth == null) missing.push('breadthCm (product or BIGSHIP_DEFAULT_BREADTH_CM)');
  if (height == null) missing.push('heightCm (product or BIGSHIP_DEFAULT_HEIGHT_CM)');

  if (missing.length > 0) {
    const err = new Error(`Cannot create Bigship shipment for "${name}": missing ${missing.join('; ')}.`);
    err.statusCode = 400;
    throw err;
  }

  return {
    name,
    sku: (product?.sku && String(product.sku).trim()) || '',
    units: Number(orderItem.qty) || 1,
    price: Number(orderItem.price) || 0,
    weightKg,
    length,
    breadth,
    height,
    ownDims
  };
}

async function loadOrder(orderId) {
  const query = mongoose.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderNumber: orderId };
  const order = await Order.findOne(query);
  if (!order) {
    const err = new Error(`Order "${orderId}" not found`);
    err.statusCode = 404;
    throw err;
  }
  return order;
}

function ensureBigshipSubdoc(order) {
  if (!order.bigship) order.bigship = {};
  return order.bigship;
}

function cheapestRate(rates = []) {
  return [...rates]
    .map((r) => ({ ...r, _fee: Number(r.total_freight ?? r.total ?? r.totalCharge) }))
    .filter((r) => Number.isFinite(r._fee) && r._fee > 0)
    .sort((a, b) => a._fee - b._fee)[0] || null;
}

/**
 * Apply a Bigship status string onto the store order (shared by track + background sync).
 */
export async function applyBigshipStatusToOrder(order, {
  statusText,
  awb = null,
  courierName = null,
  etd = null,
  source = 'Bigship'
} = {}) {
  const bg = ensureBigshipSubdoc(order);

  if (awb) {
    bg.awbCode = String(awb);
    order.awbNumber = String(awb);
  }
  if (courierName) {
    bg.courierName = String(courierName);
    order.courierName = String(courierName);
  }
  if (statusText) bg.status = String(statusText);
  if (etd) {
    const d = new Date(etd);
    if (!Number.isNaN(d.getTime())) {
      order.delivery = order.delivery || {};
      order.delivery.estimatedDelivery = d;
    }
  }

  const mapped = mapBigshipStatusToOrderStatus(statusText);
  bg.isRto = /RTO|RETURN/i.test(String(statusText || ''));

  if (mapped && mapped !== order.status && canTransitionOrderStatus(order.status, mapped)) {
    const prev = order.status;
    order.status = mapped;
    if (mapped === 'SHIPPED' || mapped === 'OUT_FOR_DELIVERY') {
      order.delivery = order.delivery || {};
      order.delivery.status = mapped === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'In Transit';
      order.dispatchedAt = order.dispatchedAt || new Date();
    }
    if (mapped === 'DELIVERED') {
      order.delivery = order.delivery || {};
      order.delivery.status = 'Delivered';
      if (order.payment?.method === 'COD' && order.payment.status !== 'PAID') {
        order.payment.status = 'PAID';
      }
    }
    if (mapped === 'CANCELLED' && prev !== 'CANCELLED') {
      order.cancelledBy = 'SYSTEM';
      order.cancelReason = order.cancelReason || `${source}: ${statusText}`;
      order.cancelledAt = new Date();
    }
    try {
      updateOrderTimeline(order, mapped, source, `${statusText || mapped}`);
    } catch (_) {
      /* ignore */
    }
  }

  bg.lastSyncedAt = new Date();
  bg.lastUpdatedAt = new Date();
  order.markModified('bigship');
  return { mapped, bigship: bg };
}

class BigshipFulfillmentService {
  constructor() {
    this._warehouseCache = { at: 0, list: [] };
  }

  isReady() {
    return bigshipClient.isConfigured();
  }

  getAutoFulfillLevel() {
    const level = String(env.BIGSHIP.AUTO_FULFILL || 'create').toLowerCase().trim();
    if (['full', 'awb', 'create'].includes(level)) return level;
    return 'create';
  }

  /** Pickup pincode for rate quotes (Admin Settings first, env as fallback). */
  async getPickupContext() {
    const settings = await settingsService.getSettings();
    return {
      pincode: String(settings.warehousePincode || env.BIGSHIP.PICKUP_PINCODE || '').replace(/\D/g, '').slice(0, 6),
      warehouseName: settings.warehouseName || ''
    };
  }

  /** Numeric Bigship warehouse id used as MasterOrderPickUpLocation. */
  async resolveWarehouseId(preferredId) {
    const explicit = preferredId || env.BIGSHIP.PICKUP_WAREHOUSE_ID;
    if (explicit) return String(explicit);

    const now = Date.now();
    if (!this._warehouseCache.list.length || now - this._warehouseCache.at > 10 * 60 * 1000) {
      this._warehouseCache = { at: now, list: await bigshipClient.listWarehouses() };
    }
    const active = this._warehouseCache.list.filter((w) => String(w.isActive) !== '0');
    const { pincode } = await this.getPickupContext();
    const match = active.find((w) => pincode && String(w.pincode) === pincode) || active[0];
    if (!match?.warehouseId) {
      const err = new Error(
        'No pickup warehouse found in Bigship. Add one in the Bigship panel (or set BIGSHIP_PICKUP_WAREHOUSE_ID).'
      );
      err.statusCode = 400;
      throw err;
    }
    return String(match.warehouseId);
  }

  /**
   * Create the Bigship DRAFT order (POST create-order). No wallet charge yet.
   */
  async createShipmentForOrder(orderId, options = {}) {
    if (!this.isReady()) {
      const err = new Error('Bigship credentials are not configured on the server.');
      err.statusCode = 503;
      throw err;
    }

    const order = await loadOrder(orderId);
    const bg = ensureBigshipSubdoc(order);

    if (order.status === 'CANCELLED') {
      const err = new Error('Cannot create a Bigship shipment for a cancelled order.');
      err.statusCode = 400;
      throw err;
    }

    if (bg.customOrderId && !options.force) {
      return {
        alreadyExists: true,
        message: 'Bigship shipment already exists for this order.',
        order,
        bigship: bg
      };
    }

    const addr = order.shippingAddress;
    if (!addr?.postalCode || !addr?.addressLine1 || !addr?.city || !addr?.state || !addr?.phoneNumber) {
      const err = new Error(
        'Invalid customer shipping address on order. Required: addressLine1, city, state, postalCode, phoneNumber.'
      );
      err.statusCode = 400;
      throw err;
    }
    if (!order.items?.length) {
      const err = new Error('Order has no line items — cannot create a Bigship shipment.');
      err.statusCode = 400;
      throw err;
    }
    const phone = sanitizePhone(addr.phoneNumber);
    if (phone.length !== 10) {
      const err = new Error(`Invalid customer phone "${addr.phoneNumber}". Need a 10-digit mobile number.`);
      err.statusCode = 400;
      throw err;
    }

    const defaults = {
      weightKg: env.BIGSHIP.DEFAULT_WEIGHT_KG,
      lengthCm: env.BIGSHIP.DEFAULT_LENGTH_CM,
      breadthCm: env.BIGSHIP.DEFAULT_BREADTH_CM,
      heightCm: env.BIGSHIP.DEFAULT_HEIGHT_CM
    };
    const productIds = order.items.map((i) => i.product).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const lines = order.items.map((item) =>
      resolvePackageMetrics(item, productMap.get(item.product?.toString?.() || String(item.product)), defaults)
    );
    const totalWeight = lines.reduce((sum, l) => sum + l.weightKg * l.units, 0);
    // Box size: when every product has its own pack size, stack them; otherwise the whole order
    // goes in ONE standard box (BIGSHIP_DEFAULT_*_CM). Admin can override via options.package.
    const allOwnDims = lines.every((l) => l.ownDims);
    const std = {
      length: defaults.lengthCm,
      breadth: defaults.breadthCm,
      height: defaults.heightCm
    };
    const pkg = options.package || {};
    const num = (v) => (v != null && Number(v) > 0 ? Number(v) : null);
    const dims = {
      weightKg: Math.max(1, Math.ceil(num(pkg.weightKg) || totalWeight)),
      length: Math.ceil(num(pkg.lengthCm) || (allOwnDims ? Math.max(...lines.map((l) => l.length)) : std.length)),
      breadth: Math.ceil(num(pkg.breadthCm) || (allOwnDims ? Math.max(...lines.map((l) => l.breadth)) : std.breadth)),
      height: Math.max(
        1,
        Math.ceil(num(pkg.heightCm) || (allOwnDims ? lines.reduce((s, l) => s + l.height * l.units, 0) : std.height))
      )
    };

    const isCod = String(order.payment?.method || '').toUpperCase() === 'COD';
    const warehouseId = await this.resolveWarehouseId(options.pickupWarehouseId || bg.pickupWarehouseId);
    const { pincode: pickupPincode } = await this.getPickupContext();

    // Refuse to create when the pincode is not serviceable (best-effort — never blocks on API errors)
    if (!options.skipServiceabilityCheck && pickupPincode) {
      try {
        const rates = await bigshipClient.calculateRates({
          sourcePincode: pickupPincode,
          destPincode: String(addr.postalCode).trim(),
          invoiceValue: Number(order.pricing?.subtotal || order.pricing?.total || 1),
          cod: isCod,
          codAmount: Number(order.pricing?.total || 0),
          weightKg: dims.weightKg,
          lengthCm: dims.length,
          breadthCm: dims.breadth,
          heightCm: dims.height
        });
        if (!rates.length) {
          const err = new Error(
            `Delivery pincode ${addr.postalCode} is not serviceable from pickup ${pickupPincode}${isCod ? ' for COD' : ''}.`
          );
          err.statusCode = 400;
          throw err;
        }
      } catch (e) {
        if (e.statusCode === 400 && /not serviceable/.test(e.message)) throw e;
        console.warn('[Bigship] Pre-create serviceability check skipped:', e.message);
      }
    }

    // Bigship wants the invoice amount to equal the sum of the product totals.
    const products_ = lines.map((l) => ({
      productName: l.name,
      qty: String(l.units),
      amount: String(Math.round(l.price)),
      totalAmount: Math.round(l.price * l.units),
      collectableAmount: 0,
      categoryId: '1'
    }));
    const invoiceAmount = products_.reduce((sum, p) => sum + p.totalAmount, 0);
    if (isCod) {
      // What the courier collects: order total (incl. delivery, less discount), spread onto the first line.
      products_.forEach((p) => { p.collectableAmount = p.totalAmount; });
      const diff = Math.round(Number(order.pricing?.total || invoiceAmount)) - invoiceAmount;
      products_[0].collectableAmount = Math.max(0, products_[0].collectableAmount + diff);
    }

    const invoiceNo = bg.customOrderId && options.force
      ? `${order.orderNumber}-${String(Date.now()).slice(-5)}`
      : String(order.orderNumber);

    let customerEmail = options.customerEmail || '';
    if (!customerEmail && order.user) {
      try {
        const user = await User.findById(order.user).select('email').lean();
        customerEmail = user?.email || '';
      } catch (_) {
        /* ignore */
      }
    }

    const payload = {
      segment_type: 'domestic_b2c',
      MasterOrderPickUpLocation: Number(warehouseId),
      MasterOrderReturnLocation: Number(warehouseId),
      MasterOrderDate: utcStamp(order.createdAt || new Date()),
      MasterOrderPaymentMode: isCod ? 2 : 1,
      OrderInvoiceNo: invoiceNo,
      MasterOrderInvoiceAmount: invoiceAmount,
      MasterOrderShippingName: String(addr.fullName || 'Customer').trim(),
      MasterOrderShippingMobileNo: phone,
      MasterOrderShippingAddress: addr.addressLine1,
      MasterOrderShippingAddress2: addr.addressLine2 || '',
      MasterOrderShippingLandmark: addr.landmark || '',
      MasterOrderShippingZipCode: String(addr.postalCode).trim(),
      MasterOrderShippingCity: addr.city,
      MasterOrderShippingState: addr.state,
      MasterOrderShippingCountry: addr.country || 'India',
      totalNumOfBoxes: 1,
      boxes: [
        {
          weight_unit: 'kg',
          dimension_unit: 'cm',
          noOfBoxes: 1,
          dimensions: [
            { length: dims.length, breadth: dims.breadth, height: dims.height, weight: dims.weightKg }
          ],
          products: products_
        }
      ]
    };
    if (customerEmail && customerEmail.includes('@')) payload.MasterOrderShippingEmail = customerEmail;
    if (isCod) payload.MasterOrderCollectableAmount = products_.reduce((s, p) => s + p.collectableAmount, 0);

    try {
      const result = await bigshipClient.createOrder(payload);
      const customOrderId = String(result?.CustomGlobalOrderId || '');
      if (!customOrderId) {
        const err = new Error('Bigship did not return an order id. Check warehouse id and the shipping address.');
        err.statusCode = 502;
        err.bigship = result;
        throw err;
      }

      bg.customOrderId = customOrderId;
      bg.pickupWarehouseId = warehouseId;
      bg.status = 'Draft';
      bg.weightKg = Number(totalWeight.toFixed(3));
      bg.lengthCm = dims.length;
      bg.breadthCm = dims.breadth;
      bg.heightCm = dims.height;
      bg.awbCode = '';
      bg.errorMessage = '';
      bg.lastUpdatedAt = new Date();
      bg.lastSyncedAt = new Date();
      order.markModified('bigship');
      await order.save();

      console.log(`[Bigship] Draft order created for ${order.orderNumber}: ${customOrderId}`);
      return {
        alreadyExists: false,
        message: 'Bigship order created. Assign a courier to generate the AWB.',
        order,
        bigship: bg,
        raw: result
      };
    } catch (error) {
      bg.errorMessage = error.message || 'Bigship create failed';
      bg.lastUpdatedAt = new Date();
      order.markModified('bigship');
      await order.save().catch(() => {});
      throw error;
    }
  }

  /** Courier options + freight for the order (admin "Check Couriers"). */
  async checkServiceabilityForOrder(orderId) {
    const order = await loadOrder(orderId);
    const bg = ensureBigshipSubdoc(order);
    if (!bg.customOrderId) {
      const err = new Error('Create the Bigship order first, then check couriers.');
      err.statusCode = 400;
      throw err;
    }
    const couriers = await bigshipClient.getCourierRates(bg.customOrderId);
    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveryPostcode: order.shippingAddress?.postalCode,
      available: couriers.length > 0,
      couriers: couriers.map((c) => ({
        courierId: c.courierId,
        courierName: c.courierName,
        freight: Number(c.total_freight ?? c.total) || null,
        tat: c.tat ?? null,
        zone: c.zone ?? null,
        courierType: c.courierType ?? null
      }))
    };
  }

  /**
   * Place the order with a courier (POST place-order). This CHARGES the Bigship wallet
   * and returns the AWB. Picks the cheapest courier unless courierId is given.
   */
  async assignCourierAndGenerateAwb(orderId, { courierId } = {}) {
    const order = await loadOrder(orderId);
    const bg = ensureBigshipSubdoc(order);
    if (!bg.customOrderId) {
      const err = new Error('No Bigship order on this order. Create the shipment first.');
      err.statusCode = 400;
      throw err;
    }
    if (bg.awbCode && !courierId) {
      return {
        alreadyExists: true,
        message: 'AWB already generated for this shipment.',
        order,
        bigship: bg
      };
    }

    const rates = await bigshipClient.getCourierRates(bg.customOrderId);
    let chosen = null;
    if (courierId != null) {
      chosen = rates.find((r) => String(r.courierId) === String(courierId));
      if (!chosen) {
        const err = new Error(`Courier ${courierId} is not available for this order.`);
        err.statusCode = 400;
        throw err;
      }
    } else {
      chosen = cheapestRate(rates);
    }
    if (!chosen?.courierId) {
      const err = new Error('No courier is available for this order/pincode right now.');
      err.statusCode = 400;
      throw err;
    }

    const result = await bigshipClient.placeOrder({
      customOrderId: bg.customOrderId,
      courierId: chosen.courierId,
      riskTypeId: 2
    });
    const awb = result?.awb_assigned ? String(result.awb_assigned) : '';
    if (!awb) {
      const err = new Error('Bigship did not return an AWB. Check the wallet balance and try again.');
      err.statusCode = 502;
      err.bigship = result;
      throw err;
    }

    bg.awbCode = awb;
    bg.referenceNumber = result?.reference_number != null ? String(result.reference_number) : '';
    bg.courierId = Number(chosen.courierId);
    bg.courierName = String(chosen.courierName || '');
    bg.freight = Number(chosen.total_freight ?? chosen.total) || null;
    bg.status = 'Manifested';
    bg.errorMessage = '';
    bg.lastUpdatedAt = new Date();
    order.courierName = bg.courierName || order.courierName;
    order.awbNumber = bg.awbCode;
    order.markModified('bigship');
    await order.save();

    return { message: 'Courier assigned and AWB generated.', order, bigship: bg, raw: result };
  }

  async _fetchDocument(orderId, type, field, needsAwb) {
    const order = await loadOrder(orderId);
    const bg = ensureBigshipSubdoc(order);
    if (!bg.customOrderId) {
      const err = new Error('Create the Bigship shipment first.');
      err.statusCode = 400;
      throw err;
    }
    if (needsAwb && !bg.awbCode) {
      const err = new Error('Assign a courier (generate AWB) before downloading this document.');
      err.statusCode = 400;
      throw err;
    }
    const url = await bigshipClient.getDocumentUrl(bg.customOrderId, type);
    if (url) bg[field] = url;
    bg.lastUpdatedAt = new Date();
    order.markModified('bigship');
    await order.save();
    return { order, bigship: bg, url: bg[field] };
  }

  async generateLabel(orderId) {
    const r = await this._fetchDocument(orderId, 'label', 'labelUrl', true);
    return { message: r.url ? 'Shipping label ready.' : 'Label not available yet.', order: r.order, bigship: r.bigship, labelUrl: r.url };
  }

  async generateInvoice(orderId) {
    const r = await this._fetchDocument(orderId, 'invoice', 'invoiceUrl', false);
    return { message: r.url ? 'Invoice ready.' : 'Invoice not available yet.', order: r.order, bigship: r.bigship, invoiceUrl: r.url };
  }

  async generateManifest(orderId) {
    const r = await this._fetchDocument(orderId, 'manifest', 'manifestUrl', true);
    return { message: r.url ? 'Manifest ready.' : 'Manifest not available yet.', order: r.order, bigship: r.bigship, manifestUrl: r.url };
  }

  /** Pull tracking from Bigship and apply it onto the store order. */
  async trackShipment(orderId) {
    const order = await loadOrder(orderId);
    const bg = ensureBigshipSubdoc(order);
    if (!bg.customOrderId && !bg.awbCode) {
      const err = new Error('No Bigship shipment to track for this order.');
      err.statusCode = 400;
      throw err;
    }
    if (!bg.awbCode) {
      const err = new Error('No AWB yet — assign a courier first.');
      err.statusCode = 400;
      throw err;
    }

    const tracking = await bigshipClient.trackOrder(
      bg.customOrderId ? { customOrderId: bg.customOrderId } : { trackingNumber: bg.awbCode }
    );
    const statusText = tracking?.order_status || tracking?.tag || bg.status;

    await applyBigshipStatusToOrder(order, {
      statusText,
      awb: tracking?.tracking_number || bg.awbCode,
      courierName: tracking?.courier_name || bg.courierName,
      etd: tracking?.date_expected_delivery || null,
      source: 'Bigship Track'
    });
    bg.trackingHistory = extractTrackingHistory(tracking);
    order.markModified('bigship');
    await order.save();

    return {
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      awbCode: bg.awbCode,
      courierName: bg.courierName,
      status: bg.status,
      isRto: bg.isRto,
      tracking
    };
  }

  async cancelShipment(orderId, { cancelStoreOrder = false, cancelReason = 'Cancelled by seller' } = {}) {
    const order = await loadOrder(orderId);
    const bg = ensureBigshipSubdoc(order);
    if (!bg.customOrderId) {
      const err = new Error('No Bigship shipment to cancel.');
      err.statusCode = 400;
      throw err;
    }
    if (String(bg.status).toUpperCase().includes('CANCEL')) {
      return { alreadyExists: true, message: 'Bigship shipment already cancelled.', order, bigship: bg };
    }

    let raw = null;
    let draftOnly = false;
    try {
      raw = await bigshipClient.cancelOrder(bg.customOrderId, cancelReason);
    } catch (e) {
      if (/not manifested/i.test(e.message || '') && !bg.awbCode) {
        // Never booked: Bigship cannot cancel an unmanifested draft, but nothing was charged.
        // Detach it from this order; the idle draft can be deleted in the Bigship panel.
        draftOnly = true;
        raw = { message: e.message };
      } else if (!/already/i.test(e.message || '')) {
        throw e; // "already cancelled" on the Bigship side is fine
      } else {
        raw = { message: e.message };
      }
    }

    bg.status = 'Cancelled';
    bg.lastUpdatedAt = new Date();
    bg.errorMessage = '';
    order.markModified('bigship');
    await order.save();

    if (cancelStoreOrder && order.status !== 'CANCELLED' && order.status !== 'DELIVERED') {
      try {
        const { cancelOrder } = await import('./orderService.js');
        await cancelOrder(order._id, {
          cancelledBy: 'ADMIN',
          cancelReason: 'Cancelled with Bigship shipment',
          isAdmin: true
        });
      } catch (e) {
        console.warn('[Bigship] Store order cancel after shipment cancel note:', e.message);
      }
    }

    return {
      message: draftOnly
        ? 'Draft was never booked, so nothing was charged. It is detached from this order; you can delete the idle draft in the Bigship panel.'
        : 'Bigship cancellation requested.',
      order,
      bigship: bg,
      raw
    };
  }

  /** Best-effort cancel on Bigship when the store order is cancelled. */
  async tryCancelForOrder(orderId) {
    if (!this.isReady()) return null;
    try {
      const order = await loadOrder(orderId);
      const bg = ensureBigshipSubdoc(order);
      if (!bg.customOrderId) return null;
      if (String(bg.status).toUpperCase().includes('CANCEL')) return null;
      return await this.cancelShipment(orderId, { cancelStoreOrder: false });
    } catch (e) {
      console.warn('[Bigship] tryCancelForOrder note:', e.message);
      return { error: e.message };
    }
  }

  /** Create → place order (AWB) → label → invoice (documents best-effort). */
  async fulfillOrder(orderId, options = {}) {
    const created = await this.createShipmentForOrder(orderId, options);
    const steps = { created, awb: null, label: null, invoice: null, errors: [] };

    try {
      steps.awb = await this.assignCourierAndGenerateAwb(orderId, { courierId: options.courierId });
    } catch (e) {
      console.warn('[Bigship] AWB step failed:', e.message);
      steps.errors.push({ step: 'awb', message: e.message });
      steps.order = await loadOrder(orderId);
      return steps;
    }

    for (const [step, fn] of [['label', 'generateLabel'], ['invoice', 'generateInvoice']]) {
      try {
        steps[step] = await this[fn](orderId);
      } catch (e) {
        console.warn(`[Bigship] ${step} step failed:`, e.message);
        steps.errors.push({ step, message: e.message });
      }
    }

    steps.order = await loadOrder(orderId);
    return steps;
  }

  /**
   * Push the order to Bigship when admin marks the order PACKED.
   * BIGSHIP_AUTO_FULFILL: create (draft only) | awb (+ place order, charges wallet) | full (+ documents)
   */
  async tryAutoCreate(orderId) {
    if (!env.BIGSHIP.AUTO_CREATE) {
      console.warn('[Bigship] AUTO_CREATE is disabled — skipping');
      return null;
    }

    if (!this.isReady()) {
      const msg =
        'Bigship credentials missing on server. Set BIGSHIP_USER_NAME, BIGSHIP_PASSWORD and BIGSHIP_ACCESS_KEY.';
      console.warn(`[Bigship] ${msg}`);
      try {
        const order = await loadOrder(orderId);
        const bg = ensureBigshipSubdoc(order);
        if (!bg.customOrderId) {
          bg.errorMessage = msg;
          bg.lastUpdatedAt = new Date();
          order.markModified('bigship');
          await order.save();
        }
      } catch {
        /* ignore */
      }
      return { error: msg };
    }

    const level = this.getAutoFulfillLevel();
    try {
      if (level === 'full') {
        const result = await this.fulfillOrder(orderId);
        if (result.errors?.length) console.warn('[Bigship] Auto-fulfill partial errors:', result.errors);
        return result;
      }

      const created = await this.createShipmentForOrder(orderId);
      if (level === 'awb' && !created.alreadyExists) {
        try {
          const awb = await this.assignCourierAndGenerateAwb(orderId);
          return { ...created, awb };
        } catch (e) {
          console.warn('[Bigship] Auto AWB failed (order still created):', e.message);
          return { ...created, awbError: e.message };
        }
      }
      console.log(`[Bigship] Auto-create OK for ${orderId}: ${created.bigship?.customOrderId}`);
      return created;
    } catch (err) {
      console.warn('[Bigship] Auto-create skipped/failed:', err.message);
      return { error: err.message };
    }
  }

  /**
   * Background tracking sync for shipments that have an AWB and are not finished.
   * Bigship has no webhooks, so this is how status/delivery gets into the store.
   */
  async syncActiveShipments({ limit = 40, gapMs = 800 } = {}) {
    if (!this.isReady()) return { skipped: true, reason: 'not configured' };
    const orders = await Order.find({
      'bigship.awbCode': { $nin: ['', null] },
      status: { $nin: ['DELIVERED', 'CANCELLED'] }
    })
      .sort({ 'bigship.lastSyncedAt': 1 })
      .limit(limit)
      .select('_id orderNumber');

    let ok = 0;
    let failed = 0;
    for (const o of orders) {
      try {
        await this.trackShipment(o._id);
        ok += 1;
      } catch (e) {
        failed += 1;
        console.warn(`[Bigship Sync] ${o.orderNumber}: ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, gapMs));
    }
    return { checked: orders.length, ok, failed };
  }
}

export const bigshipFulfillmentService = new BigshipFulfillmentService();
export default bigshipFulfillmentService;
