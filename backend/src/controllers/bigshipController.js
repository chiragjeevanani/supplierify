import bigshipFulfillmentService from '../services/bigshipFulfillmentService.js';
import bigshipClient from '../services/bigshipClient.js';
import { sendSuccess, sendError } from '../utils/response.js';
import env from '../config/env.js';

/** Runs a service call and shapes the HTTP reply the same way for every shipping action. */
const handle = (fn, { fallbackMessage, pick }) => async (req, res, next) => {
  try {
    const result = await fn(req);
    return sendSuccess(res, result?.message || fallbackMessage, pick ? pick(result) : result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.bigship || {}, error.statusCode);
    }
    next(error);
  }
};

const orderAndShipment = (r) => ({
  order: r.order,
  bigship: r.bigship,
  alreadyExists: r.alreadyExists
});

class BigshipController {
  async getConfigStatus(req, res, next) {
    try {
      const configured = bigshipClient.isConfigured();
      let wallet = null;
      let warehouses = [];
      let connectionError = null;
      if (configured) {
        try {
          const profile = await bigshipClient.getProfile();
          wallet = profile?.userWallet?.Balance != null ? Number(profile.userWallet.Balance) : null;
          warehouses = (await bigshipClient.listWarehouses()).map((w) => ({
            id: w.warehouseId,
            name: w.warehouseName,
            pincode: w.pincode,
            active: String(w.isActive) !== '0'
          }));
        } catch (e) {
          connectionError = e.message;
        }
      }
      return sendSuccess(res, 'Bigship configuration status', {
        configured,
        connected: configured && !connectionError,
        connectionError,
        walletBalance: wallet,
        autoCreate: env.BIGSHIP.AUTO_CREATE,
        autoFulfill: env.BIGSHIP.AUTO_FULFILL || 'create',
        pickupWarehouseId: env.BIGSHIP.PICKUP_WAREHOUSE_ID || null,
        warehouses,
        baseUrl: env.BIGSHIP.BASE_URL,
        trackingSyncMinutes: env.BIGSHIP.TRACK_SYNC_MINUTES
      });
    } catch (error) {
      next(error);
    }
  }

  createShipment = handle(
    (req) =>
      bigshipFulfillmentService.createShipmentForOrder(req.params.id, {
        force: Boolean(req.body?.force),
        pickupWarehouseId: req.body?.pickupWarehouseId,
        customerEmail: req.body?.customerEmail,
        skipServiceabilityCheck: Boolean(req.body?.skipServiceabilityCheck),
        package: req.body?.package
      }),
    { fallbackMessage: 'Shipment created', pick: orderAndShipment }
  );

  fulfill = handle(
    (req) =>
      bigshipFulfillmentService.fulfillOrder(req.params.id, {
        courierId: req.body?.courierId,
        pickupWarehouseId: req.body?.pickupWarehouseId
      }),
    { fallbackMessage: 'Bigship fulfillment pipeline executed' }
  );

  serviceability = handle((req) => bigshipFulfillmentService.checkServiceabilityForOrder(req.params.id), {
    fallbackMessage: 'Couriers fetched'
  });

  assignAwb = handle(
    (req) =>
      bigshipFulfillmentService.assignCourierAndGenerateAwb(req.params.id, {
        courierId: req.body?.courierId
      }),
    { fallbackMessage: 'AWB generated', pick: orderAndShipment }
  );

  generateLabel = handle((req) => bigshipFulfillmentService.generateLabel(req.params.id), {
    fallbackMessage: 'Label ready',
    pick: (r) => ({ ...orderAndShipment(r), labelUrl: r.labelUrl })
  });

  generateInvoice = handle((req) => bigshipFulfillmentService.generateInvoice(req.params.id), {
    fallbackMessage: 'Invoice ready',
    pick: (r) => ({ ...orderAndShipment(r), invoiceUrl: r.invoiceUrl })
  });

  generateManifest = handle((req) => bigshipFulfillmentService.generateManifest(req.params.id), {
    fallbackMessage: 'Manifest ready',
    pick: (r) => ({ ...orderAndShipment(r), manifestUrl: r.manifestUrl })
  });

  track = handle((req) => bigshipFulfillmentService.trackShipment(req.params.id), {
    fallbackMessage: 'Tracking synced'
  });

  cancelShipment = handle(
    (req) =>
      bigshipFulfillmentService.cancelShipment(req.params.id, {
        cancelStoreOrder: Boolean(req.body?.cancelOrder)
      }),
    { fallbackMessage: 'Shipment cancel requested', pick: orderAndShipment }
  );
}

export const bigshipController = new BigshipController();
export default bigshipController;
