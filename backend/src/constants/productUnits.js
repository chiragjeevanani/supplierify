/** Units a product can be sold in. Quantities in cart/orders are counts of this unit. */
export const PRODUCT_UNITS = ['kg', 'piece', 'pair', 'set', 'meter'];
export const DEFAULT_UNIT = 'kg';

export const normalizeUnit = (value) => {
  const v = String(value ?? '').trim().toLowerCase();
  const alias = { kilo: 'kg', kgs: 'kg', kilogram: 'kg', pieces: 'piece', pcs: 'piece', pc: 'piece', pairs: 'pair', sets: 'set', metre: 'meter', m: 'meter', meters: 'meter' };
  const id = alias[v] || v;
  return PRODUCT_UNITS.includes(id) ? id : null;
};

/** Unit of a product, or of an order/cart line from its "1 kg" / "1 piece" weight label. */
export const unitOf = (obj) => {
  if (!obj) return DEFAULT_UNIT;
  const direct = normalizeUnit(obj.unit);
  if (direct) return direct;
  const m = String(obj.weight || '').trim().toLowerCase().match(/^[\d.]*\s*([a-z]+)$/);
  return (m && normalizeUnit(m[1])) || DEFAULT_UNIT;
};

const SHORT = { kg: 'kg', piece: 'piece', pair: 'pair', set: 'set', meter: 'm' };
export const unitText = (qty, unit) => {
  const u = normalizeUnit(unit) || DEFAULT_UNIT;
  if (u === 'kg' || u === 'meter') return SHORT[u];
  return Number(qty) === 1 ? SHORT[u] : SHORT[u] + 's';
};

export default { PRODUCT_UNITS, DEFAULT_UNIT, normalizeUnit, unitOf, unitText };
