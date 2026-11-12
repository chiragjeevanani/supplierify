import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import { HEX_COLOR, cleanImageUrl } from '../utils/safeUrl.js';

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

export const ALLOWED_SETTINGS_FIELDS = [
  'gstRate',
  'minOrderQtyKg',
  'whatsappNumber',
  'whatsappGreeting',
  'logoUrl',
  'faviconUrl',
  'theme',
  'fontScale',
  'creditEnabled',
  'creditEligibilityAmount',
  'creditLimit',
  'creditDueDays',
  'standardDeliveryFee',
  'codDeliveryFee',
  'freeDeliveryThreshold',
  'lowStockThreshold',
  'warehouseName',
  'warehouseAddress',
  'warehouseCity',
  'warehouseState',
  'warehousePincode',
  'warehousePhone',
  'hubAddress',
  'storeName',
  'storeEmail',
  'supportEmail',
  'storePhone',
  'supportPhone',
  'currency',
  'storeAddress',
  'timezone',
  'helpSupport'
];

/**
 * Validate Admin Settings Update payload
 */
export const validateUpdateSettings = (req, res, next) => {
  const body = req.body;
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
    return sendError(
      res,
      'Settings update payload must be a non-empty object',
      { field: 'body', reason: 'EMPTY_PAYLOAD' },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  // Ignore unknown keys (e.g. _id, configKey, createdAt from client form state)
  // Keep only allowed fields on the request body for downstream update
  const sanitizedBody = {};
  for (const key of ALLOWED_SETTINGS_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      sanitizedBody[key] = body[key];
    }
  }
  if (Object.keys(sanitizedBody).length === 0) {
    return sendError(
      res,
      'No valid settings fields provided to update',
      { allowedFields: ALLOWED_SETTINGS_FIELDS },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }
  req.body = sanitizedBody;

  // 1. GST Rate validation
  if (body.gstRate !== undefined) {
    const gst = Number(body.gstRate);
    if (isNaN(gst) || gst < 0 || gst > 100) {
      errors.push({ field: 'gstRate', message: 'GST rate must be a valid number between 0 and 100' });
    }
  }

  if (body.minOrderQtyKg !== undefined) {
    const minQty = Number(body.minOrderQtyKg);
    if (isNaN(minQty) || minQty < 1) {
      errors.push({ field: 'minOrderQtyKg', message: 'Minimum order quantity must be at least 1 kg' });
    }
  }

  if (body.theme !== undefined) {
    if (!body.theme || typeof body.theme !== 'object' || Array.isArray(body.theme)) {
      errors.push({ field: 'theme', message: 'Theme must be an object of colours' });
    } else {
      for (const key of ['primary', 'accent', 'background', 'text']) {
        if (body.theme[key] !== undefined && !HEX_COLOR.test(String(body.theme[key]).trim())) {
          errors.push({ field: `theme.${key}`, message: 'Colours must be in #RRGGBB format' });
        }
      }
    }
  }

  for (const key of ['creditEligibilityAmount', 'creditLimit']) {
    if (body[key] !== undefined) {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < 0) errors.push({ field: key, message: 'Credit amounts must be 0 or more' });
    }
  }
  if (body.creditDueDays !== undefined) {
    const d = Number(body.creditDueDays);
    if (!Number.isFinite(d) || d < 1 || d > 365) errors.push({ field: 'creditDueDays', message: 'Payment due days must be between 1 and 365' });
  }
  if (body.creditEnabled !== undefined && typeof body.creditEnabled !== 'boolean') {
    errors.push({ field: 'creditEnabled', message: 'Credit on/off must be true or false' });
  }

  if (body.fontScale !== undefined) {
    const scale = Number(body.fontScale);
    if (!Number.isFinite(scale) || scale < 85 || scale > 125) {
      errors.push({ field: 'fontScale', message: 'Text size must be between 85% and 125%' });
    }
  }

  for (const key of ['logoUrl', 'faviconUrl']) {
    if (body[key] !== undefined && body[key] !== '' && !cleanImageUrl(body[key])) {
      errors.push({ field: key, message: 'Please upload an image or use a valid https:// image address' });
    }
  }

  if (body.whatsappNumber !== undefined && body.whatsappNumber !== '') {
    const digits = String(body.whatsappNumber).replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      errors.push({ field: 'whatsappNumber', message: 'WhatsApp number must be 10-15 digits including country code' });
    }
  }

  if (body.whatsappGreeting !== undefined && String(body.whatsappGreeting).trim().length > 120) {
    errors.push({ field: 'whatsappGreeting', message: 'WhatsApp greeting cannot exceed 120 characters' });
  }

  // 2. Standard Delivery Fee validation
  if (body.standardDeliveryFee !== undefined) {
    const fee = Number(body.standardDeliveryFee);
    if (isNaN(fee) || fee < 0) {
      errors.push({ field: 'standardDeliveryFee', message: 'Standard delivery fee must be a non-negative number' });
    }
  }

  if (body.codDeliveryFee !== undefined) {
    const fee = Number(body.codDeliveryFee);
    if (isNaN(fee) || fee < 0) {
      errors.push({ field: 'codDeliveryFee', message: 'COD delivery fee must be a non-negative number' });
    }
  }

  // 3. Free Delivery Threshold validation
  if (body.freeDeliveryThreshold !== undefined) {
    const threshold = Number(body.freeDeliveryThreshold);
    if (isNaN(threshold) || threshold < 0) {
      errors.push({ field: 'freeDeliveryThreshold', message: 'Free delivery threshold must be a non-negative number' });
    }
  }

  // 4. Low Stock Threshold validation
  if (body.lowStockThreshold !== undefined) {
    const lowStock = Number(body.lowStockThreshold);
    if (isNaN(lowStock) || lowStock < 0) {
      errors.push({ field: 'lowStockThreshold', message: 'Low stock threshold must be a non-negative number' });
    }
  }

  // 5. Email validations
  if (body.storeEmail !== undefined && body.storeEmail !== '') {
    if (!emailRegex.test(String(body.storeEmail).trim())) {
      errors.push({ field: 'storeEmail', message: 'Store email must be a valid email address' });
    }
  }

  if (body.supportEmail !== undefined && body.supportEmail !== '') {
    if (!emailRegex.test(String(body.supportEmail).trim())) {
      errors.push({ field: 'supportEmail', message: 'Support email must be a valid email address' });
    }
  }

  if (body.helpSupport !== undefined) {
    if (!body.helpSupport || typeof body.helpSupport !== 'object' || Array.isArray(body.helpSupport)) {
      errors.push({ field: 'helpSupport', message: 'Help & Support must be an object' });
    } else {
      const hs = body.helpSupport;
      if (hs.email !== undefined && hs.email !== '' && !emailRegex.test(String(hs.email).trim())) {
        errors.push({ field: 'helpSupport.email', message: 'Help & Support email must be a valid email address' });
      }
      if (hs.faqs !== undefined) {
        if (!Array.isArray(hs.faqs)) {
          errors.push({ field: 'helpSupport.faqs', message: 'FAQs must be an array' });
        } else if (hs.faqs.length > 20) {
          errors.push({ field: 'helpSupport.faqs', message: 'Maximum 20 FAQs allowed' });
        } else {
          hs.faqs.forEach((f, i) => {
            if (!f || typeof f !== 'object' || !String(f.q || '').trim() || !String(f.a || '').trim()) {
              errors.push({
                field: `helpSupport.faqs[${i}]`,
                message: 'Each FAQ needs a non-empty question and answer'
              });
            }
          });
        }
      }
    }
  }

  // 6. Pincode validation
  if (body.warehousePincode !== undefined && body.warehousePincode !== '') {
    if (!pincodeRegex.test(String(body.warehousePincode).trim())) {
      errors.push({ field: 'warehousePincode', message: 'Warehouse pincode must be a valid 6-digit Indian PIN code' });
    }
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for store settings update',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export default {
  ALLOWED_SETTINGS_FIELDS,
  validateUpdateSettings
};
