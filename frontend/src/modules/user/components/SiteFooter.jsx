import React from 'react';
import { Link } from 'react-router-dom';
import { useStoreRules } from '../../../hooks/useStoreRules';
import { BRAND } from '../../../config/brand';
import SocialLinks from './SocialLinks';

export const LEGAL_LINKS = [
  { to: '/terms-and-conditions', label: 'Terms & Conditions' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/shipping-and-return-policy', label: 'Shipping & Return Policy' },
  { to: '/grievance-redressal', label: 'Grievance Redressal' }
];

/**
 * Site footer: ownership line, registered company details, FSSAI status and the legal links.
 * Everything here is edited by the admin in Settings, so nothing in this block is hard-coded.
 */
export default function SiteFooter({ className = '' }) {
  const r = useStoreRules();
  const brand = r.storeName || BRAND.name;
  const mark = r.showTrademark ? '™' : '';
  const email = r.supportEmail || r.storeEmail;
  const phone = r.supportPhone || r.storePhone;

  return (
    <footer className={`border-t border-[color:var(--brand-border)] bg-white px-4 sm:px-6 pt-6 pb-5 text-xs text-stone-600 ${className}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <p className="font-serif text-base font-bold text-[color:var(--brand-primary)]">{brand}{mark}</p>
          <p>{brand}.in is owned and operated by <strong className="text-stone-800">{r.companyName}</strong>.</p>
          {r.companyGstin && <p>GSTIN: {r.companyGstin}</p>}
          <p className="text-stone-700 font-semibold">
            {r.fssaiNumber ? `FSSAI Lic. No.: ${r.fssaiNumber}` : 'FSSAI Registration Under Process'}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="font-bold text-stone-800 uppercase tracking-wider text-[length:calc(10px*var(--fs))]">Registered office</p>
          {r.companyAddress && <p>{r.companyAddress}</p>}
          {r.dispatchAddress && <p><span className="font-semibold">Dispatch from:</span> {r.dispatchAddress}</p>}
          {email && (
            <p>
              Email: <a href={`mailto:${email}`} className="underline hover:text-[color:var(--brand-primary)]">{email}</a>
            </p>
          )}
          {phone && (
            <p>
              Phone: <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="underline hover:text-[color:var(--brand-primary)]">{phone}</a>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="font-bold text-stone-800 uppercase tracking-wider text-[length:calc(10px*var(--fs))]">Legal</p>
          <ul className="space-y-1">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="underline hover:text-[color:var(--brand-primary)]">{l.label}</Link>
              </li>
            ))}
          </ul>
          <SocialLinks variant="dark" showLabel className="pt-2" />
        </div>
      </div>

      <p className="max-w-7xl mx-auto mt-5 pt-3 border-t border-stone-100 text-center text-[length:calc(11px*var(--fs))] text-stone-500">
        © {new Date().getFullYear()} {brand}{mark} · {r.companyName}. Wholesale orders only.
      </p>
    </footer>
  );
}
