/**
 * "Listings" are categories the store put up as if they were items: a photo and some text, but no
 * product inside, so no price and nothing to buy. These helpers turn one into a product.
 */
import { groupOf, defaultUnitForGroup, productInCategory } from './categoryGroups';

export const MAX_PRODUCT_PHOTOS = 8;

const PRICE = /(?:\b(?:price|rate|mrp)\b\s*[:=\-–]?\s*(?:rs\.?|inr|₹)?\s*|(?:₹|\brs\.?|\binr)\s*)(\d[\d,]*(?:\.\d{1,2})?)/i;

/** A price typed into a description ("Price:800 RS"), or '' when there is none. */
export const priceFromText = (text) => {
  const match = String(text || '').match(PRICE);
  const value = match ? Number(match[1].replace(/,/g, '')) : 0;
  return value > 0 ? value : '';
};

/** Active categories that hold no product. */
export const listingsWithoutProducts = (categories = [], products = []) =>
  (categories || []).filter(
    (c) => String(c.status || 'Active').toLowerCase() !== 'inactive' && !(products || []).some((p) => productInCategory(p, c))
  );

/** Starting values for the product form, taken from a listing. Price and stock stay for the admin to confirm. */
export const productFromListing = (category) => {
  const group = groupOf(category);
  const description = String(category?.description || '');
  const price = priceFromText(description);
  // the price has its own field, so drop that line from the text
  const text = description.split('\n').filter((line) => priceFromText(line) === '').join('\n').trim();
  const image = String(category?.image || '');
  const hasPhoto = Boolean(image) && !image.includes('placeholder');
  return {
    name: String(category?.name || '').trim(),
    category: category?.slug || category?.id || '',
    unit: defaultUnitForGroup(group),
    price,
    oldPrice: '',
    stockCount: '',
    minOrderQty: 0,
    isBestseller: false,
    badge: '',
    description: text === String(category?.name || '').trim() ? '' : text,
    image: hasPhoto ? image : '',
    gallery: hasPhoto ? [image] : []
  };
};
