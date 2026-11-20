/** The store sections categories are grouped under. Order here = order on the storefront. */
export const CATEGORY_GROUPS = [
  { id: 'dry-fruits', label: 'Dry Fruits' },
  { id: 'metals', label: 'Metals' },
  { id: 'garments', label: 'Garments' },
  { id: 'household-furniture', label: 'Household Furniture' }
];

export const DEFAULT_GROUP = 'dry-fruits';

/** Group id of a category (categories saved before sections existed count as Dry Fruits). */
export const groupOf = (category) => {
  const g = String(category?.group || '').trim();
  return CATEGORY_GROUPS.some((x) => x.id === g) ? g : DEFAULT_GROUP;
};

export const groupLabel = (id) => CATEGORY_GROUPS.find((g) => g.id === id)?.label || id;

/** True when the product belongs to the category (matches by slug or name, like the shop page). */
export const productInCategory = (product, category) => {
  const pc = String(product?.category || '').toLowerCase();
  return Boolean(pc) && (pc === String(category?.slug || '').toLowerCase() || pc === String(category?.name || '').toLowerCase());
};
