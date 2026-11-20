import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { Section, List } from '../components/LegalPage';
import { useStoreRules } from '../../../hooks/useStoreRules';

export default function PrivacyPolicyPage() {
  const r = useStoreRules();
  const brand = r.storeName || 'Supplierfy';
  const email = r.grievanceEmail || r.supportEmail || r.storeEmail;
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {brand}.in is owned and operated by <strong>{r.companyName}</strong> (“we”, “us”), {r.companyAddress}. This policy explains what personal data we collect from
        buyers and suppliers who use the Website, why, and the choices you have. It is written to meet the Digital Personal Data Protection Act, 2023
        (DPDP Act) and the Information Technology Act, 2000. By using the Website you agree to this policy.
      </p>

      <Section n="1" title="What we collect">
        <List items={[
          'Account details: name, mobile number (used for OTP login), email address, and the delivery addresses you save.',
          'Business details you choose to give: company name and GSTIN, used on your tax invoice.',
          'Order details: products, quantities, order value, payment method and status, delivery and tracking information.',
          'Technical data: device and browser type, approximate IP address and pages visited, used for security and to keep the Website working. Your cart and login are kept in your browser storage.',
          'Messages you send us by email, WhatsApp, phone or the contact form.'
        ]} />
      </Section>

      <Section n="2" title="Why we use it">
        <List items={[
          'To create your account, verify you by OTP, take and deliver your orders and send order updates.',
          'To issue GST invoices and keep the records the law requires.',
          'To take payments, handle refunds and prevent fraud.',
          'To answer your queries and complaints, and to improve the Website.',
          'To send service messages. We send promotional messages only with your consent, and you can opt out at any time.'
        ]} />
        <p>We process your data on the basis of your consent and, where the law allows, to fulfil your order and meet legal obligations.</p>
      </Section>

      <Section n="3" title="Who we share it with">
        <p>We do not sell your personal data. We share only what is needed with service providers who help us run the store:</p>
        <List items={[
          'Payment gateway (Razorpay) to process online payments. Card, UPI and bank details are entered on the gateway’s secure page; we do not store them.',
          'Logistics partners (our integrated courier platform and the couriers) to pick up and deliver your order: your name, address and phone number.',
          'SMS / OTP, email and hosting providers.',
          'Government or legal authorities when the law requires it.'
        ]} />
        <p>These providers may use your data only to provide their service to us and must protect it.</p>
      </Section>

      <Section n="4" title="Buyer and supplier data">
        <p>Business information such as company name, GSTIN, addresses and order history is treated as confidential. It is used only for the purposes above and is not shown to other buyers.</p>
      </Section>

      <Section n="5" title="How long we keep it">
        <p>We keep your data while your account is active and as long as needed for the purposes above. Invoices and accounting records are kept for the period required by tax and company law, even after you close your account.</p>
      </Section>

      <Section n="6" title="Security">
        <p>We use encrypted connections (HTTPS), access controls and secure hosting. No system is completely secure; if a data breach affecting you occurs, we will inform you and the authorities as the law requires.</p>
      </Section>

      <Section n="7" title="Your rights">
        <p>Under the DPDP Act you can ask us to give you a summary of the data we hold, correct or complete it, erase it (subject to legal record-keeping), withdraw your consent, and have your grievance addressed. Write to our Grievance Officer{email ? ` at ${email}` : ''}; see <Link to="/grievance-redressal" className="underline">Grievance Redressal</Link>. If you are not satisfied, you may complain to the Data Protection Board of India.</p>
      </Section>

      <Section n="8" title="Children">
        <p>The Website is for businesses and is not meant for anyone under 18. We do not knowingly collect data from children.</p>
      </Section>

      <Section n="9" title="Changes and contact">
        <p>We may update this policy and will show the new date above. Questions about privacy can be sent to {email || 'our support team'}. Please also read our <Link to="/terms-and-conditions" className="underline">Terms & Conditions</Link>.</p>
      </Section>
    </LegalPage>
  );
}
