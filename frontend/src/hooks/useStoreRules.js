import { useEffect, useState } from 'react';
import { settingsApi } from '../utils/api';
import { BRAND } from '../config/brand';
import { unitOf } from '../utils/units';
import { DEFAULT_THEME, normalizeTheme, DEFAULT_FONT_SCALE, normalizeFontScale } from '../utils/theme';

/**
 * Public store settings (cached for the page session):
 *   minOrderQtyKg  - store-wide minimum kg per product line
 *   whatsappNumber - digits only, with country code
 *   logoUrl / faviconUrl / theme - branding managed by the admin
 */
const DEFAULTS = {
  storeName: BRAND.name,
  minOrderQtyKg: BRAND.defaultMinOrderQtyKg,
  whatsappNumber: BRAND.defaultWhatsappNumber,
  whatsappGreeting: BRAND.defaultWhatsappGreeting,
  supportPhone: '',
  supportEmail: '',
  instagramUrl: '',
  facebookUrl: '',
  storeAddress: '',
  gstRate: 5,
  logoUrl: '',
  faviconUrl: '',
  theme: { ...DEFAULT_THEME },
  fontScale: DEFAULT_FONT_SCALE,
  companyName: 'Bhavana Enterprises LLP',
  companyGstin: '',
  companyAddress: '',
  dispatchAddress: '',
  fssaiNumber: '',
  showTrademark: false,
  grievanceName: '',
  grievanceDesignation: '',
  grievanceEmail: '',
  grievancePhone: '',
  grievanceTimeline: 'We acknowledge every complaint within 48 hours and resolve it within 15 days of receiving it.',
  foodSalesPaused: false,
  partialCodEnabled: false,
  partialCodPercent: 30,
  creditEnabled: false,
  creditEligibilityAmount: 0,
  creditLimit: 0,
  creditDueDays: 30
};

/** The old "+91 00000 00000" placeholder: the last 10 digits are all zeros (or there are none). */
const isPlaceholderPhone = (v) => /^0*$/.test(String(v || '').replace(/\D/g, '').slice(-10));

let cache = null;
let inflight = null;
const listeners = new Set();

const load = () => {
  if (inflight) return inflight;
  inflight = settingsApi
    .getPublicSettings()
    .then((res) => {
      const s = res?.data?.settings || {};
      cache = {
        ...DEFAULTS,
        ...s,
        minOrderQtyKg: Number(s.minOrderQtyKg) > 0 ? Number(s.minOrderQtyKg) : DEFAULTS.minOrderQtyKg,
        whatsappNumber: String(s.whatsappNumber || '').replace(/\D/g, '') || BRAND.defaultWhatsappNumber,
        whatsappGreeting: String(s.whatsappGreeting || '').trim() || BRAND.defaultWhatsappGreeting,
        // never show the old "+91 00000 00000" placeholder
        supportPhone: isPlaceholderPhone(s.supportPhone) ? '' : s.supportPhone,
        storePhone: isPlaceholderPhone(s.storePhone) ? '' : s.storePhone,
        theme: normalizeTheme(s.theme),
        fontScale: normalizeFontScale(s.fontScale),
        loaded: true
      };
      listeners.forEach((fn) => fn(cache));
      return cache;
    })
    .catch(() => {
      cache = cache || DEFAULTS;
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

/** Re-fetch the public settings (call after the admin saves Settings so the storefront updates at once). */
export const refreshStoreRules = () => load();

/** Product-specific minimum when set, otherwise the store-wide minimum. */
export function getMinQty(product, rules = DEFAULTS) {
  const perProduct = Number(product?.minOrderQty) || 0;
  if (perProduct > 0) return perProduct;
  // Pieces, pairs, sets and metres have no store-wide minimum (only kg products do)
  if (unitOf(product) !== 'kg') return 1;
  return Number(rules?.minOrderQtyKg) > 0 ? Number(rules.minOrderQtyKg) : BRAND.defaultMinOrderQtyKg;
}

export function useStoreRules() {
  const [rules, setRules] = useState(cache || DEFAULTS);

  useEffect(() => {
    listeners.add(setRules);
    if (!cache) load();
    else setRules(cache);
    return () => {
      listeners.delete(setRules);
    };
  }, []);

  return rules;
}

export default useStoreRules;
