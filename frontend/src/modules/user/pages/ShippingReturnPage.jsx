import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { Section, List } from '../components/LegalPage';
import { useStoreRules } from '../../../hooks/useStoreRules';

export default function ShippingReturnPage() {
  const r = useStoreRules();
  const email = r.supportEmail || r.storeEmail;
  return (
    <LegalPage title="Shipping, Return & Refund Policy">
      <p>
        This policy applies to all orders placed on {r.storeName || 'Supplierfy'}.in, owned and operated by <strong>{r.companyName}</strong>.
        It forms part of our <Link to="/terms-and-conditions" className="underline">Terms & Conditions</Link>.
      </p>

      <Section n="1" title="Dispatch and delivery">
        <List items={[
          'Orders are packed after payment (or the advance, or credit approval) is confirmed. We normally hand the parcel to the courier within 1 to 3 business days of the order being accepted.',
          'We ship through an integrated logistics platform that books the courier for your pincode. The courier name and tracking (AWB) number appear on your order page under “Track Order” once the shipment is booked.',
          'Transit time depends on your pincode and the courier; it is usually 2 to 7 days after dispatch. Delivery dates shown are estimates.',
          'Shipping charges, if any, are shown at checkout before you pay. Orders above the free-delivery amount shown at checkout ship free.',
          'Please give a complete address, a correct pincode and a phone number that is reachable on the delivery day. Couriers usually try delivery more than once before returning a parcel.'
        ]} />
      </Section>

      <Section n="2" title="Checking your delivery">
        <p>Please inspect the parcel at the time of delivery. If the outer packing is torn, open or wet, tell the delivery person and record a short video while opening the parcel.</p>
      </Section>

      <Section n="3" title="Damaged, short or wrong items: claim window">
        <List items={[
          'Report any damage, shortage in quantity, or wrong item within 48 hours of delivery.',
          `Write to ${email || 'our support email'} (or use the contact details in the footer) with your order number, clear photos or an unboxing video, and a photo of the courier label.`,
          'We verify the claim, usually within 2 business days, and then replace the item or refund the affected value. Claims made after the window may not be accepted.'
        ]} />
      </Section>

      <Section n="3A" title="Returns">
        <List items={[
          'Because our products are food items sold in bulk, we do not accept returns of opened or used goods, or returns for change of mind.',
          'Goods that are damaged, short, wrong, or not of the quality ordered are handled as in section 3. We may ask you to keep the goods until the claim is closed.',
          'Where a return is approved, we will arrange the pickup; please do not ship goods back on your own.'
        ]} />
      </Section>

      <Section n="4" title="Cancellation and refunds">
        <List items={[
          'You can cancel an order before it is dispatched. After dispatch, the order cannot be cancelled.',
          'Approved refunds are sent to the original payment method (or the bank account you give us for cash on delivery) within 5 to 7 business days of approval. Your bank may take a few more days to show it.',
          'For part-payment orders, the advance you paid is refunded on cancellation before dispatch; the balance is collected only on delivery, so nothing further is due.',
          'If we cancel an order (for example, no stock), you receive a full refund.'
        ]} />
      </Section>

      <Section n="5" title="Undelivered and returned parcels">
        <p>If a parcel comes back to us because of a wrong or incomplete address, an unreachable phone number or refusal at the door, we will contact you. The value of the goods is refunded after the parcel is received back and checked, less the shipping charges incurred, unless the failure was our fault.</p>
      </Section>

      <Section n="6" title="Contact">
        <p>For anything about shipping or refunds, contact us{email ? ` at ${email}` : ''}{r.supportPhone ? ` or ${r.supportPhone}` : ''}. Unresolved complaints can be raised under <Link to="/grievance-redressal" className="underline">Grievance Redressal</Link>.</p>
      </Section>
    </LegalPage>
  );
}
