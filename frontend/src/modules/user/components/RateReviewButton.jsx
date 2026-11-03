import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

/**
 * "Rate & Review" shortcut for an item of a DELIVERED order.
 * Opens the product page straight on its review form (eligibility is still enforced by the backend).
 */
export default function RateReviewButton({ order, item, className = '' }) {
  if (!order || order.status !== 'Delivered' || !item) return null;

  const pid = item.product?._id || item.product || item.productId || item.id;
  if (!pid) return null;

  return (
    <Link
      to={`/product/${pid}?review=1`}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] hover:bg-[color:var(--brand-primary-light)] text-[length:calc(10px*var(--fs))] sm:text-[length:calc(11px*var(--fs))] font-bold uppercase tracking-wider transition-colors ${className}`}
    >
      <Star className="w-3 h-3 fill-[color:var(--brand-accent)]" />
      <span>Rate &amp; Review</span>
    </Link>
  );
}
