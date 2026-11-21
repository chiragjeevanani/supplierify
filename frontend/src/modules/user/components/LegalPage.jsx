import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { settingsApi } from '../../../utils/api';
import { useStoreRules } from '../../../hooks/useStoreRules';
import { DEFAULT_LEGAL_TEXT, fillTokens, legalVars } from '../../../utils/legalDefaults';

/** Links to the legal pages (shown at the bottom of each of them and in the checkout). */
export const LEGAL_LINKS = [
  { to: '/terms-and-conditions', label: 'Terms & Conditions' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/shipping-and-return-policy', label: 'Shipping & Return Policy' },
  { to: '/grievance-redressal', label: 'Grievance Redressal' }
];

export const LEGAL_UPDATED = '20 November 2026';

const formatDate = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
};

/** Shared layout for the legal / policy pages. */
export default function LegalPage({ title, children, updated }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[color:var(--brand-primary)]">{title}</h1>
      <p className="text-xs text-stone-500 mt-1">Last updated: {updated || LEGAL_UPDATED}</p>
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

/* ---- simple text format used by the admin-editable pages ---- */

const SAFE_URL = /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i;

function inline(text) {
  const out = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={i++}>{m[1]}</strong>);
    } else if (SAFE_URL.test(m[3])) {
      out.push(m[3].startsWith('/')
        ? <Link key={i++} to={m[3]} className="underline">{m[2]}</Link>
        : <a key={i++} href={m[3]} className="underline" target={m[3].startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{m[2]}</a>);
    } else {
      out.push(m[2]); // unsafe link: show only the words
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Renders: "## Heading", "- bullet", blank-line separated paragraphs, **bold**, [text](/link). Never raw HTML. */
export function LegalMarkdown({ text }) {
  const blocks = [];
  let para = [];
  let list = [];
  const flushPara = () => { if (para.length) { blocks.push({ t: 'p', v: para.join(' ') }); para = []; } };
  const flushList = () => { if (list.length) { blocks.push({ t: 'ul', v: list }); list = []; } };
  String(text || '').replace(/\r/g, '').split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); return; }
    const h = line.match(/^#{1,3}\s+(.*)$/);
    if (h) { flushPara(); flushList(); blocks.push({ t: 'h', v: h[1] }); return; }
    const b = line.match(/^[-*•]\s+(.*)$/);
    if (b) { flushPara(); list.push(b[1]); return; }
    flushList();
    para.push(line);
  });
  flushPara();
  flushList();

  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === 'h') return <h2 key={i} className="font-serif text-lg font-bold text-[color:var(--brand-primary)] mt-2">{inline(b.v)}</h2>;
        if (b.t === 'ul') return <ul key={i} className="list-disc pl-5 space-y-1">{b.v.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>;
        return <p key={i}>{inline(b.v)}</p>;
      })}
    </>
  );
}

/** Who owns the store and where to reach them. Always shown on the Privacy Policy page (it is not part of the editable text). */
function BusinessDetails({ r }) {
  const email = r.supportEmail || r.storeEmail;
  const phone = r.supportPhone || r.storePhone;
  const row = (label, value, href) => (value ? (
    <div className="flex flex-col sm:flex-row sm:gap-3 py-2 border-b border-stone-100 last:border-0">
      <dt className="sm:w-44 text-xs font-bold uppercase tracking-wider text-stone-500 shrink-0">{label}</dt>
      <dd className="font-semibold text-stone-900 break-words">{href ? <a href={href} className="underline">{value}</a> : value}</dd>
    </div>
  ) : null);
  return (
    <section>
      <h2 className="font-serif text-lg font-bold text-[color:var(--brand-primary)] mb-2">Business details</h2>
      <p className="mb-2">{r.storeName || 'Supplierfy'}.in is owned and operated by <strong>{r.companyName}</strong>.</p>
      <dl className="rounded-xl border border-[color:var(--brand-border)] bg-white px-4 py-1">
        {row('Company', r.companyName)}
        {row('GSTIN', r.companyGstin)}
        {row('FSSAI', r.fssaiNumber ? `Lic. No. ${r.fssaiNumber}` : 'Registration under process')}
        {row('Registered office', r.companyAddress)}
        {row('Dispatch address', r.dispatchAddress)}
        {row('Email', email, email ? `mailto:${email}` : '')}
        {row('Phone', phone, phone ? `tel:${String(phone).replace(/[^\d+]/g, '')}` : '')}
      </dl>
    </section>
  );
}

/**
 * A legal page whose text the admin can edit (Admin > Legal Pages).
 * Falls back to the standard text when nothing has been edited, or when the server cannot be reached.
 */
export function LegalDocument({ pageKey, title }) {
  const rules = useStoreRules();
  const [state, setState] = useState({ loaded: false, content: '', updatedAt: null });

  useEffect(() => {
    let off = false;
    settingsApi.getLegalPage(pageKey)
      .then((res) => { if (!off) setState({ loaded: true, content: String(res?.data?.content || ''), updatedAt: res?.data?.updatedAt || null }); })
      .catch(() => { if (!off) setState({ loaded: true, content: '', updatedAt: null }); });
    return () => { off = true; };
  }, [pageKey]);

  const text = fillTokens(state.content.trim() ? state.content : DEFAULT_LEGAL_TEXT[pageKey], legalVars(rules));
  return (
    <LegalPage title={title} updated={state.content.trim() ? formatDate(state.updatedAt) || LEGAL_UPDATED : LEGAL_UPDATED}>
      {state.loaded ? <LegalMarkdown text={text} /> : <p className="text-stone-400">Loading…</p>}
      {state.loaded && pageKey === 'privacy' && <BusinessDetails r={rules} />}
    </LegalPage>
  );
}
