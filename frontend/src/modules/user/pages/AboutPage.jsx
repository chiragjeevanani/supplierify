import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Boxes, MessageCircle, ShieldCheck, Truck } from 'lucide-react';

import { BRAND } from '../../../config/brand';
import { useStoreRules } from '../../../hooks/useStoreRules';
import { buildGeneralEnquiry, buildWhatsAppUrl } from '../../../utils/whatsapp';

export default function AboutPage() {
  const rules = useStoreRules();
  const waUrl = buildWhatsAppUrl(rules.whatsappNumber, buildGeneralEnquiry({ storeName: rules.storeName }));

  const points = [
    { icon: BadgeCheck, title: 'Quality graded stock', text: 'Every lot is sorted and graded before it is packed, so what you order is what you receive.' },
    { icon: Boxes, title: 'Bulk, by the kilo', text: `Wholesale rates per kg with a minimum order of ${rules.minOrderQtyKg} kg per product.` },
    { icon: Truck, title: 'Packed and shipped', text: 'Sealed bulk packing, shipped across India with tracking.' },
    { icon: ShieldCheck, title: 'Simple, safe payment', text: 'Pay securely online with Razorpay, or settle terms with us directly on WhatsApp.' }
  ];

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--brand-accent-darker)]">About us</p>
        <h2 className="font-serif text-3xl font-bold text-[color:var(--brand-primary)] mt-1">{rules.storeName || BRAND.name}</h2>
        <p className="text-stone-700 mt-3 leading-relaxed">
          {BRAND.description} We supply retailers, caterers, sweet shops, gifting companies and
          other businesses that need dependable quality and consistent supply.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {points.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-white rounded-xl border border-[color:var(--brand-border)] p-5 flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-[color:var(--brand-primary)]">{title}</h3>
              <p className="text-sm text-stone-600 mt-1 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-xl border border-[color:var(--brand-border)] p-6">
        <h3 className="font-serif text-xl font-bold text-[color:var(--brand-primary)] mb-3">How ordering works</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-stone-700 leading-relaxed">
          <li>Browse the catalogue and choose a quantity in kg (minimum {rules.minOrderQtyKg} kg per product).</li>
          <li>Add to cart and pay online through Razorpay, <strong>or</strong> tap the WhatsApp button to send us your selection.</li>
          <li>For WhatsApp enquiries, your product and quantity are already typed in. Just press send and we will confirm the price and delivery.</li>
          <li>We pack and dispatch your order and share the tracking details.</li>
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/shop" className="rounded-lg bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] font-bold px-5 py-3 hover:bg-[color:var(--brand-primary-hover)]">
          Browse products
        </Link>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] text-white font-bold px-5 py-3 hover:bg-[#1fb857]"
        >
          <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
