/**
 * Storefront colour theme.
 * The admin picks four base colours; every other shade used by the site is derived from them in
 * index.css (color-mix), so changing these four values re-colours the whole storefront and admin panel.
 */

export const DEFAULT_THEME = Object.freeze({
  primary: '#0E2A1B',
  accent: '#D4AF37',
  background: '#F7F3E9',
  text: '#182019'
});

export const THEME_PRESETS = [
  { id: 'forest-gold', name: 'Forest & Gold', theme: { ...DEFAULT_THEME } },
  { id: 'walnut-saffron', name: 'Walnut & Saffron', theme: { primary: '#3B2314', accent: '#E0A526', background: '#FBF5EC', text: '#2A1B10' } },
  { id: 'midnight-amber', name: 'Midnight & Amber', theme: { primary: '#14213D', accent: '#F4A300', background: '#F5F6FA', text: '#14213D' } },
  { id: 'burgundy-cream', name: 'Burgundy & Cream', theme: { primary: '#5C1A2B', accent: '#C9A24A', background: '#FBF4EE', text: '#2B1218' } },
  { id: 'charcoal-mint', name: 'Charcoal & Mint', theme: { primary: '#1F2933', accent: '#2FB38A', background: '#F4F7F6', text: '#1F2933' } },
  { id: 'olive-terracotta', name: 'Olive & Terracotta', theme: { primary: '#3D4A2A', accent: '#C8643C', background: '#F8F4EA', text: '#232A18' } }
];

export const THEME_FIELDS = [
  { key: 'primary', label: 'Primary', hint: 'Sidebar, buttons, headings' },
  { key: 'accent', label: 'Accent', hint: 'Highlights, active menu item, badges' },
  { key: 'background', label: 'Background', hint: 'Page background' },
  { key: 'text', label: 'Text', hint: 'Body text' }
];

const HEX = /^#[0-9a-f]{6}$/i;
const CACHE_KEY = 'wholesale_theme';

export const isHex = (v) => HEX.test(String(v || '').trim());

/** Returns a complete theme; any missing/invalid colour falls back to the default. */
export function normalizeTheme(theme = {}) {
  const src = theme && typeof theme === 'object' ? theme : {};
  const out = {};
  for (const key of Object.keys(DEFAULT_THEME)) {
    out[key] = isHex(src[key]) ? String(src[key]).trim().toUpperCase() : DEFAULT_THEME[key];
  }
  return out;
}

/**
 * Apply a theme to the page. `persist: false` is used for live previews in the admin editor.
 */
export function applyTheme(theme, { persist = true } = {}) {
  if (typeof document === 'undefined') return;
  const t = normalizeTheme(theme);
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', t.primary);
  root.style.setProperty('--brand-accent', t.accent);
  root.style.setProperty('--brand-bg', t.background);
  root.style.setProperty('--brand-text', t.text);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.primary);

  if (persist) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(t)); } catch { /* storage unavailable */ }
  }
}

/** Apply the last saved theme immediately on load (prevents a flash of the default colours). */
export function applyCachedTheme() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) applyTheme(JSON.parse(raw), { persist: false });
  } catch { /* ignore */ }
}

// ---- text size (percentage of the normal size; 100 = default)
export const FONT_SCALE_MIN = 85;
export const FONT_SCALE_MAX = 125;
export const DEFAULT_FONT_SCALE = 100;
export const FONT_SCALE_PRESETS = [
  { value: 90, label: 'Small' },
  { value: 100, label: 'Normal' },
  { value: 110, label: 'Large' },
  { value: 120, label: 'Extra large' }
];
const FONT_CACHE_KEY = 'wholesale_font_scale';

/** A whole-number percentage inside the allowed range; anything else becomes the default. */
export function normalizeFontScale(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_FONT_SCALE;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, n));
}

/** Apply the text size to the whole page. `persist: false` is used for live previews in the admin editor. */
export function applyFontScale(value, { persist = true } = {}) {
  if (typeof document === 'undefined') return;
  const pct = normalizeFontScale(value);
  document.documentElement.style.setProperty('--fs', String(pct / 100));
  if (persist) {
    try { localStorage.setItem(FONT_CACHE_KEY, String(pct)); } catch { /* storage unavailable */ }
  }
}

/** Apply the last saved text size immediately on load (prevents a flash of the default size). */
export function applyCachedFontScale() {
  try {
    const raw = localStorage.getItem(FONT_CACHE_KEY);
    if (raw) applyFontScale(raw, { persist: false });
  } catch { /* ignore */ }
}

/** Current value of a base colour as a #hex string (for libraries that cannot read CSS variables). */
export function getThemeHex(key, fallback) {
  const fb = fallback || DEFAULT_THEME[key];
  if (typeof document === 'undefined') return fb;
  const map = { primary: '--brand-primary', accent: '--brand-accent', background: '--brand-bg', text: '--brand-text' };
  const v = getComputedStyle(document.documentElement).getPropertyValue(map[key]).trim();
  return isHex(v) ? v : fb;
}

export function getConfettiColors() {
  return [getThemeHex('accent'), getThemeHex('primary'), '#FFFFFF'];
}

// ---- contrast helpers (used for the "hard to read" warnings in the admin editor)
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};

export function contrastRatio(a, b) {
  if (!isHex(a) || !isHex(b)) return 21;
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Human-readable readability problems for a theme (empty array = looks fine). */
export function themeWarnings(theme) {
  const t = normalizeTheme(theme);
  const warnings = [];
  if (contrastRatio(t.text, t.background) < 4.5) warnings.push('Text is hard to read on the background colour. Pick a darker text colour or a lighter background.');
  if (contrastRatio('#FFFFFF', t.primary) < 4.5) warnings.push('White text on the primary colour will be hard to read. Pick a darker primary colour.');
  if (contrastRatio(t.primary, t.accent) < 3) warnings.push('Primary and accent colours are too similar. Highlights (like the active menu item) will not stand out.');
  return warnings;
}
