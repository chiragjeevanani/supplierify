import { Router } from 'express';
import bigshipController from '../controllers/bigshipController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { validateOrderId } from '../validations/orderValidation.js';

const router = Router();

router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/shipping/status
 * @desc    Bigship connection status, wallet balance and warehouses (no secrets returned)
 */
router.get('/status', bigshipController.getConfigStatus);

/**
 * Order-scoped shipping actions. Also mounted at /api/v1/admin/orders/:id/shipping/* (see app.js).
 */
router.post('/orders/:id/create', validateOrderId, bigshipController.createShipment);
router.post('/orders/:id/fulfill', validateOrderId, bigshipController.fulfill);
router.get('/orders/:id/serviceability', validateOrderId, bigshipController.serviceability);
router.post('/orders/:id/awb', validateOrderId, bigshipController.assignAwb);
router.post('/orders/:id/label', validateOrderId, bigshipController.generateLabel);
router.post('/orders/:id/invoice', validateOrderId, bigshipController.generateInvoice);
router.post('/orders/:id/manifest', validateOrderId, bigshipController.generateManifest);
router.get('/orders/:id/track', validateOrderId, bigshipController.track);
router.post('/orders/:id/cancel', validateOrderId, bigshipController.cancelShipment);

export default router;
