import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import { isOtpDemoMode } from '../services/smsService.js';

/**
 * OTP login is switched off: customers use mobile number + password.
 * Without a real SMS gateway the OTP flow accepts a fixed demo code, which would let
 * anyone into any account. Set OTP_LOGIN_ENABLED=true only once SMS_API_KEY is real
 * and OTP_DEMO_MODE=false.
 */
export const requireOtpLogin = (req, res, next) => {
  if (String(process.env.OTP_LOGIN_ENABLED || '').trim().toLowerCase() === 'true' && !isOtpDemoMode()) {
    return next();
  }
  return sendError(
    res,
    'OTP login is not available. Please log in with your mobile number and password.',
    { reason: 'OTP_DISABLED' },
    HTTP_STATUS.FORBIDDEN
  );
};
