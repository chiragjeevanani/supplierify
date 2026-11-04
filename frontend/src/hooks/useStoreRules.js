import { useEffect, useState } from 'react';
import { settingsApi } from '../utils/api';
import { BRAND } from '../config/brand';
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
  whatsappNumber: '',
  supportPhone: '',
  supportEmail: '',
  storeAddress: '',
  gstRate: 5,
  logoUrl: '',
  faviconUrl: '',
  theme: { ...DEFAULT_THEME },
  fontScale: DEFAULT_FONT_SCALE
};

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
        whatsappNumber: String(s.whatsappNumber || '').replace(/\D/g, ''),
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
