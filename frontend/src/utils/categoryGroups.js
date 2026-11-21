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

/** Sections that sell food (they need an FSSAI licence). Keep in sync with the backend. */
export const FOOD_GROUPS = ['dry-fruits'];

/** True when the product belongs to a food category. */
export const isFoodProduct = (product, categories = []) => {
  const cat = (categories || []).find((c) => productInCategory(product, c));
  return cat ? FOOD_GROUPS.includes(groupOf(cat)) : false;
};

/** The category object a product belongs to (or undefined). */
export const categoryOfProduct = (product, categories = []) =>
  (categories || []).find((c) => productInCategory(product, c));

/** Section id of a product (products whose category is unknown count as Dry Fruits, like old categories). */
export const groupOfProduct = (product, categories = []) => {
  const cat = categoryOfProduct(product, categories);
  return cat ? groupOf(cat) : DEFAULT_GROUP;
};

/** Readable category name for a product (falls back to the raw slug). */
export const categoryNameOfProduct = (product, categories = []) =>
  categoryOfProduct(product, categories)?.name || String(product?.category || '').replace(/-/g, ' ');
