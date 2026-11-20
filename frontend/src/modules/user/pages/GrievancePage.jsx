import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { Section, List } from '../components/LegalPage';
import { useStoreRules } from '../../../hooks/useStoreRules';

export default function GrievancePage() {
  const r = useStoreRules();
  const email = r.grievanceEmail || r.supportEmail || r.storeEmail;
  const hasOfficer = Boolean(r.grievanceName);

  const row = (label, value, href) => (
    value ? (
      <div className="flex flex-col sm:flex-row sm:gap-3 py-2 border-b border-stone-100 last:border-0">
        <dt className="sm:w-40 text-xs font-bold uppercase tracking-wider text-stone-500">{label}</dt>
        <dd className="font-semibold text-stone-900">{href ? <a href={href} className="underline">{value}</a> : value}</dd>
      </div>
    ) : null
  );

  return (
    <LegalPage title="Grievance Redressal">
      <p>
        If you have a complaint about an order, a payment, product quality, or how your personal data is handled on {r.storeName || 'Supplierfy'}.in
        (owned and operated by <strong>{r.companyName}</strong>), please contact our Grievance Officer. This page is published as required under the
        Consumer Protection (E-Commerce) Rules, 2020, the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.
      </p>

      <Section title="Grievance Officer">
        {hasOfficer ? (
          <dl className="rounded-xl border border-[color:var(--brand-border)] bg-white px-4 py-2">
            {row('Name', r.grievanceName)}
            {row('Designation', r.grievanceDesignation)}
            {row('Company', r.companyName)}
            {row('Email', email, email ? `mailto:${email}` : '')}
            {row('Phone', r.grievancePhone, r.grievancePhone ? `tel:${r.grievancePhone.replace(/[^\d+]/g, '')}` : '')}
            {row('Address', r.companyAddress)}
          </dl>
        ) : (
          <p className="rounded-xl border border-dashed border-[color:var(--brand-accent)] bg-white px-4 py-3">
            Our Grievance Officer details are being updated. Meanwhile please write to{' '}
            {email ? <a href={`mailto:${email}`} className="underline font-semibold">{email}</a> : 'us through the Contact page'} and your complaint will be handled by our team.
          </p>
        )}
      </Section>

      <Section title="How to raise a complaint">
        <List items={[
          'Email the Grievance Officer with your name, phone number, order number (if any) and a clear description of the problem. Attach photos or screenshots where useful.',
          'For damaged or short deliveries, also follow the claim steps in the Shipping, Return & Refund Policy.',
          'Complaints about your personal data (access, correction or deletion) are handled the same way.'
        ]} />
      </Section>

      <Section title="Resolution timeline">
        <p>{r.grievanceTimeline}</p>
      </Section>

      <p>
        See also: <Link to="/terms-and-conditions" className="underline">Terms & Conditions</Link>,{' '}
        <Link to="/privacy-policy" className="underline">Privacy Policy</Link>,{' '}
        <Link to="/shipping-and-return-policy" className="underline">Shipping, Return & Refund Policy</Link>.
      </p>
    </LegalPage>
  );
}
