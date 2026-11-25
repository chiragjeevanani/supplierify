import userAuthService from '../services/userAuthService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Controller for User Phone + OTP Authentication
 */
class UserAuthController {
  /**
   * Request OTP code to user's mobile number
   * POST /api/v1/auth/user/send-otp
   */
  async sendOtp(req, res, next) {
    try {
      const result = await userAuthService.requestOtp(req.body.phone);
      return sendSuccess(res, result.message, {
        phone: result.phone,
        isNewUser: result.isNewUser,
        retryAfterSeconds: result.retryAfterSeconds,
        demoMode: Boolean(result.demoMode)
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, { reason: error.reason, retryAfterSeconds: error.retryAfterSeconds }, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Verify OTP and log in / auto-register user
   * POST /api/v1/auth/user/verify-otp
   */
  async verifyOtp(req, res, next) {
    try {
      const result = await userAuthService.verifyOtpAndLogin(req.body.phone, req.body.otp);
      return sendSuccess(res, 'Authentication successful', {
        token: result.token,
        user: result.user,
        isNewUser: result.isNewUser
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(
          res,
          error.message,
          { reason: error.reason, remainingAttempts: error.remainingAttempts },
          error.statusCode
        );
      }
      next(error);
    }
  }

  /**
   * What to ask for next on the login screen
   * POST /api/v1/auth/user/check
   */
  async checkPhone(req, res, next) {
    try {
      const result = await userAuthService.checkPhone(req.body.phone);
      return sendSuccess(res, 'OK', result);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, { reason: error.reason }, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Sign up with phone + password
   * POST /api/v1/auth/user/register
   */
  async register(req, res, next) {
    try {
      const result = await userAuthService.register(req.body);
      return sendSuccess(res, 'Account created successfully', result, HTTP_STATUS.CREATED);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, { reason: error.reason }, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Log in with phone + password
   * POST /api/v1/auth/user/login
   */
  async login(req, res, next) {
    try {
      const result = await userAuthService.loginWithPassword(req.body);
      return sendSuccess(res, 'Authentication successful', result);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, { reason: error.reason }, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Change own password
   * PATCH /api/v1/auth/user/password (Protected)
   */
  async changePassword(req, res, next) {
    try {
      const result = await userAuthService.changePassword(req.user._id, req.body);
      return sendSuccess(res, 'Password changed successfully', result);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, { reason: error.reason }, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Fetch authenticated user's profile
   * GET /api/v1/auth/user/profile (Protected)
   */
  async getProfile(req, res, next) {
    try {
      const user = await userAuthService.getUserProfile(req.user._id);
      return sendSuccess(res, 'Profile retrieved successfully', { user });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Update authenticated user's profile
   * PATCH /api/v1/auth/user/profile (Protected)
   */
  async updateProfile(req, res, next) {
    try {
      const user = await userAuthService.updateUserProfile(req.user._id, req.body);
      return sendSuccess(res, 'Profile updated successfully', { user });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const userAuthController = new UserAuthController();
export default userAuthController;
