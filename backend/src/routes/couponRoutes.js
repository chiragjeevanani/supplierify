import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import couponController from '../controllers/couponController.js';
import { validateValidateCoupon } from '../validations/couponValidation.js';

const router = Router();

// The store is for signed-in accounts only (customer or admin)
router.use(authMiddleware);

/**
 * @route   POST /api/v1/coupons/validate
 * @desc    Validate coupon code against order subtotal and calculate discount
 * @access  Public / Customer
 */
router.post('/validate', validateValidateCoupon, (req, res, next) =>
  couponController.validateCoupon(req, res, next)
);

// Fallback for root POST
router.post('/', validateValidateCoupon, (req, res, next) =>
  couponController.validateCoupon(req, res, next)
);

export default router;
