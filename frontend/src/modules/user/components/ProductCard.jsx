import React, { useEffect, useState } from 'react';
import { Heart, ShoppingCart, Check, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useStoreRules, getMinQty } from '../../../hooks/useStoreRules';
import { resolveOptimizedProductImage } from '../../../utils/productImage';
import { buildProductEnquiry, buildWhatsAppUrl } from '../../../utils/whatsapp';
import KgStepper from './KgStepper';

const UNIT = '1 kg';
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export default function ProductCard({ product, priority = false }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const rules = useStoreRules();
  const minQty = getMinQty(product, rules);

  const [qty, setQty] = useState(minQty);
  const [isAdded, setIsAdded] = useState(false);

  // Keep the starting quantity in sync when the admin changes the minimum
  useEffect(() => { setQty((q) => Math.max(q, minQty)); }, [minQty]);

  const price = Number(product.price) || 0;
  const oldPrice = Number(product.oldPrice) || 0;
  const maxQty = typeof product.stockCount === 'number' ? Math.max(0, product.stockCount) : Infinity;
  const outOfStock = product.inStock === false || maxQty <= 0;
  const productId = product.slug || product.id || product._id;
  const isWishlisted = isInWishlist(product);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    const added = await addToCart(product, UNIT, qty, false);
    if (added === false) return;
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const waUrl = buildWhatsAppUrl(
    rules.whatsappNumber,
    buildProductEnquiry({ product, qty, storeName: rules.storeName })
  );

  return (
    <div className="group bg-white rounded-xl border border-[color:var(--brand-border)] hover:border-[color:var(--brand-accent)] shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden text-left">
      <div className="relative w-full aspect-square overflow-hidden bg-[color:var(--brand-surface)]">
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
          {product.badge ? (
            <span className="text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider bg-[color:var(--brand-accent-dark)] text-white shadow-sm">
              {product.badge}
            </span>
          ) : <span />}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center pointer-events-auto bg-white/95 shadow border border-stone-200 transition-colors ${
              isWishlisted ? 'text-rose-600' : 'text-stone-400 hover:text-rose-600'
            }`}
            aria-label={isWishlisted ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
          </button>
        </div>

        <Link to={`/product/${productId}`} className="block w-full h-full">
          <img
            src={resolveOptimizedProductImage(product, { width: 480 })}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            width={480}
            height={480}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <Link to={`/product/${productId}`} className="block">
          <h3 className="font-serif text-[15px] sm:text-base font-bold text-[color:var(--brand-primary)] line-clamp-1 leading-snug">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{product.subtitle || product.tagline || ' '}</p>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-xl font-extrabold text-[color:var(--brand-primary)]">{inr(price)}</span>
          <span className="text-xs font-semibold text-stone-500">/ kg</span>
          {oldPrice > price && <span className="text-xs text-stone-400 line-through">{inr(oldPrice)}</span>}
        </div>
        <p className="text-[11px] font-semibold text-[color:var(--brand-accent-darker)] bg-[color:var(--brand-accent)]/15 rounded px-2 py-1 mt-2 w-fit">
          Min. order {minQty} kg
        </p>

        {outOfStock ? (
          <div className="mt-3 rounded-lg bg-stone-200 text-stone-500 text-xs font-bold text-center py-2.5 uppercase tracking-wider">
            Out of stock
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mt-3">
              <KgStepper size="sm" value={qty} min={minQty} max={maxQty === Infinity ? 100000 : maxQty} onChange={setQty} />
              <span className="text-xs text-stone-500">kg</span>
              <span className="text-sm font-extrabold text-[color:var(--brand-primary)]">{inr(price * (Number(qty) || 0))}</span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleAddToCart}
                className={`flex-1 h-10 rounded-lg text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-1.5 transition-colors ${
                  isAdded ? 'bg-emerald-700 text-white' : 'bg-[color:var(--brand-primary)] text-white hover:bg-[color:var(--brand-primary-hover)]'
                }`}
              >
                {isAdded ? <><Check className="w-4 h-4 text-[color:var(--brand-accent)]" /> Added</> : <><ShoppingCart className="w-4 h-4 text-[color:var(--brand-accent)]" /> Add to cart</>}
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-10 h-10 rounded-lg bg-[#25D366] hover:bg-[#1fb857] text-white flex items-center justify-center shrink-0"
                title="Enquire on WhatsApp"
                aria-label="Enquire on WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
