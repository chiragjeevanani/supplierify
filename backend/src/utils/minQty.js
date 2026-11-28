/**
 * Wholesale minimum order quantity helpers.
 * Every cart/order line is priced per unit (kg by default) and `qty` is the number of units.
 */
import { unitOf, unitText } from '../constants/productUnits.js';

export const DEFAULT_MIN_ORDER_QTY_KG = 5;

/**
 * Product-specific minimum when set (> 0). Otherwise kg products use the store-wide minimum from Settings;
 * pieces, pairs, sets and metres default to 1.
 */
export const resolveMinQtyKg = (product, settings = {}) => {
  const perProduct = Number(product?.minOrderQty) || 0;
  if (perProduct > 0) return perProduct;
  if (unitOf(product) !== 'kg') return 1;
  const store = Number(settings?.minOrderQtyKg) || 0;
  return store > 0 ? store : DEFAULT_MIN_ORDER_QTY_KG;
};

export const minQtyMessage = (productName, minQty, unit = 'kg') =>
  `Minimum order for "${productName}" is ${minQty} ${unitText(minQty, unit)}.`;

export default { DEFAULT_MIN_ORDER_QTY_KG, resolveMinQtyKg, minQtyMessage };
