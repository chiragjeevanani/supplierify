/** The store sections that categories are grouped under (storefront shows one section per group, in this order). */
export const CATEGORY_GROUPS = ['dry-fruits', 'metals', 'garments', 'household-furniture'];
export const DEFAULT_CATEGORY_GROUP = 'dry-fruits';

/** Accepts a group id or a loose label ("Household Furniture"); returns a valid group id or null. */
export const normalizeCategoryGroup = (value) => {
  const v = String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!v) return null;
  const alias = { dryfruits: 'dry-fruits', 'dry-fruit': 'dry-fruits', metal: 'metals', garment: 'garments', furniture: 'household-furniture', household: 'household-furniture' };
  const id = alias[v] || v;
  return CATEGORY_GROUPS.includes(id) ? id : null;
};

export default { CATEGORY_GROUPS, DEFAULT_CATEGORY_GROUP, normalizeCategoryGroup };
