/**
 * Shared checkout pricing helpers (delivery fee by payment type).
 */

export function isCodPaymentMethod(paymentMethod) {
  const raw = String(paymentMethod || '').toUpperCase().trim();
  if (!raw) return true;
  if (raw === 'COD') return true;
  if (raw.includes('CASH') || raw.includes('DELIVERY') || raw.includes('DOORSTEP')) return true;
  return false;
}

/**
 * Resolve shipping/delivery fee for subtotal + payment method.
 * Free when subtotal >= freeDeliveryThreshold.
 */
export function resolveDeliveryFee({ subtotal, paymentMethod, settings = {} }) {
  const amount = Number(subtotal) || 0;
  const freeThreshold = Number(settings.freeDeliveryThreshold ?? 499);
  if (amount <= 0 || amount >= freeThreshold) return 0;

  const onlineFee = Number(settings.standardDeliveryFee ?? 40);
  const codFee =
    settings.codDeliveryFee != null && settings.codDeliveryFee !== ''
      ? Number(settings.codDeliveryFee)
      : onlineFee + 20;

  return isCodPaymentMethod(paymentMethod) ? codFee : onlineFee;
}

/**
 * Partial COD: the customer pays `percent`% of the order total online now, the rest in cash on delivery.
 * Returns { advance, balance } in whole rupees, or null when the split is not possible.
 */
export function computePartialCod(total, percent) {
  const t = Math.round(Number(total) || 0);
  const pct = Number(percent);
  if (t < 2 || !Number.isFinite(pct) || pct < 1 || pct > 99) return null;
  const advance = Math.min(t - 1, Math.max(1, Math.round((t * pct) / 100)));
  return { advance, balance: t - advance };
}

export function calculateOrderTotals({
  subtotal,
  discount = 0,
  paymentMethod,
  settings = {},
  deliveryFee: deliveryFeeOverride = undefined
}) {
  const base = Math.max(0, Number(subtotal) || 0);
  const discountAmount = Math.max(0, Number(discount) || 0);
  const taxableAmount = Math.max(0, base - discountAmount);
  const gstRate = Number(settings.gstRate ?? 5);
  const deliveryFee =
    deliveryFeeOverride !== undefined
      ? Math.max(0, Number(deliveryFeeOverride) || 0)
      : resolveDeliveryFee({ subtotal: base, paymentMethod, settings });
  const tax = Math.round((taxableAmount * gstRate) / 100);
  const total = Math.max(0, taxableAmount + deliveryFee + tax);

  return { subtotal: base, discount: discountAmount, taxableAmount, deliveryFee, tax, total, gstRate };
}

export default {
  isCodPaymentMethod,
  resolveDeliveryFee,
  computePartialCod,
  calculateOrderTotals
};
