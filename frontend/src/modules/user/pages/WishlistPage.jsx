import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, ShoppingBag, Trash2, ArrowRight, ChevronRight, 
  Sparkles, Star, Check, ArrowLeft, ShieldCheck, Truck, RefreshCw, Eye
} from 'lucide-react';


import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import { useAdmin } from '../../../context/AdminContext';
import { resolveProductImage } from '../../../utils/productImage';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, wishlistItems, toggleWishlist, clearWishlist, wishlistCount, isLoading } = useWishlist();
  const { addToCart, itemCount } = useCart();
  const { products: PRODUCTS } = useAdmin();

  // Find products that are currently in the wishlist (supporting ID, _id, and slug matching)
  const matchedFromCatalog = (PRODUCTS || []).filter(p => {
    const pid = String(p.id || p._id || '');
    const slug = String(p.slug || '');
    return (pid && wishlist.includes(pid)) || (slug && wishlist.includes(slug));
  });

  // Also include any items stored directly in backend wishlist that might not be in PRODUCTS
  const catalogLookup = new Set(
    matchedFromCatalog.flatMap(p => [String(p.id), String(p._id || ''), p.slug]).filter(Boolean)
  );

  const additionalFromBackend = (wishlistItems || []).filter(it => {
    const itId = String(it.id || it.productId || '');
    const itSlug = it.slug;
    return !catalogLookup.has(itId) && (!itSlug || !catalogLookup.has(itSlug));
  });

  const wishlistedProducts = [...matchedFromCatalog, ...additionalFromBackend];

  // Similar products to recommend when empty or below
  const recommendedProducts = (PRODUCTS || []).filter(p => {
    const pid = String(p.id || p._id || '');
    const slug = String(p.slug || '');
    const isSaved = (pid && wishlist.includes(pid)) || (slug && wishlist.includes(slug));
    return !isSaved;
  }).slice(0, 6);

  const handleMoveAllToCart = () => {
    wishlistedProducts.forEach(product => {
      addToCart(product, '1 kg', 1, false);
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[color:var(--brand-surface)] text-[color:var(--brand-text)] selection:bg-[color:var(--brand-accent)] selection:text-[color:var(--brand-primary)]">
      
      {/* 1. DESKTOP HEADER: Shown only on md: and above */}
      <div className="hidden md:block">
      </div>

      {/* 2. DEDICATED MOBILE HEADER: Shown only on mobile (< md:) */}
      <header className="md:hidden sticky top-0 z-40 bg-[color:var(--brand-primary)] text-white px-3.5 py-3 shadow-md border-b border-[color:var(--brand-accent)]/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <h1 className="font-serif text-base font-bold text-[color:var(--brand-border-strong)] tracking-tight leading-tight">
                My Wishlist
              </h1>
            </div>
            <p className="text-[length:calc(10px*var(--fs))] text-[color:var(--brand-accent)] font-medium leading-none mt-0.5">
              {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'item saved' : 'items saved'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wishlistedProducts.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-[length:calc(10px*var(--fs))] font-bold text-stone-300 hover:text-rose-400 px-2.5 py-1 rounded-lg bg-white/5 active:scale-95 transition-all"
            >
              Clear
            </button>
          )}
          <Link
            to="/cart"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white relative transition-all"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-[color:var(--brand-accent)]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 bg-rose-500 text-white text-[length:calc(9px*var(--fs))] font-extrabold rounded-full flex items-center justify-center leading-none">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1 py-3 sm:py-8 md:py-12 max-w-[1450px] mx-auto px-3 sm:px-6 lg:px-8 w-full pb-10 sm:pb-16">
        
        {/* Breadcrumb Navigation & Desktop Header */}
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[color:var(--brand-border)]">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-1">
              <Link to="/" className="hover:text-[color:var(--brand-primary)] transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/shop" className="hover:text-[color:var(--brand-primary)] transition-colors">Shop</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[color:var(--brand-primary)] font-bold">My Wishlist</span>
            </nav>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[color:var(--brand-primary)] tracking-tight">
              Favourite Products
            </h1>
          </div>

          {wishlistedProducts.length > 0 && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={clearWishlist}
                className="text-xs text-stone-500 hover:text-rose-600 font-bold px-3 py-1.5 rounded-xl border border-stone-200 hover:border-rose-300 bg-white transition-all shadow-2xs"
              >
                Clear Wishlist
              </button>

              <button
                onClick={handleMoveAllToCart}
                className="px-3.5 py-1.5 rounded-xl bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] hover:bg-[color:var(--brand-primary-light)] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Move All to Cart</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Quick Action Bar (shown on mobile when items exist) */}
        {wishlistedProducts.length > 0 && (
          <div className="md:hidden flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[color:var(--brand-border)] shadow-2xs mb-3">
            <span className="text-[length:calc(11px*var(--fs))] font-medium text-stone-600">
              <strong className="text-[color:var(--brand-primary)]">{wishlistedProducts.length}</strong> items saved
            </span>
            <button
              onClick={handleMoveAllToCart}
              className="px-2.5 py-1 rounded-lg bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] active:scale-95 text-[length:calc(10px*var(--fs))] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-2xs"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Move All to Cart</span>
            </button>
          </div>
        )}

        {wishlistedProducts.length === 0 ? (
          /* Empty Wishlist State (Compact on mobile, generous on desktop) */
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-14 text-center border border-[color:var(--brand-border)] shadow-xs my-4 sm:my-8 max-w-xl mx-auto space-y-4 sm:space-y-5 animate-fadeIn">
            <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-full bg-[color:var(--brand-surface)] border-2 border-[color:var(--brand-accent)]/40 flex items-center justify-center text-rose-500 shadow-inner">
              <Heart className="w-7 h-7 sm:w-10 sm:h-10 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-2xl font-bold text-[color:var(--brand-primary)]">Your Wishlist is Empty</h2>
              <p className="text-[length:calc(11px*var(--fs))] sm:text-xs text-stone-600 leading-relaxed mt-1 sm:mt-2 max-w-md mx-auto">
                Save your favorite dry fruits, Dry Fruits flavors, and wellness combos so you can find them easily later.
              </p>
            </div>
            <div className="pt-1 sm:pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl sm:rounded-2xl bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] hover:bg-[color:var(--brand-primary-light)] font-extrabold text-[length:calc(11px*var(--fs))] sm:text-xs uppercase tracking-wider transition-all shadow-md hover:scale-102 group"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[color:var(--brand-accent)] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          /* Compact Wishlist Items Grid */
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="hidden md:flex items-center justify-between">
              <p className="text-xs text-stone-600 font-medium">
                Showing <strong className="text-[color:var(--brand-primary)]">{wishlistedProducts.length}</strong> saved items
              </p>
              <Link to="/shop" className="text-xs font-bold text-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary-lighter)] flex items-center gap-1">
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Compact Responsive Grid: 2 columns on mobile, scaling to 6 on xl */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {wishlistedProducts.map((p, idx) => {
                const targetKey = p.id || p._id || p.slug || idx;
                const targetLink = `/product/${p.slug || p.id || p._id}`;
                const displayImg = resolveProductImage(p);

                return (
                  <div 
                    key={targetKey} 
                    className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[color:var(--brand-border)] shadow-xs hover:border-[color:var(--brand-accent)] hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    {/* Thumbnail and Badge */}
                    <div className="relative mb-1.5 sm:mb-2">
                      <Link to={targetLink} className="aspect-square rounded-lg sm:rounded-xl bg-[color:var(--brand-surface)] p-1.5 sm:p-2 flex items-center justify-center overflow-hidden block">
                        <img 
                          src={displayImg} 
                          alt={p.name} 
                          className="w-full h-full object-cover rounded-md sm:rounded-lg group-hover:scale-105 transition-transform duration-500" 
                        />
                      </Link>

                      {/* Badge */}
                      {p.badge && (
                        <span className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 px-1.5 py-0.5 sm:px-2 rounded-md text-[length:calc(8px*var(--fs))] sm:text-[length:calc(9px*var(--fs))] font-extrabold uppercase tracking-wider bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] border border-[color:var(--brand-accent)]/30 shadow-2xs">
                          {p.badge}
                        </span>
                      )}

                      {/* Remove from Wishlist Heart Button */}
                      <button
                        onClick={() => toggleWishlist(p)}
                        className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/95 border border-stone-200 shadow-xs flex items-center justify-center text-rose-500 hover:scale-110 active:scale-95 transition-all"
                        title="Remove from wishlist"
                      >
                        <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-rose-500 text-rose-500" />
                      </button>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-0.5 sm:space-y-1">
                      {/* Stars */}
                      <div className="flex items-center gap-1 text-amber-500">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[length:calc(9px*var(--fs))] sm:text-[length:calc(10px*var(--fs))] text-stone-400 font-medium">({p.reviewsCount || 420})</span>
                      </div>

                      {/* Title */}
                      <Link 
                        to={targetLink} 
                        className="font-serif text-[length:calc(11px*var(--fs))] sm:text-xs font-bold text-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary-lighter)] block truncate transition-colors leading-tight"
                        title={p.name}
                      >
                        {p.name}
                      </Link>

                      {/* Price and Discount */}
                      <div className="flex items-baseline gap-1 pt-0.5">
                        <span className="font-extrabold text-[length:calc(11px*var(--fs))] sm:text-xs text-[color:var(--brand-primary)]">₹{p.price}</span>
                        {p.oldPrice && (
                          <span className="text-[length:calc(9px*var(--fs))] sm:text-[length:calc(10px*var(--fs))] text-stone-400 line-through">₹{p.oldPrice}</span>
                        )}
                        {p.discount && (
                          <span className="text-[length:calc(8px*var(--fs))] sm:text-[length:calc(9px*var(--fs))] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                            {p.discount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart CTA */}
                    <button
                      onClick={() => addToCart(p, '1 kg', 1, false)}
                      className="mt-2 sm:mt-3 w-full py-1 sm:py-1.5 bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] hover:bg-[color:var(--brand-primary-light)] text-[length:calc(10px*var(--fs))] sm:text-[length:calc(11px*var(--fs))] font-bold uppercase rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-98"
                    >
                      <ShoppingBag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM RECOMMENDATIONS (Compact cards) */}
        {recommendedProducts.length > 0 && (
          <section className="mt-8 sm:mt-18 pt-5 sm:pt-8 border-t border-[color:var(--brand-border)]">
            <div className="mb-3 sm:mb-5 flex items-center justify-between">
              <div>
                <span className="text-[length:calc(10px*var(--fs))] sm:text-[length:calc(11px*var(--fs))] uppercase tracking-widest text-[color:var(--brand-primary-lighter)] font-bold">RECOMMENDED FOR YOU</span>
                <h3 className="font-serif text-base sm:text-2xl font-bold text-[color:var(--brand-primary)] mt-0.5">Popular dry fruits</h3>
              </div>
              <Link to="/shop" className="text-xs font-bold text-[color:var(--brand-accent-dark)] hover:underline">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
              {recommendedProducts.map((p, idx) => {
                const targetKey = p.id || p._id || p.slug || idx;
                const targetLink = `/product/${p.slug || p.id || p._id}`;
                const displayImg = resolveProductImage(p);

                return (
                  <div 
                    key={targetKey} 
                    className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[color:var(--brand-border)] shadow-xs hover:border-[color:var(--brand-accent)] hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    <div className="relative mb-1.5 sm:mb-2">
                      <Link to={targetLink} className="aspect-square rounded-lg sm:rounded-xl bg-[color:var(--brand-surface)] p-1.5 sm:p-2 flex items-center justify-center overflow-hidden block">
                        <img 
                          src={displayImg} 
                          alt={p.name} 
                          className="w-full h-full object-cover rounded-md sm:rounded-lg group-hover:scale-105 transition-transform duration-500" 
                        />
                      </Link>
                      <button
                        onClick={() => toggleWishlist(p)}
                        className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/95 border border-stone-200 shadow-xs flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 active:scale-95 transition-all"
                        title="Add to wishlist"
                      >
                        <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-0.5 sm:space-y-1">
                      <Link 
                        to={targetLink} 
                        className="font-serif text-[length:calc(11px*var(--fs))] sm:text-xs font-bold text-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary-lighter)] block truncate transition-colors leading-tight"
                        title={p.name}
                      >
                        {p.name}
                      </Link>
                      <p className="text-[length:calc(11px*var(--fs))] sm:text-xs font-extrabold text-[color:var(--brand-primary)]">₹{p.price}</p>
                    </div>

                    <button
                      onClick={() => addToCart(p, '1 kg', 1, false)}
                      className="mt-2 sm:mt-3 w-full py-1 sm:py-1.5 bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] hover:bg-[color:var(--brand-primary-light)] text-[length:calc(10px*var(--fs))] sm:text-[length:calc(11px*var(--fs))] font-bold uppercase rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-98"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Trust Badges (Compact on mobile) */}
        <div className="mt-8 sm:mt-14 bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-[color:var(--brand-border)] shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5 text-left divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            <div className="flex items-center gap-3 sm:pr-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-accent)]/40 flex items-center justify-center text-[color:var(--brand-accent-dark)] shrink-0">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h5 className="text-[length:calc(11px*var(--fs))] sm:text-xs font-bold text-[color:var(--brand-primary)]">Free Express Delivery</h5>
                <p className="text-[length:calc(9px*var(--fs))] sm:text-[length:calc(10px*var(--fs))] text-stone-500">On all prepaid orders above ₹499</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2.5 sm:pt-0 sm:px-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-accent)]/40 flex items-center justify-center text-[color:var(--brand-accent-dark)] shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
              </div>
              <div>
                <h5 className="text-[length:calc(11px*var(--fs))] sm:text-xs font-bold text-[color:var(--brand-primary)]">100% Wetland Harvested</h5>
                <p className="text-[length:calc(9px*var(--fs))] sm:text-[length:calc(10px*var(--fs))] text-stone-500">Naturally puffed Grade-A dry fruits</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2.5 sm:pt-0 sm:pl-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-accent)]/40 flex items-center justify-center text-[color:var(--brand-accent-dark)] shrink-0">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h5 className="text-[length:calc(11px*var(--fs))] sm:text-xs font-bold text-[color:var(--brand-primary)]">Freshness Guarantee</h5>
                <p className="text-[length:calc(9px*var(--fs))] sm:text-[length:calc(10px*var(--fs))] text-stone-500">Airtight nitrogen-flushed seal</p>
              </div>
            </div>
          </div>
        </div>

      </main>

    </div>
  );
}
