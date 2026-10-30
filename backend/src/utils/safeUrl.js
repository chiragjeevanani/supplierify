/**
 * Validators for admin-supplied image paths, links and colours, so a stored value can never become
 * a javascript:/data: URL or an arbitrary file path when it is rendered by the storefront.
 */

const UPLOAD_PATH = /^\/uploads\/[a-z0-9_-]{1,40}\/[A-Za-z0-9._-]+$/;
// Images bundled with the storefront build (e.g. /assets/banners/banner-1.jpg)
const BUNDLED_PATH = /^\/assets\/[a-z0-9_-]{1,40}(\/[a-z0-9_-]{1,40})?\/[A-Za-z0-9._-]+\.(jpe?g|png|webp|avif)$/i;
const HTTP_URL = /^https?:\/\/[^\s"'<>]+$/i;

/** Uploaded image path ("/uploads/..."), bundled "/assets/..." image or http(s) URL. Returns the trimmed value or null. */
export const cleanImageUrl = (value) => {
  const v = String(value ?? '').trim();
  if (!v) return null;
  return UPLOAD_PATH.test(v) || BUNDLED_PATH.test(v) || HTTP_URL.test(v) ? v : null;
};

/** In-site path ("/shop") or an http(s) URL. Returns the trimmed value or null. */
export const cleanLink = (value) => {
  const v = String(value ?? '').trim();
  if (!v) return null;
  if (v.startsWith('/') && !v.startsWith('//') && !/\s/.test(v)) return v;
  return HTTP_URL.test(v) ? v : null;
};

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export default { cleanImageUrl, cleanLink, HEX_COLOR };
