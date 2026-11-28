import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function resolveFrontendUrl() {
  const explicit = String(process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
  if (explicit) return explicit;

  const clients = String(process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== '*');

  // Prefer production HTTPS origin from the CORS allowlist
  const httpsProd = clients.find((s) => /^https:\/\//i.test(s));
  if (httpsProd) return httpsProd.replace(/\/$/, '');

  const firstClient = clients[0];
  if (firstClient) return firstClient.replace(/\/$/, '');
  // Local default when FRONTEND_URL / CLIENT_URL are unset
  return 'http://localhost:5173';
}

function resolveSmtpSecure() {
  const explicit = String(process.env.SMTP_SECURE || '').trim().toLowerCase();
  if (explicit === 'true' || explicit === '1') return true;
  if (explicit === 'false' || explicit === '0') return false;
  return Number(process.env.SMTP_PORT || 465) === 465;
}

const env = {
  PORT: process.env.PORT || 7000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/wholesale_db',
  JWT_SECRET: process.env.JWT_SECRET || 'default_dev_jwt_secret_key_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DNS_SERVERS: String(process.env.DNS_SERVERS || '').trim(),
  FRONTEND_URL: resolveFrontendUrl(),
  // Recovery inbox — forgot-password emails are ALWAYS sent here
  ADMIN_RECOVERY_EMAIL: String(process.env.ADMIN_RECOVERY_EMAIL || 'admin@supplierfy.com')
    .trim()
    .toLowerCase(),
  // Login identity for the recoverable super-admin account
  ADMIN_LOGIN_EMAIL: String(process.env.ADMIN_LOGIN_EMAIL || 'admin@supplierfy.com')
    .trim()
    .toLowerCase(),
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: process.env.SMTP_PORT || '465',
    SECURE: resolveSmtpSecure(),
    USER: process.env.SMTP_USER || '',
    // Gmail App Passwords are often pasted with spaces — strip them for SMTP auth
    PASS: String(process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    FROM: process.env.SMTP_FROM || process.env.SMTP_USER || ''
  },

  SMS: {
    // fast2sms | console (console = no real SMS; OTP logged / demo mode)
    PROVIDER: String(process.env.SMS_PROVIDER || 'fast2sms').trim().toLowerCase(),
    API_KEY: process.env.SMS_API_KEY || '',
    SENDER_ID: process.env.SMS_SENDER_ID || 'DRYFWS',
    TEMPLATE_ID: process.env.SMS_TEMPLATE_ID || ''
  },
  // true|false — when unset, demo OTP auto-enables if SMS_API_KEY is missing/placeholder
  OTP_DEMO_MODE: String(process.env.OTP_DEMO_MODE || '').trim().toLowerCase(),
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    IS_CONFIGURED: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  },
  FIREBASE: {
    SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/firebase-service-account.json',
    CONFIG_JSON: process.env.FIREBASE_CONFIG || '',
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID || ''
  },
  BIGSHIP: {
    // Bigship Unified Outbound API (https://api.bigship.direct/). Server-side only — never log these.
    USER_NAME: process.env.BIGSHIP_USER_NAME || '',
    PASSWORD: process.env.BIGSHIP_PASSWORD || '',
    ACCESS_KEY: process.env.BIGSHIP_ACCESS_KEY || '',
    BASE_URL: (process.env.BIGSHIP_BASE_URL || 'https://api.bigship.direct').replace(/\/$/, ''),
    // Numeric warehouse (pickup location) id from the Bigship panel. If empty, the first active warehouse is used.
    PICKUP_WAREHOUSE_ID: process.env.BIGSHIP_PICKUP_WAREHOUSE_ID || '',
    // Used for rate quotes when Admin Settings has no warehouse pincode
    PICKUP_PINCODE: process.env.BIGSHIP_PICKUP_PINCODE || '',
    // When true and credentials exist, push the order to Bigship when admin marks it Packed
    AUTO_CREATE: String(process.env.BIGSHIP_AUTO_CREATE || 'true').toLowerCase() !== 'false',
    // Checkout live rate quotes (set false to use store settings fees while testing)
    CHECKOUT_QUOTES: String(process.env.BIGSHIP_CHECKOUT_QUOTES || 'true').toLowerCase() !== 'false',
    // Auto pipeline depth: create | full
    // create = draft order only (no wallet charge; admin assigns the courier) | full = also place order + AWB (charges wallet)
    AUTO_FULFILL: String(process.env.BIGSHIP_AUTO_FULFILL || 'create').toLowerCase().trim(),
    // Background tracking sync (Bigship has no webhooks). Minutes; 0 disables.
    TRACK_SYNC_MINUTES: Number(process.env.BIGSHIP_TRACK_SYNC_MINUTES ?? 15),
    // Package fallbacks (kg / cm) — used only when product shipping fields are unset
    DEFAULT_WEIGHT_KG: process.env.BIGSHIP_DEFAULT_WEIGHT_KG ? Number(process.env.BIGSHIP_DEFAULT_WEIGHT_KG) : null,
    // Standard shipping box for one order (cm). Default 30x25x20 fits roughly 5 kg of dry fruits.
    DEFAULT_LENGTH_CM: Number(process.env.BIGSHIP_DEFAULT_LENGTH_CM) || 30,
    DEFAULT_BREADTH_CM: Number(process.env.BIGSHIP_DEFAULT_BREADTH_CM) || 25,
    DEFAULT_HEIGHT_CM: Number(process.env.BIGSHIP_DEFAULT_HEIGHT_CM) || 20,
    IS_CONFIGURED: Boolean(
      process.env.BIGSHIP_USER_NAME &&
      process.env.BIGSHIP_PASSWORD &&
      process.env.BIGSHIP_ACCESS_KEY
    )
  }
};

export default env;
