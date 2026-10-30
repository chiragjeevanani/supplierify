// Offline fallback coupons (live coupons come from the backend).
export const INITIAL_COUPONS = [
  { id: 'c-1', code: 'BULK5', type: 'Percentage', discount: 5, discountDisplay: '5%', minOrder: 10000, status: 'Active', validity: 'Ongoing', description: '5% off on bulk orders above ₹10,000', usageCount: 0 },
  { id: 'c-2', code: 'FIRSTORDER', type: 'Fixed', discount: 500, discountDisplay: '₹500', minOrder: 5000, status: 'Active', validity: 'Ongoing', description: 'Flat ₹500 off on your first wholesale order above ₹5,000', usageCount: 0 }
];
