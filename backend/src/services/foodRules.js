import Category from '../models/Category.js';
import settingsService from './settingsService.js';
import { HTTP_STATUS } from '../constants/status.js';

/** Category sections that sell food (and so need an FSSAI licence). */
export const FOOD_GROUPS = ['dry-fruits'];

/** Slugs and names (lower case) of every category that holds food. Categories saved before sections existed count as Dry Fruits. */
const foodCategoryKeys = async () => {
  const cats = await Category.find({ $or: [{ group: { $in: FOOD_GROUPS } }, { group: { $exists: false } }, { group: null }] })
    .select('slug name')
    .lean();
  const keys = new Set();
  cats.forEach((c) => { if (c.slug) keys.add(String(c.slug).toLowerCase()); if (c.name) keys.add(String(c.name).toLowerCase()); });
  return keys;
};

/**
 * While the admin has paused food sales (FSSAI licence pending), food products cannot be added to a cart or bought.
 * Throws a 400 naming the first food product; does nothing when sales are not paused.
 */
export const assertFoodSalesAllowed = async (products = []) => {
  const settings = await settingsService.getSettings();
  if (settings.foodSalesPaused !== true) return;
  const keys = await foodCategoryKeys();
  const blocked = products.find((p) => keys.has(String(p?.category || '').toLowerCase()));
  if (blocked) {
    const err = new Error(`"${blocked.name}" is coming soon. We are not taking orders for food items right now.`);
    err.statusCode = HTTP_STATUS.BAD_REQUEST;
    err.code = 'FOOD_SALES_PAUSED';
    throw err;
  }
};

export default { FOOD_GROUPS, assertFoodSalesAllowed };
