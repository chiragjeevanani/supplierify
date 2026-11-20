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

/**
 * Social profile link: must be an https link on one of the allowed sites (e.g. instagram.com).
 * Returns the normalised URL, '' when the value is empty (clears the link), or null when it is not acceptable.
 */
export const cleanSocialUrl = (value, allowedHosts = []) => {
  let v = String(value ?? '').trim();
  if (!v) return '';
  if (!v.includes('://')) v = 'https://' + v;
  let parsed;
  try {
    parsed = new URL(v);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  let host = parsed.hostname.toLowerCase();
  if (host.startsWith('www.')) host = host.slice(4);
  if (host.startsWith('m.')) host = host.slice(2);
  if (!allowedHosts.includes(host)) return null;
  return parsed.toString();
};

export const SOCIAL_HOSTS = {
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.com']
};

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export default { cleanImageUrl, cleanLink, cleanSocialUrl, SOCIAL_HOSTS, HEX_COLOR };
