/**
 * Wholesale minimum order quantity (kilograms) helpers.
 * Every cart/order line is priced per kg and `qty` is the number of kilograms,
 * so the minimum is enforced per product line.
 */

export const DEFAULT_MIN_ORDER_QTY_KG = 5;

/** Product-specific minimum when set (> 0), otherwise the store-wide minimum from Settings. */
export const resolveMinQtyKg = (product, settings = {}) => {
  const perProduct = Number(product?.minOrderQty) || 0;
  if (perProduct > 0) return perProduct;
  const store = Number(settings?.minOrderQtyKg) || 0;
  return store > 0 ? store : DEFAULT_MIN_ORDER_QTY_KG;
};

export const minQtyMessage = (productName, minQty) =>
  `Minimum order for "${productName}" is ${minQty} kg.`;

export default { DEFAULT_MIN_ORDER_QTY_KG, resolveMinQtyKg, minQtyMessage };
