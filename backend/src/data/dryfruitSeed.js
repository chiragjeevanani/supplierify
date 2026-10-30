/**
 * Demo catalogue for the dry-fruit wholesale store.
 * - `price` / `oldPrice` are ₹ PER KG, `stockCount` is in KG.
 * - Every line is sold as "1 kg" units, so cart/order `qty` is the number of kilograms.
 * - `minOrderQty` 0 = use the store-wide minimum (Settings.minOrderQtyKg, default 5 kg).
 * Replace with the client's real products from the admin panel.
 */

const UNIT = '1 kg';

const make = ({
  name, slug, category, subtitle, price, oldPrice, stockCount, description, tags = [],
  badge = '', isBestseller = false, isFeatured = false, minOrderQty = 0, origin = ''
}) => ({
  name,
  subtitle,
  tagline: subtitle,
  slug,
  category,
  flavor: origin,
  diet: ['natural', 'vegan', 'gluten-free'],
  price,
  oldPrice,
  discountPercent: oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0,
  rating: 5.0,
  reviewsCount: 0,
  weight: UNIT,
  weightOptions: [{ weight: UNIT, price, oldPrice, isDefault: true }],
  minOrderQty,
  inStock: true,
  stockCount,
  badge,
  badgeType: badge ? 'bestseller' : 'popular',
  isBestseller,
  isFeatured,
  image: `/assets/dryfruits/${slug}.jpg`,
  gallery: [`/assets/dryfruits/${slug}.jpg`],
  description,
  details: description,
  productDetails: description,
  ingredients: '100% natural, no added sugar or preservatives.',
  tags: ['Dry Fruits', 'Wholesale', ...tags],
  status: 'ACTIVE'
});

export const DRYFRUIT_CATEGORIES_SEED = [
  { name: 'Almonds & Nuts', slug: 'almonds-nuts', subtext: 'Almonds, walnuts, pistachios', description: 'Bulk almonds, walnuts, pistachios and premium tree nuts.', badge: 'Bestseller' },
  { name: 'Cashews', slug: 'cashews', subtext: 'W180 to W450 grades', description: 'Graded whole cashews and cashew pieces in bulk.', badge: 'Popular' },
  { name: 'Raisins & Berries', slug: 'raisins-berries', subtext: 'Kishmish, cranberries', description: 'Green, black and golden raisins, dried berries.', badge: '' },
  { name: 'Dates & Figs', slug: 'dates-figs', subtext: 'Dates, anjeer, apricots', description: 'Premium dates, dried figs and apricots by the kilo.', badge: '' },
  { name: 'Seeds & Mixes', slug: 'seeds-mixes', subtext: 'Seeds and mixed dry fruits', description: 'Chia, pumpkin and sunflower seeds plus ready mixes.', badge: '' }
].map((c, i) => ({
  ...c,
  image: `/assets/dryfruits/${c.slug}.jpg`,
  popular: true,
  status: 'Active',
  sortOrder: i + 1,
  order: i + 1
}));

export const DRYFRUIT_PRODUCTS_SEED = [
  make({ name: 'California Almonds', slug: 'california-almonds', category: 'almonds-nuts', subtitle: 'Crunchy, naturally sweet, bulk grade', price: 780, oldPrice: 850, stockCount: 1500, badge: 'BESTSELLER', isBestseller: true, isFeatured: true, origin: 'California', description: 'Hand-sorted California almonds with a rich crunch. Ideal for retail repacking, sweet shops, caterers and corporate gifting.', tags: ['Almonds', 'Badam'] }),
  make({ name: 'Mamra Almonds', slug: 'mamra-almonds', category: 'almonds-nuts', subtitle: 'Premium oil-rich Mamra variety', price: 1450, oldPrice: 1600, stockCount: 400, badge: 'PREMIUM', isFeatured: true, origin: 'Iran / Afghanistan', description: 'Spiral-shaped Mamra almonds, richer in natural oil and flavour than regular almonds.', tags: ['Almonds', 'Mamra'] }),
  make({ name: 'Walnut Kernels (Akhrot)', slug: 'walnut-kernels', category: 'almonds-nuts', subtitle: 'Light halves, fresh crop', price: 920, oldPrice: 990, stockCount: 800, isBestseller: true, origin: 'Kashmir', description: 'Light-coloured walnut kernel halves and quarters, vacuum packed for freshness.', tags: ['Walnut', 'Akhrot'] }),
  make({ name: 'Roasted Salted Pistachios', slug: 'roasted-salted-pistachios', category: 'almonds-nuts', subtitle: 'In-shell, lightly salted', price: 1250, oldPrice: 1380, stockCount: 350, badge: 'POPULAR', origin: 'Iran', description: 'Jumbo in-shell pistachios, slow roasted and lightly salted.', tags: ['Pistachio', 'Pista'] }),
  make({ name: 'Cashews W320', slug: 'cashews-w320', category: 'cashews', subtitle: 'Whole white cashews, W320 grade', price: 780, oldPrice: 840, stockCount: 2000, badge: 'BESTSELLER', isBestseller: true, isFeatured: true, origin: 'Goa / Kerala', description: 'Whole white cashew kernels, W320 grade. The everyday choice for sweets, gravies and snacking.', tags: ['Cashew', 'Kaju'] }),
  make({ name: 'Cashews W240', slug: 'cashews-w240', category: 'cashews', subtitle: 'Large whole cashews, W240 grade', price: 860, oldPrice: 930, stockCount: 1200, origin: 'Goa / Kerala', description: 'Larger, whiter W240 cashews with a buttery taste.', tags: ['Cashew', 'Kaju'] }),
  make({ name: 'Roasted Salted Cashews', slug: 'roasted-salted-cashews', category: 'cashews', subtitle: 'Ready to eat, lightly salted', price: 920, oldPrice: 990, stockCount: 600, origin: 'India', description: 'Dry roasted cashews with a light touch of salt. Ready for retail packing.', tags: ['Cashew', 'Roasted'] }),
  make({ name: 'Green Raisins (Kishmish)', slug: 'green-raisins', category: 'raisins-berries', subtitle: 'Seedless, long green', price: 420, oldPrice: 460, stockCount: 1500, isBestseller: true, origin: 'Nashik', description: 'Seedless long green raisins, naturally sweet and juicy.', tags: ['Raisins', 'Kishmish'] }),
  make({ name: 'Black Raisins', slug: 'black-raisins', category: 'raisins-berries', subtitle: 'Seedless black Kishmish', price: 360, oldPrice: 400, stockCount: 1200, origin: 'Afghanistan', description: 'Dark, soft seedless raisins ideal for baking and sweets.', tags: ['Raisins'] }),
  make({ name: 'Dried Cranberries', slug: 'dried-cranberries', category: 'raisins-berries', subtitle: 'Sweetened, whole', price: 720, oldPrice: 780, stockCount: 300, origin: 'USA', description: 'Tangy-sweet whole dried cranberries for mixes, bakeries and cereals.', tags: ['Cranberry'] }),
  make({ name: 'Medjool Dates', slug: 'medjool-dates', category: 'dates-figs', subtitle: 'Jumbo, soft and caramel-like', price: 1100, oldPrice: 1250, stockCount: 500, badge: 'PREMIUM', isFeatured: true, origin: 'Jordan / Israel', description: 'Jumbo Medjool dates, naturally soft with a caramel finish.', tags: ['Dates', 'Khajoor'] }),
  make({ name: 'Kimia Dates', slug: 'kimia-dates', category: 'dates-figs', subtitle: 'Soft black dates, value pack', price: 320, oldPrice: 360, stockCount: 2500, origin: 'Iran', description: 'Soft, moist black Kimia dates at wholesale value pricing.', tags: ['Dates', 'Khajoor'] }),
  make({ name: 'Dried Anjeer (Figs)', slug: 'dried-anjeer', category: 'dates-figs', subtitle: 'Afghan, big size', price: 950, oldPrice: 1050, stockCount: 450, origin: 'Afghanistan', description: 'Big, soft Afghan dried figs with natural sweetness.', tags: ['Anjeer', 'Figs'] }),
  make({ name: 'Khumani (Dried Apricots)', slug: 'dried-apricots', category: 'dates-figs', subtitle: 'Seeded, naturally dried', price: 650, oldPrice: 720, stockCount: 400, origin: 'Afghanistan', description: 'Naturally sun-dried apricots, tangy and chewy.', tags: ['Apricot', 'Khumani'] }),
  make({ name: 'Chia Seeds', slug: 'chia-seeds', category: 'seeds-mixes', subtitle: 'Black chia, cleaned', price: 380, oldPrice: 420, stockCount: 900, origin: 'Mexico', description: 'Cleaned black chia seeds rich in omega-3 and fibre.', tags: ['Seeds', 'Chia'] }),
  make({ name: 'Pumpkin Seeds', slug: 'pumpkin-seeds', category: 'seeds-mixes', subtitle: 'Raw, shelled', price: 520, oldPrice: 580, stockCount: 700, origin: 'China', description: 'Raw shelled pumpkin seeds, high in zinc and magnesium.', tags: ['Seeds', 'Pumpkin'] }),
  make({ name: 'Premium Mixed Dry Fruits', slug: 'premium-mixed-dry-fruits', category: 'seeds-mixes', subtitle: 'Almonds, cashews, raisins, pistachios', price: 820, oldPrice: 900, stockCount: 1000, badge: 'POPULAR', isFeatured: true, origin: 'Assorted', description: 'A balanced premium mix of almonds, cashews, raisins and pistachios, packed for gifting and counter sales.', tags: ['Mix', 'Gifting'] })
];
