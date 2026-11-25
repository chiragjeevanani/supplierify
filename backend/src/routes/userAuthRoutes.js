import { Router } from 'express';
import userAuthController from '../controllers/userAuthController.js';
import {
  validateSendOtp,
  validateVerifyOtp,
  validateUpdateProfile,
  validateRegister,
  validatePasswordLogin,
  validateCheckPhone,
  validateChangePassword
} from '../validations/userAuthValidation.js';
import { otpRequestLimiter, otpVerifyLimiter, passwordLoginLimiter, registerLimiter, changePasswordLimiter, phoneCheckLimiter } from '../middleware/rateLimiter.js';
import { requireOtpLogin } from '../middleware/otpGate.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';

const router = Router();

/** Sign up and log in with mobile number + password */
router.post('/check', phoneCheckLimiter, validateCheckPhone, userAuthController.checkPhone);
router.post('/register', registerLimiter, validateRegister, userAuthController.register);
router.post('/login', passwordLoginLimiter, validatePasswordLogin, userAuthController.login);
router.patch('/password', authMiddleware, requireUser, changePasswordLimiter, validateChangePassword, userAuthController.changePassword);

/**
 * @route   POST /api/v1/auth/user/send-otp
 * @desc    Send 6-digit OTP to user mobile number
 * @access  Public (Rate-limited)
 */
router.post('/send-otp', requireOtpLogin, otpRequestLimiter, validateSendOtp, userAuthController.sendOtp);

/**
 * @route   POST /api/v1/auth/user/verify-otp
 * @desc    Verify OTP and log in / register user
 * @access  Public (Rate-limited)
 */
router.post('/verify-otp', requireOtpLogin, otpVerifyLimiter, validateVerifyOtp, userAuthController.verifyOtp);

/**
 * @route   GET /api/v1/auth/user/profile
 * @desc    Get current user profile
 * @access  Protected (User Only)
 */
router.get('/profile', authMiddleware, requireUser, userAuthController.getProfile);

/**
 * @route   PATCH /api/v1/auth/user/profile
 * @desc    Update current user profile (name, email, address)
 * @access  Protected (User Only)
 */
router.patch('/profile', authMiddleware, requireUser, validateUpdateProfile, userAuthController.updateProfile);

export default router;
