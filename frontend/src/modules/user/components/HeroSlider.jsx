import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

import { bannerApi, assetUrl } from '../../../utils/api';

const AUTOPLAY_MS = 6000;

function BannerLink({ to, className, children, label }) {
  if (to && to.startsWith('/')) return <Link to={to} className={className} aria-label={label}>{children}</Link>;
  return <a href={to || '#'} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>{children}</a>;
}

/**
 * Home-page banner slideshow managed in Admin > Banners.
 * Shows `fallback` (the default welcome section) when there is no active banner.
 */
export default function HeroSlider({ fallback }) {
  const [allBanners, setBanners] = useState(null); // null = loading
  const [brokenIds, setBrokenIds] = useState(() => new Set());
  const [index, setIndex] = useState(0);
  // Slides whose image can't be loaded are dropped instead of showing an empty coloured box
  const banners = allBanners && allBanners.filter((b) => !brokenIds.has(b._id));
  const markBroken = (id) => setBrokenIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    bannerApi
      .getPublicBanners()
      .then((res) => { if (alive) setBanners(res?.data?.banners || []); })
      .catch(() => { if (alive) setBanners([]); });
    return () => { alive = false; };
  }, []);

  const count = banners?.length || 0;
  const go = useCallback((n) => setIndex((n + count) % Math.max(count, 1)), [count]);

  useEffect(() => {
    clearInterval(timer.current);
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (count < 2 || paused || reduceMotion) return undefined;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer.current);
  }, [count, paused]);

  if (banners === null) {
    return <div className="rounded-2xl bg-[color:var(--brand-border)]/60 animate-pulse aspect-[16/9] sm:aspect-[16/6]" aria-hidden />;
  }
  if (count === 0) return fallback;
  if (index >= count) setIndex(0);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="relative overflow-hidden rounded-2xl bg-[color:var(--brand-primary)] aspect-[16/9] sm:aspect-[16/6]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {banners.map((b, i) => {
        const active = i === index;
        const hasText = Boolean(b.title || b.subtitle);
        return (
          <div
            key={b._id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
          >
            <img
              src={assetUrl(b.image)}
              alt={b.title || 'Banner'}
              className="absolute inset-0 w-full h-full object-cover"
              data-no-fallback
              onError={() => markBroken(b._id)}
              loading="eager"
              decoding="async"
            />
            {hasText ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--brand-primary)]/85 via-[color:var(--brand-primary)]/45 to-transparent" />
                <div className="relative h-full flex flex-col justify-center px-5 sm:px-12 max-w-xl sm:max-w-2xl text-white">
                  {b.title && <h2 className="font-serif text-2xl sm:text-4xl font-bold leading-tight drop-shadow">{b.title}</h2>}
                  {b.subtitle && <p className="mt-2 text-sm sm:text-base text-white/90 line-clamp-3">{b.subtitle}</p>}
                  {b.ctaLabel && (
                    <BannerLink
                      to={b.link}
                      className="mt-4 sm:mt-6 self-start inline-flex items-center gap-2 rounded-lg bg-[color:var(--brand-accent)] text-[color:var(--brand-primary)] font-bold px-5 py-2.5 sm:py-3 text-sm hover:bg-[color:var(--brand-accent-light)]"
                    >
                      {b.ctaLabel} <ArrowRight className="w-4 h-4" />
                    </BannerLink>
                  )}
                </div>
              </>
            ) : (
              <BannerLink to={b.link} className="absolute inset-0" label={b.ctaLabel || 'Open banner'}>
                <span className="sr-only">{b.ctaLabel || 'Open banner'}</span>
              </BannerLink>
            )}
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b._id}
                onClick={() => setIndex(i)}
                aria-label={`Show banner ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-[color:var(--brand-accent)]' : 'w-2 bg-white/60 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
