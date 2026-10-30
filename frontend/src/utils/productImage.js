import { assetUrl } from './api';

const PLACEHOLDER_IMAGE = '/assets/dryfruits/placeholder.svg';

/**
 * Product image resolver used by the storefront and the admin panel.
 * Accepts either a product object OR an image URL string and always returns something displayable:
 * an uploaded photo ("/uploads/..." on this server), an absolute URL, a bundled /assets path,
 * or the placeholder tile.
 */
export function resolveProductImage(productOrUrl) {
  if (!productOrUrl) return PLACEHOLDER_IMAGE;

  const rawImg =
    typeof productOrUrl === 'string'
      ? productOrUrl
      : productOrUrl.image || productOrUrl.gallery?.[0] || '';
  const img = typeof rawImg === 'string' ? rawImg.trim() : '';
  if (!img) return PLACEHOLDER_IMAGE;

  // Unbundled dev-only paths never exist in production
  if (img.startsWith('/src/')) return PLACEHOLDER_IMAGE;

  return assetUrl(img);
}

/**
 * Resolve product/category image for list and card UI (home, shop, favourites).
 * Uploaded photos are already shrunk in the browser before upload, so the path is used as-is.
 */
export function resolveOptimizedProductImage(productOrUrl) {
  return resolveProductImage(productOrUrl);
}
