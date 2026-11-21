/**
 * Standard text of the legal pages. Written in a simple format the admin can also edit
 * (Admin > Legal Pages):  "## Heading", "- bullet", **bold**, [text](/page), blank line = new paragraph.
 * {{tokens}} are filled from Settings, e.g. {{company}}, {{address}}, {{gstin}}, {{email}}, {{phone}}.
 */

export const LEGAL_PAGES = [
  { key: 'terms', title: 'Terms & Conditions (B2B)', path: '/terms-and-conditions' },
  { key: 'privacy', title: 'Privacy Policy', path: '/privacy-policy' },
  { key: 'shipping', title: 'Shipping, Return & Refund Policy', path: '/shipping-and-return-policy' }
];

export const TOKEN_HELP = [
  ['{{brand}}', 'Store name'],
  ['{{company}}', 'Company name'],
  ['{{address}}', 'Company address'],
  ['{{gstin}}', 'Company GSTIN'],
  ['{{email}}', 'Support / grievance email'],
  ['{{phone}}', 'Support phone']
];

/** Values for the {{tokens}} from the public settings. */
export function legalVars(r = {}) {
  const email = r.grievanceEmail || r.supportEmail || r.storeEmail || '';
  const supportEmail = r.supportEmail || r.storeEmail || '';
  return {
    brand: r.storeName || 'Supplierfy',
    company: r.companyName || '',
    address: r.companyAddress || '',
    gstin: r.companyGstin || '',
    gstinPart: r.companyGstin ? `, GSTIN ${r.companyGstin}` : '',
    email,
    emailAt: email ? ` at ${email}` : '',
    emailOrTeam: email || 'our support team',
    supportEmailAt: supportEmail ? ` at ${supportEmail}` : '',
    supportEmailOr: supportEmail || 'our support email',
    supportEmailWrite: supportEmail ? ` or write to ${supportEmail}` : '',
    phone: r.supportPhone || '',
    phoneOr: r.supportPhone ? ` or ${r.supportPhone}` : '',
    partialNote: r.partialCodEnabled ? ` (currently ${r.partialCodPercent}%)` : ''
  };
}

export const fillTokens = (text, vars) => String(text || '').replace(/\{\{(\w+)\}\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));

const TERMS = `These terms govern every purchase made on {{brand}}.in (the “Website”). The Website is owned and operated by **{{company}}** (“we”, “us”), registered at {{address}}{{gstinPart}}. By placing an order you (“Buyer”) agree to these terms, our [Privacy Policy](/privacy-policy) and our [Shipping, Return & Refund Policy](/shipping-and-return-policy).

## 1. Who can buy
The Website sells to businesses and trade buyers in bulk (wholesale). You confirm that you are buying for business or resale purposes and that the details you give us (name, phone, address, and GSTIN if provided) are true and complete.

## 2. Orders, minimum quantities and acceptance
- Each product shows its unit (kg, piece, pair, set or metre) and its minimum order quantity. Orders below the minimum cannot be placed.
- An order is confirmed only when payment (or the agreed advance) is received, or when a credit order is accepted by us. We may decline or cancel an order if stock is not available, a price was listed in error, or the delivery pincode is not serviceable. In that case any amount you paid is refunded in full.
- Prices, stock and delivery charges can change without notice. The price shown at checkout when you place the order applies to that order.

## 3. Prices, GST and invoices
Prices are in Indian Rupees. GST is added as shown at checkout and a GST tax invoice is issued for every order in the name of {{company}}. To claim input tax credit, enter your GSTIN at checkout before placing the order; the GSTIN cannot be added to an invoice that has already been issued.

## 4. Payment
- Online payment: UPI, cards and net banking are processed by our payment gateway partner. We do not see or store your card or UPI PIN details.
- Part payment: where offered at checkout, you pay a percentage of the order online as an advance{{partialNote}}, and the balance is collected by the courier on delivery. The order is shipped after the advance is received.
- Pay on credit: available only to buyers we have approved. The due date is shown on the order. Overdue credit may lead to suspension of credit and of further orders until cleared.
- If a payment is debited but no order is created, write to us with the payment reference and we will resolve it or refund you.

## 5. Delivery
Orders are dispatched through our logistics partners as described in the [Shipping, Return & Refund Policy](/shipping-and-return-policy). Delivery dates are estimates, not guarantees. Risk in the goods passes to the Buyer on delivery.

## 6. Cancellation
- You may cancel an order before it is dispatched, from the order page or by contacting us. A prepaid amount is refunded as per the refund timeline in our policy.
- Once an order is dispatched it cannot be cancelled. Refusing a delivery without a valid reason may be treated as a cancellation after dispatch, and return shipping costs may be deducted from the refund.

## 7. Damaged, short or wrong goods
Please check the parcel at delivery. Report any damage, shortage or wrong item within the claim window stated in the Shipping, Return & Refund Policy, with photos or a video, so that we can raise it with the courier and resolve it quickly.

## 8. Food products
Food items (such as dry fruits) are natural products. Slight variation in size, colour and weight is normal. Please store them in a cool, dry place and use them within the shelf life shown on the pack. Food items are sold in line with applicable food safety laws; our FSSAI registration details are shown in the website footer when available.

## 9. Your responsibilities
- Keep your login (mobile OTP) and account secure; you are responsible for activity on your account.
- Do not misuse the Website, attempt to disrupt it, or place orders with false details.
- Resell the goods only in compliance with applicable laws, including food safety and labelling rules.

## 10. Limitation of liability
To the extent permitted by law, our liability for any claim relating to an order is limited to the value of the goods in that order. We are not liable for indirect or consequential loss, or for delays caused by couriers, strikes, weather or other events outside our control.

## 11. Governing law, dispute resolution and jurisdiction
- These terms are governed by the laws of India.
- The parties will first try to settle any dispute in good faith by discussion for 30 days after one party notifies the other in writing.
- A dispute not settled in that time will be referred to a sole arbitrator appointed by mutual consent under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration is Mumbai and the language is English.
- Subject to the above, the courts at Mumbai, Maharashtra have exclusive jurisdiction.

## 12. Changes and contact
We may update these terms; the version on the Website when you place an order applies to it. For questions or complaints, see [Grievance Redressal](/grievance-redressal){{supportEmailWrite}}.`;

const PRIVACY = `{{brand}}.in is owned and operated by **{{company}}** (“we”, “us”), {{address}}. This policy explains what personal data we collect from buyers and suppliers who use the Website, why, and the choices you have. It is written to meet the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000. By using the Website you agree to this policy.

## 1. What we collect
- Account details: name, mobile number (used for OTP login), email address, and the delivery addresses you save.
- Business details you choose to give: company name and GSTIN, used on your tax invoice.
- Order details: products, quantities, order value, payment method and status, delivery and tracking information.
- Technical data: device and browser type, approximate IP address and pages visited, used for security and to keep the Website working. Your cart and login are kept in your browser storage.
- Messages you send us by email, WhatsApp, phone or the contact form.

## 2. Why we use it
- To create your account, verify you by OTP, take and deliver your orders and send order updates.
- To issue GST invoices and keep the records the law requires.
- To take payments, handle refunds and prevent fraud.
- To answer your queries and complaints, and to improve the Website.
- To send service messages. We send promotional messages only with your consent, and you can opt out at any time.

We process your data on the basis of your consent and, where the law allows, to fulfil your order and meet legal obligations.

## 3. Who we share it with
We do not sell your personal data. We share only what is needed with service providers who help us run the store:
- Payment gateway (Razorpay) to process online payments. Card, UPI and bank details are entered on the gateway’s secure page; we do not store them.
- Logistics partners (our integrated courier platform and the couriers) to pick up and deliver your order: your name, address and phone number.
- SMS / OTP, email and hosting providers.
- Government or legal authorities when the law requires it.

These providers may use your data only to provide their service to us and must protect it.

## 4. Buyer and supplier data
Business information such as company name, GSTIN, addresses and order history is treated as confidential. It is used only for the purposes above and is not shown to other buyers.

## 5. How long we keep it
We keep your data while your account is active and as long as needed for the purposes above. Invoices and accounting records are kept for the period required by tax and company law, even after you close your account.

## 6. Security
We use encrypted connections (HTTPS), access controls and secure hosting. No system is completely secure; if a data breach affecting you occurs, we will inform you and the authorities as the law requires.

## 7. Your rights
Under the DPDP Act you can ask us to give you a summary of the data we hold, correct or complete it, erase it (subject to legal record-keeping), withdraw your consent, and have your grievance addressed. Write to our Grievance Officer{{emailAt}}; see [Grievance Redressal](/grievance-redressal). If you are not satisfied, you may complain to the Data Protection Board of India.

## 8. Children
The Website is for businesses and is not meant for anyone under 18. We do not knowingly collect data from children.

## 9. Changes and contact
We may update this policy and will show the new date above. Questions about privacy can be sent to {{emailOrTeam}}. Please also read our [Terms & Conditions](/terms-and-conditions).`;

const SHIPPING = `This policy applies to all orders placed on {{brand}}.in, owned and operated by **{{company}}**. It forms part of our [Terms & Conditions](/terms-and-conditions).

## 1. Dispatch and delivery
- Orders are packed after payment (or the advance, or credit approval) is confirmed. We normally hand the parcel to the courier within 1 to 3 business days of the order being accepted.
- We ship through an integrated logistics platform that books the courier for your pincode. The courier name and tracking (AWB) number appear on your order page under “Track Order” once the shipment is booked.
- Transit time depends on your pincode and the courier; it is usually 2 to 7 days after dispatch. Delivery dates shown are estimates.
- Shipping charges, if any, are shown at checkout before you pay. Orders above the free-delivery amount shown at checkout ship free.
- Please give a complete address, a correct pincode and a phone number that is reachable on the delivery day. Couriers usually try delivery more than once before returning a parcel.

## 2. Checking your delivery
Please inspect the parcel at the time of delivery. If the outer packing is torn, open or wet, tell the delivery person and record a short video while opening the parcel.

## 3. Damaged, short or wrong items: claim window
- Report any damage, shortage in quantity, or wrong item within 48 hours of delivery.
- Write to {{supportEmailOr}} (or use the contact details in the footer) with your order number, clear photos or an unboxing video, and a photo of the courier label.
- We verify the claim, usually within 2 business days, and then replace the item or refund the affected value. Claims made after the window may not be accepted.

## 3A. Returns
- Because our products are food items sold in bulk, we do not accept returns of opened or used goods, or returns for change of mind.
- Goods that are damaged, short, wrong, or not of the quality ordered are handled as in section 3. We may ask you to keep the goods until the claim is closed.
- Where a return is approved, we will arrange the pickup; please do not ship goods back on your own.

## 4. Cancellation and refunds
- You can cancel an order before it is dispatched. After dispatch, the order cannot be cancelled.
- Approved refunds are sent to the original payment method (or the bank account you give us for cash on delivery) within 5 to 7 business days of approval. Your bank may take a few more days to show it.
- For part-payment orders, the advance you paid is refunded on cancellation before dispatch; the balance is collected only on delivery, so nothing further is due.
- If we cancel an order (for example, no stock), you receive a full refund.

## 5. Undelivered and returned parcels
If a parcel comes back to us because of a wrong or incomplete address, an unreachable phone number or refusal at the door, we will contact you. The value of the goods is refunded after the parcel is received back and checked, less the shipping charges incurred, unless the failure was our fault.

## 6. Contact
For anything about shipping or refunds, contact us{{supportEmailAt}}{{phoneOr}}. Unresolved complaints can be raised under [Grievance Redressal](/grievance-redressal).`;

export const DEFAULT_LEGAL_TEXT = { terms: TERMS, privacy: PRIVACY, shipping: SHIPPING };
