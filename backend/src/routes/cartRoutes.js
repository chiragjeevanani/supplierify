import { Router } from 'express';
import cartController from '../controllers/cartController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware, requireUser);

// Cart endpoints
router.get('/', (req, res, next) => cartController.getCart(req, res, next));
router.post('/items', (req, res, next) => cartController.addItem(req, res, next));
router.put('/items', (req, res, next) => cartController.updateQty(req, res, next));
router.delete('/items', (req, res, next) => cartController.removeItem(req, res, next));
router.delete('/', (req, res, next) => cartController.clearCart(req, res, next));
router.post('/sync', (req, res, next) => cartController.syncCart(req, res, next));
router.post('/apply-coupon', (req, res, next) => cartController.applyCoupon(req, res, next));
router.post('/coupon', (req, res, next) => cartController.applyCoupon(req, res, next));
router.delete('/remove-coupon', (req, res, next) => cartController.removeCoupon(req, res, next));
router.post('/remove-coupon', (req, res, next) => cartController.removeCoupon(req, res, next));

export default router;
