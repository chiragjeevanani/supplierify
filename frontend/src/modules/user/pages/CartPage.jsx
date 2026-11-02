import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Plus, Minus, Trash2, Tag, ArrowRight, ShieldCheck, ArrowLeft, Info
} from 'lucide-react';
import WhatsAppIcon from '../../../components/WhatsAppIcon';

import { useCart } from '../../../context/CartContext';
import { useAdmin } from '../../../context/AdminContext';
import { useStoreRules, getMinQty } from '../../../hooks/useStoreRules';
import { resolveProductImage } from '../../../utils/productImage';
import { buildCartEnquiry, buildWhatsAppUrl } from '../../../utils/whatsapp';
import KgStepper from '../components/KgStepper';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export default function CartPage() {
  const {
    cartItems, itemCount, subtotal, discountAmount, tax, total, appliedCoupon,
    updateQty, setItemQty, getRemainingStock, getStockLimit, removeFromCart,
    applyCoupon, removeCoupon, clearCart
  } = useCart();
  const { products = [] } = useAdmin();
  const rules = useStoreRules();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCodeInput.trim()) return;
    const res = await applyCoupon(couponCodeInput.trim().toUpperCase());
    if (res && !res.success) setCouponError(res.message || 'Invalid or expired coupon code');
    else setCouponCodeInput('');
  };

  const minFor = (item) => {
    const id = String(item.productId || item.id || item._id);
    const p = products.find((x) => String(x._id || x.id) === id || x.slug === id);
    return getMinQty(p || item, rules);
  };

  const waUrl = buildWhatsAppUrl(
    rules.whatsappNumber,
    buildCartEnquiry({ items: cartItems, storeName: rules.storeName })
  );

  if (cartItems.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-10 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-[color:var(--brand-border)] space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-[color:var(--brand-surface)] border-2 border-[color:var(--brand-accent)]/40 flex items-center justify-center text-[color:var(--brand-accent-dark)]">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[color:var(--brand-primary)]">Your cart is empty</h2>
          <p className="text-sm text-stone-600">
            Add products by the kilo. Minimum order is {rules.minOrderQtyKg} kg per product.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] font-bold text-sm uppercase tracking-wider hover:bg-[color:var(--brand-primary-light)]"
          >
            Browse products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-7xl mx-auto pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl font-bold text-[color:var(--brand-primary)]">
          My Cart <span className="text-base font-semibold text-stone-500">({itemCount} kg)</span>
        </h2>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-stone-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-stone-200 bg-white"
        >
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Items */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-start gap-2 rounded-xl bg-[color:var(--brand-accent)]/15 border border-[color:var(--brand-accent)]/40 px-4 py-3 text-sm text-[color:var(--brand-accent-darker)]">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Wholesale: minimum {rules.minOrderQtyKg} kg per product (some products may need more). Shipping is calculated at checkout.</span>
          </div>

          <div className="bg-white rounded-2xl border border-[color:var(--brand-border)] divide-y divide-stone-100">
            {cartItems.map((item) => {
              const itemId = item.productId || item.id || item._id;
              const min = minFor(item);
              const stock = getStockLimit(itemId);
              const max = stock === null ? 100000 : Math.max(min, stock);
              const canAddMore = getRemainingStock(itemId) > 0;
              return (
                <div key={`${itemId}-${item.weight}`} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Link to={`/product/${itemId}`} className="shrink-0">
                      <img
                        src={resolveProductImage(item)}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-[color:var(--brand-surface)] border border-[color:var(--brand-border)]"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link to={`/product/${itemId}`} className="font-serif font-bold text-[color:var(--brand-primary)] line-clamp-2 leading-snug">
                        {item.name}
                      </Link>
                      <p className="text-sm text-stone-600 mt-0.5">
                        {inr(item.price)} <span className="text-xs">/ kg</span>
                      </p>
                      <p className="text-[11px] text-stone-500">Min. {min} kg</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                    <KgStepper
                      value={Number(item.qty) || 0}
                      min={min}
                      max={canAddMore ? max : Number(item.qty) || min}
                      onChange={(n) => setItemQty(itemId, item.weight, n)}
                    />
                    <span className="text-xs text-stone-500 -ml-2">kg</span>
                    <div className="text-right min-w-[84px]">
                      <span className="font-extrabold text-[color:var(--brand-primary)]">{inr(item.price * item.qty)}</span>
                    </div>
                    <button
                      onClick={() => removeFromCart(itemId, item.weight)}
                      className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                      aria-label={`Remove ${item.name}`}
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary-lighter)]">
            <ArrowLeft className="w-4 h-4" /> Continue shopping
          </Link>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-[color:var(--brand-border)] p-5 space-y-4">
            <h3 className="font-serif text-lg font-bold text-[color:var(--brand-primary)] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[color:var(--brand-accent-dark)]" /> Order Summary
            </h3>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <dt>Subtotal ({itemCount} kg)</dt>
                <dd className="font-bold text-stone-900">{inr(subtotal)}</dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <dt>Discount ({appliedCoupon?.code})</dt>
                  <dd>-{inr(discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <dt>Shipping</dt>
                <dd className="text-xs text-stone-500">Calculated at checkout</dd>
              </div>
              <div className="flex justify-between text-stone-600">
                <dt>GST (est.)</dt>
                <dd className="font-bold text-stone-900">{inr(tax)}</dd>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-stone-200">
                <dt className="font-serif font-bold text-[color:var(--brand-primary)]">Total (excl. shipping)</dt>
                <dd className="text-2xl font-extrabold text-[color:var(--brand-primary)]">{inr(total)}</dd>
              </div>
            </dl>

            <div className="pt-3 border-t border-stone-100">
              <p className="text-xs font-bold text-[color:var(--brand-primary)] mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[color:var(--brand-accent-dark)]" /> Coupon code
              </p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div>
                    <span className="font-bold text-emerald-900">{appliedCoupon.code}</span>
                    <p className="text-emerald-700">{appliedCoupon.description}</p>
                  </div>
                  <button onClick={removeCoupon} className="text-rose-600 hover:underline font-bold">Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 min-w-0 px-3 py-2 text-xs uppercase font-bold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-[color:var(--brand-primary)]"
                    />
                    <button type="submit" className="px-4 py-2 bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] text-xs font-bold uppercase rounded-xl hover:bg-[color:var(--brand-primary-light)]">
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>}
                </form>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              <Link
                to="/checkout"
                className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[color:var(--brand-accent)] via-[color:var(--brand-accent-light)] to-[color:var(--brand-accent-dark)] text-[color:var(--brand-primary)] font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                Pay online (Razorpay) <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] rounded-xl bg-[#25D366] hover:bg-[#1fb857] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-5 h-5" /> Enquire on WhatsApp
              </a>
              <p className="text-[11px] text-stone-500 text-center">
                Prefer to negotiate or pay manually? Send this cart to us on WhatsApp.
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Secure, encrypted checkout</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-[color:var(--brand-border)] px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="shrink-0">
          <span className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold">Total</span>
          <span className="text-lg font-extrabold text-[color:var(--brand-primary)] leading-none">{inr(total)}</span>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Enquire on WhatsApp"
          className="w-11 h-11 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0"
        >
          <WhatsAppIcon className="w-5 h-5" />
        </a>
        <Link
          to="/checkout"
          className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-r from-[color:var(--brand-accent)] to-[color:var(--brand-accent-dark)] text-[color:var(--brand-primary)] text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5"
        >
          Checkout <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
