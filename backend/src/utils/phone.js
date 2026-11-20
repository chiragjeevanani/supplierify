/** A real phone number has at least 10 digits and is not the "+91 00000 00000" placeholder. */
export const isRealPhone = (v) => {
  const d = String(v || '').replace(/\D/g, '');
  return d.length >= 10 && !/^0+$/.test(d.slice(-10));
};

export const formatPhone = (digits) => {
  const d = String(digits || '').replace(/\D/g, '');
  if (!d) return '';
  return d.length === 12 && d.startsWith('91') ? `+91 ${d.slice(2, 7)} ${d.slice(7)}` : d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : `+${d}`;
};

/** First real phone among the candidates; otherwise the WhatsApp number; otherwise ''. Never the placeholder. */
export const resolvePublicPhone = (candidates = [], whatsappNumber = '') => {
  const real = candidates.find(isRealPhone);
  if (real) return String(real).trim();
  return isRealPhone(whatsappNumber) ? formatPhone(whatsappNumber) : '';
};

export default { isRealPhone, formatPhone, resolvePublicPhone };
