/**
 * Single source of truth for the storefront identity.
 * Change the values here (and the logo in /public) to re-brand the whole site.
 * Contact details, WhatsApp number and the minimum order quantity are managed in the
 * admin panel (Settings) and read from the public settings API at runtime.
 */
export const BRAND = {
  name: 'Dry Fruit Wholesale',
  shortName: 'DF Wholesale',
  tagline: 'Bulk dry fruits & nuts for your business',
  description:
    'Wholesale dry fruits, nuts, dates and seeds sold by the kilo. Minimum order applies. Order online or enquire on WhatsApp.',
  // Shown until the admin saves their own values in Settings
  defaultMinOrderQtyKg: 5,
  unitLabel: 'kg'
};

export default BRAND;
