import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import { normalizePhone } from '../services/smsService.js';

/**
 * Validate phone number for OTP dispatch
 */
export const validateSendOtp = (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return sendError(
      res,
      'Mobile number is required.',
      { field: 'phone', reason: 'REQUIRED' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const normalized = normalizePhone(phone);
  if (!/^\d{10}$/.test(normalized)) {
    return sendError(
      res,
      'Please enter a valid 10-digit mobile number.',
      { field: 'phone', reason: 'INVALID_FORMAT' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  req.body.phone = normalized;
  next();
};

/**
 * Validate phone and OTP for verification
 */
export const validateVerifyOtp = (req, res, next) => {
  const { phone, otp } = req.body;

  if (!phone) {
    return sendError(
      res,
      'Mobile number is required.',
      { field: 'phone', reason: 'REQUIRED' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const normalized = normalizePhone(phone);
  if (!/^\d{10}$/.test(normalized)) {
    return sendError(
      res,
      'Please enter a valid 10-digit mobile number.',
      { field: 'phone', reason: 'INVALID_FORMAT' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (!otp || String(otp).trim().length !== 6 || !/^\d{6}$/.test(String(otp).trim())) {
    return sendError(
      res,
      'Please enter a valid 6-digit OTP code.',
      { field: 'otp', reason: 'INVALID_FORMAT' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  req.body.phone = normalized;
  req.body.otp = String(otp).trim();
  next();
};

export const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // bcrypt ignores anything longer

const bad = (res, message, field) =>
  sendError(res, message, { field, reason: 'INVALID' }, HTTP_STATUS.BAD_REQUEST);

export const passwordProblem = (value) => {
  if (typeof value !== 'string' || !value) return 'Please enter a password.';
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (Buffer.byteLength(value, 'utf8') > PASSWORD_MAX) return 'Password is too long.';
  return '';
};

const cleanPhone = (raw) => {
  const phone = normalizePhone(typeof raw === 'string' ? raw : '');
  return /^[6-9]\d{9}$/.test(phone) ? phone : '';
};

/** Sign up: name, phone, email (optional), password, confirm password */
export const validateRegister = (req, res, next) => {
  const { name, phone, email, password, confirmPassword } = req.body || {};
  const fullName = typeof name === 'string' ? name.replace(/\s+/g, ' ').trim() : '';
  if (fullName.length < 2 || !/\p{L}/u.test(fullName)) return bad(res, 'Please enter your name.', 'name');
  if (fullName.length > 100) return bad(res, 'Name cannot exceed 100 characters.', 'name');

  const normalized = cleanPhone(phone);
  if (!normalized) return bad(res, 'Please enter a valid 10-digit mobile number.', 'phone');

  if (email !== undefined && email !== null && typeof email !== 'string') {
    return bad(res, 'Please enter a valid email address.', 'email');
  }
  const mail = String(email || '').trim().toLowerCase();
  if (mail && (mail.length > 254 || !/^\w+([.+-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(mail))) {
    return bad(res, 'Please enter a valid email address.', 'email');
  }
  // The stored email pattern does not allow "+" addresses
  if (mail.includes('+')) return bad(res, 'Please use an email address without a "+".', 'email');

  const problem = passwordProblem(password);
  if (problem) return bad(res, problem, 'password');
  if (password !== confirmPassword) return bad(res, 'Passwords do not match.', 'confirmPassword');

  req.body = { name: fullName, phone: normalized, email: mail, password };
  next();
};

export const validateCheckPhone = (req, res, next) => {
  const normalized = cleanPhone(req.body?.phone);
  if (!normalized) return bad(res, 'Please enter a valid 10-digit mobile number.', 'phone');
  req.body = { phone: normalized };
  next();
};

export const validateForgotPassword = (req, res, next) => {
  const raw = req.body?.email;
  const mail = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!mail || mail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
    return bad(res, 'Please enter a valid email address.', 'email');
  }
  req.body = { email: mail };
  next();
};

const cleanToken = (raw) => (typeof raw === 'string' && /^[a-f\d]{64}$/.test(raw.trim()) ? raw.trim() : '');
const BAD_LINK = 'This reset link is invalid or has expired. Please ask for a new one.';

export const validateResetToken = (req, res, next) => {
  const token = cleanToken(req.body?.token);
  if (!token) return bad(res, BAD_LINK, 'token');
  req.body = { token };
  next();
};

export const validateResetPassword = (req, res, next) => {
  const { newPassword, confirmPassword } = req.body || {};
  const token = cleanToken(req.body?.token);
  if (!token) return bad(res, BAD_LINK, 'token');
  const problem = passwordProblem(newPassword);
  if (problem) return bad(res, problem, 'newPassword');
  if (newPassword !== confirmPassword) return bad(res, 'Passwords do not match.', 'confirmPassword');
  req.body = { token, newPassword };
  next();
};

export const validatePasswordLogin = (req, res, next) => {
  const { phone, password } = req.body || {};
  const normalized = cleanPhone(phone);
  if (!normalized) return bad(res, 'Please enter a valid 10-digit mobile number.', 'phone');
  if (typeof password !== 'string' || !password || password.length > 200) {
    return bad(res, 'Please enter your password.', 'password');
  }
  req.body = { phone: normalized, password };
  next();
};

export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  const problem = passwordProblem(newPassword);
  if (problem) return bad(res, problem, 'newPassword');
  if (newPassword !== confirmPassword) return bad(res, 'Passwords do not match.', 'confirmPassword');
  req.body = { currentPassword: String(currentPassword || ''), newPassword };
  next();
};

/**
 * Validate user profile updates
 */
export const validateUpdateProfile = (req, res, next) => {
  const { name, email, phone } = req.body;

  if (name !== undefined && typeof name !== 'string') {
    return sendError(
      res,
      'Name must be a string.',
      { field: 'name', reason: 'INVALID_TYPE' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (email !== undefined && email !== null && String(email).trim() !== '') {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(String(email).trim())) {
      return sendError(
        res,
        'Please enter a valid email address.',
        { field: 'email', reason: 'INVALID_FORMAT' },
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
    const digits = String(phone).replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      return sendError(
        res,
        'Please enter a valid 10-digit mobile number.',
        { field: 'phone', reason: 'INVALID_FORMAT' },
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  next();
};

export default {
  validateSendOtp,
  validateVerifyOtp,
  validateUpdateProfile
};
