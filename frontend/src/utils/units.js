/** Units a product can be sold in. Quantities in the cart and in orders are counts of this unit. */
export const UNITS = [
  { id: 'kg', label: 'Kilogram (kg)' },
  { id: 'piece', label: 'Piece' },
  { id: 'pair', label: 'Pair' },
  { id: 'set', label: 'Set' },
  { id: 'meter', label: 'Meter' }
];

export const DEFAULT_UNIT = 'kg';
const ids = UNITS.map((u) => u.id);

/** Unit of a product, or of a cart / order line (from its "1 kg" / "1 piece" weight label). Old data without a unit is kg. */
export const unitOf = (obj) => {
  if (!obj) return DEFAULT_UNIT;
  if (ids.includes(obj.unit)) return obj.unit;
  const m = String(obj.weight || '').trim().toLowerCase().match(/^[\d.]*\s*([a-z]+)$/);
  if (m) {
    const alias = { pieces: 'piece', pcs: 'piece', pairs: 'pair', sets: 'set', metre: 'meter', m: 'meter' };
    const id = alias[m[1]] || m[1];
    if (ids.includes(id)) return id;
  }
  return DEFAULT_UNIT;
};

/** The cart/order label for one unit of a product: "1 kg", "1 piece"... */
export const unitWeightLabel = (product) => '1 ' + unitOf(product);

const SHORT = { kg: 'kg', piece: 'piece', pair: 'pair', set: 'set', meter: 'm' };

/** "kg", "piece", "pieces", "m"... correct for the quantity. */
export const unitText = (qty, unit) => {
  const u = ids.includes(unit) ? unit : DEFAULT_UNIT;
  if (u === 'kg' || u === 'meter') return SHORT[u];
  return Number(qty) === 1 ? SHORT[u] : SHORT[u] + 's';
};

/** "5 kg", "1 piece", "12 pieces" */
export const qtyWithUnit = (qty, unit) => Number(qty) + ' ' + unitText(qty, unit);

/** "/ kg", "/ piece" for price labels */
export const perUnit = (unit) => '/ ' + (SHORT[ids.includes(unit) ? unit : DEFAULT_UNIT]);

/** Cart / order summary: "50 kg" when everything is kg, otherwise "3 items". */
export const itemsSummary = (items = []) => {
  const list = Array.isArray(items) ? items : [];
  if (list.length > 0 && list.every((i) => unitOf(i) === 'kg')) {
    return list.reduce((s, i) => s + (Number(i.qty) || 0), 0) + ' kg';
  }
  return list.length + (list.length === 1 ? ' item' : ' items');
};
