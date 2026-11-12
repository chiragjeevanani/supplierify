/** Friendly names for order payment methods. */
export function paymentMethodLabel(method) {
  const m = String(method || '').toUpperCase();
  if (m === 'CREDIT') return 'Pay on credit';
  if (m === 'COD') return 'Cash on delivery';
  if (['UPI', 'CARD', 'NETBANKING'].includes(m)) return 'Online (Razorpay)';
  return method || '—';
}

export const isCreditOrder = (order) => String(order?.paymentMethod || '').toUpperCase() === 'CREDIT';

export const formatDueDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
