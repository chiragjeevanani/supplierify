import { STATE_CODES } from '../constants/indiaStates.js';

const GSTIN_RE = /^([0-9]{2})[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const VALID_CODES = new Set(Object.values(STATE_CODES));

/** Returns the upper-cased GSTIN when it is well formed (15 chars, valid state code), else null. */
export const normalizeGstin = (value) => {
  const v = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!v) return '';
  const m = GSTIN_RE.exec(v);
  return m && VALID_CODES.has(m[1]) ? v : null;
};

/** Splits GST: same state = CGST + SGST (half each), different state = IGST. Amounts in rupees (2 decimals). */
export const splitGst = (tax, intraState) => {
  const t = Math.round((Number(tax) || 0) * 100) / 100;
  if (!intraState) return { cgst: 0, sgst: 0, igst: t };
  const half = Math.round((t / 2) * 100) / 100;
  return { cgst: half, sgst: Math.round((t - half) * 100) / 100, igst: 0 };
};

export default { normalizeGstin, splitGst };
