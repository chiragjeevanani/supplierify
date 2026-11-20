import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_LINKS } from './SiteFooter';

export const LEGAL_UPDATED = '20 November 2026';

/** Shared layout for the legal / policy pages. */
export default function LegalPage({ title, children }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[color:var(--brand-primary)]">{title}</h1>
      <p className="text-xs text-stone-500 mt-1">Last updated: {LEGAL_UPDATED}</p>
      <div className="mt-6 space-y-7 text-sm text-stone-700 leading-relaxed">{children}</div>
      <nav className="mt-10 pt-5 border-t border-[color:var(--brand-border)] flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-label="Legal pages">
        {LEGAL_LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="underline text-[color:var(--brand-primary)] font-semibold">{l.label}</Link>
        ))}
      </nav>
    </div>
  );
}

export function Section({ n, title, children }) {
  return (
    <section>
      <h2 className="font-serif text-lg font-bold text-[color:var(--brand-primary)] mb-2">{n ? `${n}. ` : ''}{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export const List = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1">
    {items.map((i) => <li key={i}>{i}</li>)}
  </ul>
);
