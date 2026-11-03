import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  LifeBuoy,
  Package,
  Truck,
  RefreshCcw,
  CreditCard,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { resolveHelpSupport } from '../../../utils/helpSupport';

const topics = [
  {
    icon: Package,
    title: 'Orders & packing',
    desc: 'Status, invoices, and item questions',
    href: '#faqs'
  },
  {
    icon: Truck,
    title: 'Shipping',
    desc: 'Pincodes, fees, and delivery timelines',
    href: '#shipping'
  },
  {
    icon: RefreshCcw,
    title: 'Returns & refunds',
    desc: 'Damaged parcels and cancellation help',
    href: '#returns'
  },
  {
    icon: CreditCard,
    title: 'Payments',
    desc: 'Online pay, COD, and failed payments',
    href: '#faqs'
  }
];

export default function HelpSupportPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const { settings } = useAdmin();
  const help = resolveHelpSupport(settings);
  const writeTo = help.writeLink.startsWith('/') ? help.writeLink : '/contact';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const hash = window.location.hash?.replace('#', '');
    if (!hash) return;
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--brand-surface)] font-sans text-[color:var(--brand-text)]">

      <main className="pb-16 sm:pb-24">
        <div className="bg-[color:var(--brand-primary)] text-[color:var(--brand-bg)] py-14 sm:py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-[color:var(--brand-accent)] rounded-full blur-[100px]" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-[color:var(--brand-primary-light)] rounded-full blur-[100px]" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <LifeBuoy className="w-5 h-5 text-[color:var(--brand-accent)]" />
              <span className="text-[color:var(--brand-accent)] font-bold tracking-[0.2em] uppercase text-xs sm:text-sm">
                Customer Care
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-4">{help.title}</h1>
            <p className="text-sm sm:text-base text-[#A2B5A8] max-w-2xl mx-auto leading-relaxed">
              {help.subtitle}
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-20 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {topics.map(({ icon: Icon, title, desc, href }) => (
              <a
                key={title}
                href={href}
                className="bg-white rounded-2xl border border-[color:var(--brand-border)] p-4 sm:p-5 shadow-sm hover:border-[color:var(--brand-accent-dark)]/50 hover:shadow-md transition-all text-left"
              >
                <Icon className="w-5 h-5 text-[color:var(--brand-accent-dark)] mb-3" />
                <h3 className="text-xs sm:text-sm font-bold text-[color:var(--brand-primary)] mb-1">{title}</h3>
                <p className="text-[length:calc(10px*var(--fs))] sm:text-xs text-stone-500 leading-relaxed">{desc}</p>
              </a>
            ))}
          </div>

          {/* Contact strip */}
          <div className="bg-white rounded-3xl border border-[color:var(--brand-border)] shadow-sm p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-[color:var(--brand-bg)] border border-[color:var(--brand-accent)]/30 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-[color:var(--brand-accent-dark)]" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Call us</h3>
                <a href={`tel:${help.phoneTel}`} className="text-sm font-bold text-[color:var(--brand-primary)] hover:text-[color:var(--brand-accent-dark)]">
                  {help.phone}
                </a>
                <p className="text-[length:calc(11px*var(--fs))] text-stone-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {help.phoneHours}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-[color:var(--brand-bg)] border border-[color:var(--brand-accent)]/30 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-[color:var(--brand-accent-dark)]" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Email</h3>
                <a
                  href={`mailto:${help.email}`}
                  className="text-sm font-bold text-[color:var(--brand-primary)] hover:text-[color:var(--brand-accent-dark)] break-all"
                >
                  {help.email}
                </a>
                <p className="text-[length:calc(11px*var(--fs))] text-stone-500 mt-1">{help.emailNote}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-[color:var(--brand-bg)] border border-[color:var(--brand-accent)]/30 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-[color:var(--brand-accent-dark)]" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">{help.writeTitle}</h3>
                <Link
                  to={writeTo}
                  className="inline-flex items-center gap-1 text-sm font-bold text-[color:var(--brand-primary)] hover:text-[color:var(--brand-accent-dark)]"
                >
                  Contact form <ChevronRight className="w-4 h-4" />
                </Link>
                <p className="text-[length:calc(11px*var(--fs))] text-stone-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {help.writeNote}
                </p>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <section id="faqs" className="bg-white rounded-3xl border border-[color:var(--brand-border)] shadow-sm p-6 sm:p-8 scroll-mt-24">
            <div className="flex items-center gap-2 mb-6">
              <Leaf className="w-5 h-5 text-[color:var(--brand-accent-dark)]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[color:var(--brand-primary)]">Frequently asked questions</h2>
            </div>
            <div className="space-y-2">
              {help.faqs.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div
                    key={`${item.q}-${idx}`}
                    className={`rounded-2xl border transition-colors ${
                      open ? 'border-[color:var(--brand-primary)]/30 bg-[color:var(--brand-surface)]' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? -1 : idx)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                      aria-expanded={open}
                    >
                      <span className="text-sm font-bold text-[color:var(--brand-primary)]">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[color:var(--brand-accent-dark)] shrink-0 transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {open && (
                      <p className="px-4 pb-4 text-sm text-[#3A4B41] leading-relaxed border-t border-stone-100/80 pt-3">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <section
              id="shipping"
              className="bg-white rounded-3xl border border-[color:var(--brand-border)] shadow-sm p-6 sm:p-8 scroll-mt-24"
            >
              <Truck className="w-6 h-6 text-[color:var(--brand-accent-dark)] mb-3" />
              <h2 className="font-serif text-xl font-bold text-[color:var(--brand-primary)] mb-3">Shipping & delivery</h2>
              <ul className="space-y-2 text-sm text-[#3A4B41] leading-relaxed list-disc pl-4">
                <li>We ship across serviceable India pincodes via partner couriers.</li>
                <li>Rates at checkout use live logistics estimates for your pin + payment type.</li>
                <li>You receive tracking once the shipment is handed to the courier.</li>
                <li>Please keep your phone reachable for delivery attempts.</li>
              </ul>
            </section>

            <section
              id="returns"
              className="bg-white rounded-3xl border border-[color:var(--brand-border)] shadow-sm p-6 sm:p-8 scroll-mt-24"
            >
              <RefreshCcw className="w-6 h-6 text-[color:var(--brand-accent-dark)] mb-3" />
              <h2 className="font-serif text-xl font-bold text-[color:var(--brand-primary)] mb-3">Returns & refunds</h2>
              <ul className="space-y-2 text-sm text-[#3A4B41] leading-relaxed list-disc pl-4">
                <li>Report damaged or wrong items within 48 hours of delivery with photos.</li>
                <li>Eligible refunds for prepaid orders are processed to the original payment method.</li>
                <li>COD refunds (where approved) are arranged by our support team.</li>
                <li>Opened food packs may not be returnable for hygiene reasons unless damaged on arrival.</li>
              </ul>
            </section>
          </div>

          <div className="rounded-3xl bg-[color:var(--brand-primary)] text-[color:var(--brand-bg)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold mb-1">Still need help?</h3>
              <p className="text-sm text-[#A2B5A8]">
                Share your order number for faster support. Privacy details are on our public policy page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={writeTo}
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[color:var(--brand-accent)] text-[color:var(--brand-primary)] text-xs font-extrabold uppercase tracking-wider"
              >
                Contact us
              </Link>
              <Link
                to="/privacy-policy"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-[color:var(--brand-accent)]/50 text-[color:var(--brand-accent)] text-xs font-extrabold uppercase tracking-wider"
              >
                Privacy policy
              </Link>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
