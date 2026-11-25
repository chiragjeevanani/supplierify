import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Address from '../models/Address.js';
import otpService from './otpService.js';
import smsService, { normalizePhone } from './smsService.js';
import { generateToken } from '../utils/generateToken.js';
import { ROLES } from '../constants/roles.js';
import { ACCOUNT_STATUS, HTTP_STATUS } from '../constants/status.js';

const fail = (message, statusCode, reason) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.reason = reason;
  return err;
};

// Compared against when the number is unknown, so both cases take about the same time
const DUMMY_HASH = bcrypt.hashSync('no-such-account', 10);

const BLOCKED_MESSAGE = 'Your account is blocked. Please contact customer support.';

class UserAuthService {
  /** Issue the customer JWT and the safe user object */
  buildSession(user) {
    const token = generateToken({
      id: user._id.toString(),
      role: ROLES.USER,
      phone: user.phone
    });
    return { token, user: user.toJSON() };
  }

  /**
   * An account made earlier without a password can be completed from the sign-up form only
   * when it holds nothing personal. The phone number is not verified, so anything else
   * would let a stranger who knows the number read it.
   */
  async isEmptyAccount(user) {
    if (user.name || user.email || user.addresses?.length) return false;
    if (typeof user.creditLimitOverride === 'number') return false;
    const [order, address] = await Promise.all([
      Order.exists({ user: user._id }),
      Address.exists({ user: user._id })
    ]);
    return !order && !address;
  }

  /**
   * First step of the login screen: what should this number be asked for next?
   * 'password' (it has an account), 'signup' (new), or 'contact' (older account the store
   * must set a password for).
   */
  async checkPhone(phone) {
    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user) return { phone, step: 'signup' };
    if (user.status === ACCOUNT_STATUS.BLOCKED) {
      throw fail(BLOCKED_MESSAGE, HTTP_STATUS.FORBIDDEN, 'ACCOUNT_BLOCKED');
    }
    if (user.passwordHash) return { phone, step: 'password' };
    if (user.status === ACCOUNT_STATUS.ACTIVE && (await this.isEmptyAccount(user))) {
      return { phone, step: 'signup' };
    }
    return { phone, step: 'contact' };
  }

  /** Create an account with name, phone and password (email optional) */
  async register({ name, phone, email, password }) {
    const existing = await User.findOne({ phone }).select('+passwordHash');

    if (existing) {
      if (existing.status === ACCOUNT_STATUS.BLOCKED) {
        throw fail(BLOCKED_MESSAGE, HTTP_STATUS.FORBIDDEN, 'ACCOUNT_BLOCKED');
      }
      if (existing.passwordHash) {
        throw fail('An account with this mobile number already exists. Please log in.', HTTP_STATUS.CONFLICT, 'PHONE_EXISTS');
      }
      if (existing.status !== ACCOUNT_STATUS.ACTIVE || !(await this.isEmptyAccount(existing))) {
        throw fail(
          'This mobile number already has an account. Please contact us and we will set a password for you.',
          HTTP_STATUS.CONFLICT,
          'PASSWORD_NOT_SET'
        );
      }
    }

    if (email) {
      const owner = await User.findOne({ email, ...(existing ? { _id: { $ne: existing._id } } : {}) });
      if (owner) {
        throw fail('This email address is already in use by another account.', HTTP_STATUS.CONFLICT, 'EMAIL_EXISTS');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = existing || new User({ phone, role: ROLES.USER, status: ACCOUNT_STATUS.ACTIVE });
    user.passwordHash = passwordHash;
    user.name = name;
    if (email) user.email = email;
    user.isVerified = false; // number not verified by OTP
    user.lastLoginAt = new Date();

    try {
      await user.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw fail('An account with this mobile number or email already exists. Please log in.', HTTP_STATUS.CONFLICT, 'DUPLICATE');
      }
      throw error;
    }

    return this.buildSession(user);
  }

  /** Log in with phone + password */
  async loginWithPassword({ phone, password }) {
    const user = await User.findOne({ phone, deletedAt: null }).select('+passwordHash');
    const matches = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

    if (user && !user.passwordHash) {
      throw fail(
        'No password is set for this number yet. Please contact us and we will set one for you.',
        HTTP_STATUS.UNAUTHORIZED,
        'PASSWORD_NOT_SET'
      );
    }
    if (!user || !matches) {
      throw fail('Incorrect mobile number or password.', HTTP_STATUS.UNAUTHORIZED, 'INVALID_CREDENTIALS');
    }
    if (user.status === ACCOUNT_STATUS.BLOCKED) {
      throw fail(BLOCKED_MESSAGE, HTTP_STATUS.FORBIDDEN, 'ACCOUNT_BLOCKED');
    }
    if (user.status === ACCOUNT_STATUS.INACTIVE) {
      throw fail('Your account is currently inactive. Please contact customer support.', HTTP_STATUS.FORBIDDEN, 'ACCOUNT_INACTIVE');
    }

    user.lastLoginAt = new Date();
    await user.save();
    return this.buildSession(user);
  }

  /** Logged-in customer changes their own password; returns a fresh session */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw fail('User account not found.', HTTP_STATUS.NOT_FOUND);
    if (user.passwordHash && !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      // 400, not 401: the session itself is still valid
      throw fail('Your current password is incorrect.', HTTP_STATUS.BAD_REQUEST, 'WRONG_PASSWORD');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();
    await user.save();
    return this.buildSession(user);
  }

  /** Admin sets a password for a customer (forgotten password, or an older account without one) */
  async setPasswordByAdmin(userId, password) {
    const user = await User.findOne({ _id: userId, role: ROLES.USER, deletedAt: null });
    if (!user) throw fail('Customer not found.', HTTP_STATUS.NOT_FOUND);
    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordChangedAt = new Date(); // signs the customer out everywhere
    await user.save();
    return user.toJSON();
  }

  /**
   * Send OTP to a user's mobile number
   * @param {string} rawPhone
   * @returns {Promise<{ message: string, phone: string, isNewUser: boolean, retryAfterSeconds: number }>}
   */
  async requestOtp(rawPhone) {
    const phone = normalizePhone(rawPhone);

    if (!phone || phone.length < 10) {
      const err = new Error('Please provide a valid 10-digit mobile number.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Check if user is registered and whether they are active
    const existingUser = await User.findOne({ phone });

    if (existingUser && existingUser.status === ACCOUNT_STATUS.BLOCKED) {
      const err = new Error('Your account is blocked. Please contact support.');
      err.statusCode = HTTP_STATUS.FORBIDDEN;
      throw err;
    }

    // Generate, hash, and store OTP with cooldown & TTL
    const { otp, retryAfterSeconds, demoMode } = await otpService.generateAndSaveOtp(phone);

    // Send OTP via SMS gateway (or console/demo mode)
    const smsResult = await smsService.sendOtpSms(phone, otp);

    if (!smsResult.success) {
      const err = new Error(
        smsResult.error
          ? `Unable to send OTP SMS: ${smsResult.error}`
          : 'Unable to send OTP SMS. Please try again shortly.'
      );
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      err.reason = 'SMS_SEND_FAILED';
      throw err;
    }

    const inDemo = Boolean(demoMode || smsResult.demoMode);

    return {
      message: inDemo
        ? 'OTP ready. SMS gateway is in demo mode — use code 123456.'
        : 'OTP sent successfully to your mobile number.',
      phone,
      isNewUser: !existingUser,
      retryAfterSeconds,
      demoMode: inDemo
    };
  }

  /**
   * Verify OTP and complete user registration or login
   * @param {string} rawPhone
   * @param {string} otp
   * @returns {Promise<{ token: string, user: object, isNewUser: boolean }>}
   */
  async verifyOtpAndLogin(rawPhone, otp) {
    const phone = normalizePhone(rawPhone);

    if (!phone || phone.length < 10) {
      const err = new Error('Please provide a valid 10-digit mobile number.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (!otp || String(otp).trim().length !== 6) {
      const err = new Error('Please provide a valid 6-digit OTP code.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Verify OTP securely
    const verifyResult = await otpService.verifyOtp(phone, otp);

    if (!verifyResult.success) {
      const err = new Error(verifyResult.message || 'Invalid or expired OTP.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      err.reason = verifyResult.reason;
      err.remainingAttempts = verifyResult.remainingAttempts;
      throw err;
    }

    // OTP is valid - Check if user exists or create new user
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      // Auto-register new user with verified status
      user = await User.create({
        phone,
        name: '',
        role: ROLES.USER,
        status: ACCOUNT_STATUS.ACTIVE,
        isVerified: true,
        lastLoginAt: new Date()
      });
      isNewUser = true;
    } else {
      if (user.status === ACCOUNT_STATUS.BLOCKED) {
        const err = new Error('Your account is blocked. Please contact customer support.');
        err.statusCode = HTTP_STATUS.FORBIDDEN;
        throw err;
      }

      user.lastLoginAt = new Date();
      user.isVerified = true;
      await user.save();
    }

    // Issue JWT with USER role
    const token = generateToken({
      id: user._id.toString(),
      role: ROLES.USER,
      phone: user.phone
    });

    return {
      token,
      user: user.toJSON(),
      isNewUser
    };
  }

  /**
   * Get user profile by ID
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User account not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }
    return user.toJSON();
  }

  /**
   * Update user profile information
   * @param {string} userId
   * @param {object} updateData
   * @returns {Promise<object>}
   */
  async updateUserProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User account not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    // Check if email already taken by another user
    if (updateData.email !== undefined) {
      const rawEmail = String(updateData.email || '').trim().toLowerCase();
      if (rawEmail) {
        const existingWithEmail = await User.findOne({
          email: rawEmail,
          _id: { $ne: userId }
        });
        if (existingWithEmail) {
          const err = new Error('This email address is already in use by another account.');
          err.statusCode = HTTP_STATUS.CONFLICT;
          throw err;
        }
        user.email = rawEmail;
      } else {
        user.email = undefined;
      }
    }

    if (updateData.name !== undefined) {
      user.name = String(updateData.name || '').trim();
    }

    // Phone is login identity — allow update only if unique 10-digit number
    if (updateData.phone !== undefined) {
      const digits = String(updateData.phone || '').replace(/\D/g, '').slice(-10);
      if (digits.length !== 10) {
        const err = new Error('Please enter a valid 10-digit mobile number.');
        err.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw err;
      }
      if (digits !== user.phone) {
        const existingWithPhone = await User.findOne({
          phone: digits,
          _id: { $ne: userId }
        });
        if (existingWithPhone) {
          const err = new Error('This mobile number is already linked to another account.');
          err.statusCode = HTTP_STATUS.CONFLICT;
          throw err;
        }
        user.phone = digits;
      }
    }

    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar;
    }

    if (Array.isArray(updateData.addresses)) {
      user.addresses = updateData.addresses;
    }

    await user.save();
    return user.toJSON();
  }

  /**
   * Seed default client demo users if not present in database
   */
  async ensureDefaultDemoUsers() {
    // Never create a known demo account on a production database
    if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') return;
    try {
      const demoPhone = '9876543210';
      const existing = await User.findOne({ phone: demoPhone });

      if (!existing) {
        await User.create({
          name: 'Demo Customer',
          phone: demoPhone,
          email: 'demo@example.com',
          role: ROLES.USER,
          status: ACCOUNT_STATUS.ACTIVE,
          isVerified: true,
          avatar: '',
          addresses: [
            {
              street: 'Sample Street, Sample Area',
              city: 'Mumbai',
              state: 'Madhya Pradesh',
              postalCode: '400001',
              country: 'India',
              isDefault: true
            }
          ],
          lastLoginAt: new Date()
        });

        console.log(`[User Seeding] Seeded default Demo User: +91 ${demoPhone} (Demo Customer)`);
      }
    } catch (error) {
      console.error('[User Seeding Error] Could not seed default demo user:', error.message);
    }
  }
}

export const userAuthService = new UserAuthService();
export default userAuthService;
