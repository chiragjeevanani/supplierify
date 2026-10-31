import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';

import ProductCard from '../components/ProductCard';
import { useAdmin } from '../../../context/AdminContext';
import { useStoreRules } from '../../../hooks/useStoreRules';
import { resolveOptimizedProductImage } from '../../../utils/productImage';

const PAGE_SIZE = 12;

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' }
];

export default function ShopPage() {
  const { products = [], categories: rawCategories = [], refreshProducts } = useAdmin();
  const rules = useStoreRules();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = (searchParams.get('search') || '').trim();
  const showCategories = searchParams.get('tab') === 'categories';

  const [sortBy, setSortBy] = useState('featured');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (refreshProducts) refreshProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setVisible(PAGE_SIZE);
    window.scrollTo({ top: 0 });
  }, [activeCategory, searchQuery, sortBy]);

  const categories = useMemo(() => {
    const rank = (c) => (Number.isFinite(Number(c.sortOrder ?? c.order)) ? Number(c.sortOrder ?? c.order) : 9999);
    return [...rawCategories]
      .filter((c) => !c.status || String(c.status).toLowerCase() === 'active')
      .sort((a, b) => rank(a) - rank(b) || String(a.name || '').localeCompare(String(b.name || '')));
  }, [rawCategories]);

  const results = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const cat = categories.find((c) => c.slug === activeCategory || String(c._id || c.id) === activeCategory);

    const list = products.filter((p) => {
      if (activeCategory !== 'all') {
        const pc = String(p.category || '').toLowerCase();
        const matches =
          pc === activeCategory.toLowerCase() ||
          (cat && (pc === String(cat.slug || '').toLowerCase() || pc === String(cat.name || '').toLowerCase()));
        if (!matches) return false;
      }
      if (q) {
        const hay = `${p.name} ${p.subtitle || ''} ${p.flavor || ''} ${p.category || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price-asc') sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'price-desc') sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'name') sorted.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    else sorted.sort((a, b) => Number(Boolean(b.isFeatured || b.isBestseller)) - Number(Boolean(a.isFeatured || a.isBestseller)));
    return sorted;
  }, [products, categories, activeCategory, searchQuery, sortBy]);

  const selectCategory = (slug) => {
    const next = {};
    if (slug !== 'all') next.category = slug;
    if (searchQuery) next.search = searchQuery;
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const activeCategoryName = categories.find((c) => c.slug === activeCategory)?.name;

  // Categories directory view
  if (showCategories) {
    return (
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-7xl mx-auto">
        <h2 className="font-serif text-2xl font-bold text-[color:var(--brand-primary)] mb-4">All Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((c) => (
            <Link
              key={c._id || c.id || c.slug}
              to={`/shop?category=${c.slug}`}
              className="group rounded-xl overflow-hidden bg-white border border-[color:var(--brand-border)] hover:border-[color:var(--brand-accent)] hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] bg-[color:var(--brand-surface)] overflow-hidden">
                <img
                  src={resolveOptimizedProductImage(c.image, { width: 400 })}
                  alt={c.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-[color:var(--brand-primary)]">{c.name}</h3>
                {c.description && <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{c.description}</p>}
              </div>
            </Link>
          ))}
        </div>
        {categories.length === 0 && <p className="text-stone-500">No categories yet.</p>}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[color:var(--brand-primary)]">
            {activeCategoryName || (searchQuery ? 'Search results' : 'All Products')}
          </h2>
          <p className="text-sm text-stone-600 mt-0.5">
            Priced per kg. Minimum order {rules.minOrderQtyKg} kg per product.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <span className="text-stone-600">Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-[color:var(--brand-border-strong)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-accent)]"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-3" role="tablist" aria-label="Categories">
        {[{ slug: 'all', name: 'All' }, ...categories].map((c) => {
          const on = activeCategory === c.slug;
          return (
            <button
              key={c.slug}
              role="tab"
              aria-selected={on}
              onClick={() => selectCategory(c.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                on
                  ? 'bg-[color:var(--brand-primary)] text-white border-[color:var(--brand-primary)]'
                  : 'bg-white text-[color:var(--brand-primary)] border-[color:var(--brand-border-strong)] hover:border-[color:var(--brand-accent)]'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {searchQuery && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-accent)]/15 text-[color:var(--brand-accent-darker)] px-3 py-1.5 text-sm font-semibold">
          <Search className="w-4 h-4" /> "{searchQuery}"
          <button onClick={clearFilters} aria-label="Clear search" className="hover:text-black"><X className="w-4 h-4" /></button>
        </div>
      )}

      {results.length === 0 ? (
        <div className="rounded-xl bg-white border border-dashed border-[color:var(--brand-accent)] p-10 text-center">
          <p className="font-semibold text-[color:var(--brand-primary)]">No products found</p>
          <p className="text-sm text-stone-500 mt-1">Try a different category or search term.</p>
          <button onClick={clearFilters} className="mt-4 rounded-lg bg-[color:var(--brand-primary)] text-white font-bold px-5 py-2.5 text-sm">
            Show all products
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-stone-500 mb-3">{results.length} product{results.length === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {results.slice(0, visible).map((p, i) => (
              <ProductCard key={p._id || p.id || p.slug} product={p} priority={i < 4} />
            ))}
          </div>
          {visible < results.length && (
            <div className="text-center mt-6">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-lg border border-[color:var(--brand-primary)] text-[color:var(--brand-primary)] font-bold px-6 py-2.5 hover:bg-[color:var(--brand-primary)] hover:text-white transition-colors"
              >
                Show more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
