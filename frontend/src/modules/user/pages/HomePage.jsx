import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, CreditCard, Truck, ShieldCheck } from 'lucide-react';
import WhatsAppIcon from '../../../components/WhatsAppIcon';

import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import { BRAND } from '../../../config/brand';
import { useAdmin } from '../../../context/AdminContext';
import { useStoreRules } from '../../../hooks/useStoreRules';
import { buildGeneralEnquiry, buildWhatsAppUrl } from '../../../utils/whatsapp';
import { resolveOptimizedProductImage } from '../../../utils/productImage';

function SectionHeader({ title, to, linkLabel = 'View All' }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-serif text-xl sm:text-2xl font-bold text-[color:var(--brand-primary)]">{title}</h2>
      {to && (
        <Link to={to} className="text-sm font-bold text-[color:var(--brand-accent-darker)] hover:text-[color:var(--brand-primary)] inline-flex items-center gap-1">
          {linkLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const { products = [], categories: rawCategories = [], refreshProducts } = useAdmin();
  const rules = useStoreRules();

  useEffect(() => {
    if (refreshProducts) refreshProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const rank = (c) => (Number.isFinite(Number(c.sortOrder ?? c.order)) ? Number(c.sortOrder ?? c.order) : 9999);
    return [...rawCategories]
      .filter((c) => !c.status || String(c.status).toLowerCase() === 'active')
      .sort((a, b) => rank(a) - rank(b));
  }, [rawCategories]);

  const featured = useMemo(() => {
    const picked = products.filter((p) => p.isFeatured);
    return (picked.length ? picked : products).slice(0, 4);
  }, [products]);

  const popular = useMemo(() => {
    const picked = products.filter((p) => p.isBestseller);
    return (picked.length ? picked : products).slice(0, 4);
  }, [products]);

  const waUrl = buildWhatsAppUrl(rules.whatsappNumber, buildGeneralEnquiry({ storeName: rules.storeName }));

  const steps = [
    { icon: Boxes, title: `Choose your quantity`, text: `Pick products by the kilo. Minimum order is ${rules.minOrderQtyKg} kg per product.` },
    { icon: CreditCard, title: 'Pay online or enquire', text: 'Checkout securely with Razorpay, or tap WhatsApp to talk to us and finalise manually.' },
    { icon: Truck, title: 'Delivered to you', text: 'We pack in bulk and ship to your business address with tracking.' }
  ];

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-7xl mx-auto space-y-8 sm:space-y-10">
      {/* Hero: admin-managed banner slideshow, default welcome section when there are no banners */}
      <HeroSlider
        fallback={
      <section className="relative overflow-hidden rounded-2xl bg-[color:var(--brand-primary)] text-white px-5 sm:px-10 py-8 sm:py-12">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-[color:var(--brand-accent)]/15" aria-hidden />
        <div className="absolute right-24 -bottom-16 w-48 h-48 rounded-full bg-[color:var(--brand-accent)]/10" aria-hidden />
        <div className="relative max-w-2xl">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--brand-accent)] mb-3">
            Wholesale only
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
            {BRAND.tagline}
          </h2>
          <p className="mt-3 text-white/80 text-sm sm:text-base">
            Almonds, cashews, dates, raisins and more, sold by the kilo at wholesale rates.
            Minimum order <strong className="text-[color:var(--brand-accent)]">{rules.minOrderQtyKg} kg</strong> per product.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--brand-accent)] text-[color:var(--brand-primary)] font-bold px-5 py-3 hover:bg-[color:var(--brand-accent-light)]"
            >
              Browse catalogue <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] text-white font-bold px-5 py-3 hover:bg-[#1fb857]"
            >
              <WhatsAppIcon className="w-5 h-5" /> Enquire on WhatsApp
            </a>
          </div>
        </div>
      </section>
        }
      />

      {/* How it works */}
      <section aria-label="How it works" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {steps.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3 rounded-xl bg-white border border-[color:var(--brand-border)] p-4">
            <span className="w-10 h-10 rounded-lg bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-[color:var(--brand-primary)] text-sm">{title}</h3>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section aria-label="Categories">
          <SectionHeader title="Explore by Categories" to="/shop?tab=categories" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((c) => (
              <Link
                key={c._id || c.id || c.slug}
                to={`/shop?category=${c.slug}`}
                className="group rounded-xl overflow-hidden bg-white border border-[color:var(--brand-border)] hover:border-[color:var(--brand-accent)] hover:shadow-md transition-all"
              >
                <div className="aspect-[4/3] bg-[color:var(--brand-surface)] overflow-hidden">
                  <img
                    src={resolveOptimizedProductImage(c.image, { width: 360 })}
                    alt={c.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm text-[color:var(--brand-primary)] line-clamp-1">{c.name}</h3>
                  {c.subtext && <p className="text-[11px] text-stone-500 line-clamp-1">{c.subtext}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section aria-label="Top featured products">
          <SectionHeader title="Top Featured Products" to="/shop" />
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {featured.map((p, i) => (
              <ProductCard key={p._id || p.id || p.slug} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <section aria-label="Most popular products">
          <SectionHeader title="Most Popular Products" to="/shop" />
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {popular.map((p) => (
              <ProductCard key={p._id || p.id || p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {products.length === 0 && (
        <section className="rounded-xl bg-white border border-dashed border-[color:var(--brand-accent)] p-8 text-center text-stone-600">
          Products will appear here once the catalogue is loaded.
        </section>
      )}

      {/* Closing CTA */}
      <section className="rounded-2xl bg-white border border-[color:var(--brand-border)] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-8 h-8 text-[color:var(--brand-primary)] shrink-0" />
          <div>
            <h3 className="font-serif text-lg font-bold text-[color:var(--brand-primary)]">Need a custom quantity or a special rate?</h3>
            <p className="text-sm text-stone-600">Message us on WhatsApp with your requirement and we will get back to you with the best price.</p>
          </div>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] text-white font-bold px-5 py-3 hover:bg-[#1fb857] shrink-0"
        >
          <WhatsAppIcon className="w-5 h-5" /> Chat with us
        </a>
      </section>
    </div>
  );
}
