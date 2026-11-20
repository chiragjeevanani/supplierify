import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { Section, List } from '../components/LegalPage';
import { useStoreRules } from '../../../hooks/useStoreRules';

export default function TermsPage() {
  const r = useStoreRules();
  const brand = r.storeName || 'Supplierfy';
  return (
    <LegalPage title="Terms & Conditions (B2B)">
      <p>
        These terms govern every purchase made on {brand}.in (the “Website”). The Website is owned and operated by{' '}
        <strong>{r.companyName}</strong> (“we”, “us”), registered at {r.companyAddress}
        {r.companyGstin ? `, GSTIN ${r.companyGstin}` : ''}. By placing an order you (“Buyer”) agree to these terms,
        our <Link to="/privacy-policy" className="underline">Privacy Policy</Link> and our{' '}
        <Link to="/shipping-and-return-policy" className="underline">Shipping, Return & Refund Policy</Link>.
      </p>

      <Section n="1" title="Who can buy">
        <p>The Website sells to businesses and trade buyers in bulk (wholesale). You confirm that you are buying for business or resale purposes and that the details you give us (name, phone, address, and GSTIN if provided) are true and complete.</p>
      </Section>

      <Section n="2" title="Orders, minimum quantities and acceptance">
        <List items={[
          'Each product shows its unit (kg, piece, pair, set or metre) and its minimum order quantity. Orders below the minimum cannot be placed.',
          'An order is confirmed only when payment (or the agreed advance) is received, or when a credit order is accepted by us. We may decline or cancel an order if stock is not available, a price was listed in error, or the delivery pincode is not serviceable. In that case any amount you paid is refunded in full.',
          'Prices, stock and delivery charges can change without notice. The price shown at checkout when you place the order applies to that order.'
        ]} />
      </Section>

      <Section n="3" title="Prices, GST and invoices">
        <p>Prices are in Indian Rupees. GST is added as shown at checkout and a GST tax invoice is issued for every order in the name of {r.companyName}. To claim input tax credit, enter your GSTIN at checkout before placing the order; the GSTIN cannot be added to an invoice that has already been issued.</p>
      </Section>

      <Section n="4" title="Payment">
        <List items={[
          'Online payment: UPI, cards and net banking are processed by our payment gateway partner. We do not see or store your card or UPI PIN details.',
          `Part payment: where offered at checkout, you pay a percentage of the order online as an advance${r.partialCodEnabled ? ` (currently ${r.partialCodPercent}%)` : ''}, and the balance is collected by the courier on delivery. The order is shipped after the advance is received.`,
          'Pay on credit: available only to buyers we have approved. The due date is shown on the order. Overdue credit may lead to suspension of credit and of further orders until cleared.',
          'If a payment is debited but no order is created, write to us with the payment reference and we will resolve it or refund you.'
        ]} />
      </Section>

      <Section n="5" title="Delivery">
        <p>Orders are dispatched through our logistics partners as described in the <Link to="/shipping-and-return-policy" className="underline">Shipping, Return & Refund Policy</Link>. Delivery dates are estimates, not guarantees. Risk in the goods passes to the Buyer on delivery.</p>
      </Section>

      <Section n="6" title="Cancellation">
        <List items={[
          'You may cancel an order before it is dispatched, from the order page or by contacting us. A prepaid amount is refunded as per the refund timeline in our policy.',
          'Once an order is dispatched it cannot be cancelled. Refusing a delivery without a valid reason may be treated as a cancellation after dispatch, and return shipping costs may be deducted from the refund.'
        ]} />
      </Section>

      <Section n="7" title="Damaged, short or wrong goods">
        <p>Please check the parcel at delivery. Report any damage, shortage or wrong item within the claim window stated in the Shipping, Return & Refund Policy, with photos or a video, so that we can raise it with the courier and resolve it quickly.</p>
      </Section>

      <Section n="8" title="Food products">
        <p>Food items (such as dry fruits) are natural products. Slight variation in size, colour and weight is normal. Please store them in a cool, dry place and use them within the shelf life shown on the pack. Food items are sold in line with applicable food safety laws; our FSSAI registration details are shown in the website footer when available.</p>
      </Section>

      <Section n="9" title="Your responsibilities">
        <List items={[
          'Keep your login (mobile OTP) and account secure; you are responsible for activity on your account.',
          'Do not misuse the Website, attempt to disrupt it, or place orders with false details.',
          'Resell the goods only in compliance with applicable laws, including food safety and labelling rules.'
        ]} />
      </Section>

      <Section n="10" title="Limitation of liability">
        <p>To the extent permitted by law, our liability for any claim relating to an order is limited to the value of the goods in that order. We are not liable for indirect or consequential loss, or for delays caused by couriers, strikes, weather or other events outside our control.</p>
      </Section>

      <Section n="11" title="Governing law, dispute resolution and jurisdiction">
        <List items={[
          'These terms are governed by the laws of India.',
          'The parties will first try to settle any dispute in good faith by discussion for 30 days after one party notifies the other in writing.',
          'A dispute not settled in that time will be referred to a sole arbitrator appointed by mutual consent under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration is Mumbai and the language is English.',
          'Subject to the above, the courts at Mumbai, Maharashtra have exclusive jurisdiction.'
        ]} />
      </Section>

      <Section n="12" title="Changes and contact">
        <p>We may update these terms; the version on the Website when you place an order applies to it. For questions or complaints, see <Link to="/grievance-redressal" className="underline">Grievance Redressal</Link>{r.supportEmail ? ` or write to ${r.supportEmail}` : ''}.</p>
      </Section>
    </LegalPage>
  );
}
