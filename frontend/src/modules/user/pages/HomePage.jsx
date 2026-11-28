import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, CreditCard, Truck, ShieldCheck } from 'lucide-react';
import WhatsAppIcon from '../../../components/WhatsAppIcon';

import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import { BRAND } from '../../../config/brand';
import { useAdmin } from '../../../context/AdminContext';
import { useStoreRules } from '../../../hooks/useStoreRules';
import { CATEGORY_GROUPS, groupOf, productInCategory } from '../../../utils/categoryGroups';
import { buildGeneralEnquiry, buildWhatsAppUrl } from '../../../utils/whatsapp';

function SectionHeader({ title, subtitle, to, linkLabel = 'View All' }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[color:var(--brand-primary)]">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm text-stone-500 mt-0.5 line-clamp-1">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="shrink-0 text-sm font-bold text-[color:var(--brand-accent-darker)] hover:text-[color:var(--brand-primary)] inline-flex items-center gap-1">
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
    if (refreshProducts) refreshProducts().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const rank = (c) => (Number.isFinite(Number(c.sortOrder ?? c.order)) ? Number(c.sortOrder ?? c.order) : 9999);
    return [...rawCategories]
      .filter((c) => !c.status || String(c.status).toLowerCase() === 'active')
      .sort((a, b) => rank(a) - rank(b));
  }, [rawCategories]);

  // One section per store group (Dry Fruits, Metals, Garments, Household Furniture), in that order.
  // Each lists its products underneath; a group with no products is not shown.
  const groupSections = useMemo(() => {
    return CATEGORY_GROUPS.map((g) => {
      const cats = categories.filter((c) => groupOf(c) === g.id);
      const seen = new Set();
      const items = [];
      cats.forEach((c) => {
        products.forEach((p) => {
          const key = p._id || p.id || p.slug;
          if (!seen.has(key) && productInCategory(p, c)) { seen.add(key); items.push(p); }
        });
      });
      const chips = cats.filter((c) => products.some((p) => productInCategory(p, c)));
      return { group: g, items, chips };
    }).filter((s) => s.items.length > 0);
  }, [categories, products]);

  const featured = useMemo(() => {
    const picked = products.filter((p) => p.isFeatured);
    return (picked.length ? picked : products).slice(0, 4);
  }, [products]);

  const popular = useMemo(() => {
    const picked = products.filter((p) => p.isBestseller);
    return (picked.length ? picked : products).slice(0, 4);
  }, [products]);

  const waUrl = buildWhatsAppUrl(rules.whatsappNumber, buildGeneralEnquiry({ greeting: rules.whatsappGreeting }));

  const steps = [
    { icon: Boxes, title: `Choose your quantity`, text: `Pick products by the kilo, piece or set. Dry fruits have a minimum of ${rules.minOrderQtyKg} kg per product.` },
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
          <span className="inline-block text-[length:calc(11px*var(--fs))] font-bold uppercase tracking-[0.18em] text-[color:var(--brand-accent)] mb-3">
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
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] text-white font-bold px-5 py-3 hover:bg-[#1fb857]"
              >
                <WhatsAppIcon className="w-5 h-5" /> Enquire on WhatsApp
              </a>
            )}
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

      {/* One section per store group, products underneath */}
      {groupSections.map(({ group, items, chips }) => (
        <section
          key={group.id}
          aria-label={group.label}
          className="rounded-2xl border border-[color:var(--brand-border)] bg-[color:var(--brand-accent)]/10 p-3 sm:p-5 lg:p-6"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-1.5 h-9 sm:h-10 rounded-sm bg-[color:var(--brand-accent)] shrink-0" aria-hidden="true" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[color:var(--brand-primary)] leading-tight">{group.label}</h2>
            </div>
            <Link
              to={`/shop?group=${group.id}`}
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white border border-[color:var(--brand-border)] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-[color:var(--brand-primary)] hover:border-[color:var(--brand-accent)] hover:shadow-sm transition-all"
            >
              {items.length > 8 ? `View all ${items.length}` : 'View all'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {chips.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
              {chips.map((c) => (
                <Link
                  key={c._id || c.id || c.slug}
                  to={`/shop?category=${c.slug}`}
                  className="shrink-0 rounded-full bg-white border border-[color:var(--brand-border)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-primary)] hover:border-[color:var(--brand-accent)]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {items.slice(0, 8).map((p, i) => (
              <ProductCard key={p._id || p.id || p.slug} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      ))}

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
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] text-white font-bold px-5 py-3 hover:bg-[#1fb857] shrink-0"
          >
            <WhatsAppIcon className="w-5 h-5" /> Chat with us
          </a>
        )}
      </section>
    </div>
  );
}
