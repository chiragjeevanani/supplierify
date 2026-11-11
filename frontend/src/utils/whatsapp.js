import { BRAND } from '../config/brand';

/**
 * WhatsApp enquiry helpers.
 * `https://wa.me/<number>?text=<message>` opens WhatsApp with the message pre-typed, so the customer
 * only has to press send. Without a number WhatsApp shows a "share with..." contact picker instead, so
 * buildWhatsAppUrl returns '' in that case and callers hide the button.
 */

const digitsOnly = (v) => String(v || '').replace(/\D/g, '');

/** Digits with country code; a bare 10-digit Indian number gets 91 in front so wa.me can find it. */
export function normalizeWhatsAppNumber(number) {
  let n = digitsOnly(number).replace(/^0+/, '');
  if (n.length === 10) n = '91' + n;
  return n;
}

export function buildWhatsAppUrl(number, text) {
  const n = normalizeWhatsAppNumber(number);
  if (n.length < 10) return '';
  return `https://wa.me/${n}?text=${encodeURIComponent(text || '')}`;
}

/** Admin-set opening line (Settings → WhatsApp greeting), without trailing punctuation. */
const hello = (greeting) =>
  (String(greeting || '').trim() || BRAND.defaultWhatsappGreeting).replace(/[\s,.!]+$/, '');

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

const productUrl = (product) => {
  if (typeof window === 'undefined') return '';
  const id = product?.slug || product?._id || product?.id;
  return id ? `${window.location.origin}/product/${id}` : '';
};

/** Message for a single product + quantity (kg). */
export function buildProductEnquiry({ product, qty, greeting }) {
  const kg = Number(qty) || 0;
  const price = Number(product?.price) || 0;
  const lines = [
    `${hello(greeting)}, I would like to enquire about a wholesale order:`,
    '',
    `Product: ${product?.name || ''}`,
    `Quantity: ${kg} kg`,
    `Rate: ${inr(price)} / kg`,
    `Estimated total: ${inr(price * kg)} (excl. GST & shipping)`
  ];
  const link = productUrl(product);
  if (link) lines.push('', `Link: ${link}`);
  lines.push('', 'Please confirm availability, final price and delivery time.');
  return lines.join('\n');
}

/** Message for everything in the cart. */
export function buildCartEnquiry({ items = [], greeting }) {
  const rows = items.map((it, i) => {
    const kg = Number(it.qty) || 0;
    const price = Number(it.price) || 0;
    return `${i + 1}. ${it.name} - ${kg} kg x ${inr(price)}/kg = ${inr(kg * price)}`;
  });
  const total = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  return [
    `${hello(greeting)}, I would like to enquire about this wholesale order:`,
    '',
    ...rows,
    '',
    `Estimated total: ${inr(total)} (excl. GST & shipping)`,
    '',
    'Please confirm availability, final price and delivery time.'
  ].join('\n');
}

/** General enquiry with no product selected. */
export function buildGeneralEnquiry({ greeting } = {}) {
  return `${hello(greeting)}, I would like to know more about your wholesale dry fruits.`;
}
