/**
 * Default HSN (4-digit) for common dry fruits, picked from the product name / category.
 * Admin can set an exact code on each product; non-food items have no default (the invoice shows "-").
 * The accountant should confirm these codes.
 */
const RULES = [
  [/cashew/i, '0801'], [/coconut|copra/i, '0801'], [/almond|badam|walnut|akhrot|pistachio|pista|hazelnut|nut\b|nuts\b/i, '0802'],
  [/fig|anjeer|date|khajoor|khajur|medjool|kimia/i, '0804'], [/raisin|kishmish|grape/i, '0806'], [/apricot|khubani|prune|cranberr|berry|berries/i, '0813'],
  [/chia|pumpkin|sunflower|flax|seed/i, '1207'], [/mix|trail/i, '2008']
];

export const defaultHsn = (product) => {
  const hay = [product?.name, product?.category, product?.subtitle].filter(Boolean).join(' ');
  for (const [re, code] of RULES) if (re.test(hay)) return code;
  return '';
};

export const hsnFor = (product) => String(product?.hsnCode || '').trim() || defaultHsn(product);

export default { defaultHsn, hsnFor };
