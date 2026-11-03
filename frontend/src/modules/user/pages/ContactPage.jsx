import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Leaf, Clock, LifeBuoy, ChevronRight } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { resolveHelpSupport } from '../../../utils/helpSupport';

const INSTAGRAM_URL = 'https://www.instagram.com/your-domain.example';
const INSTAGRAM_HANDLE = '@your-domain.example';

export default function ContactPage() {
  const { settings } = useAdmin();
  const help = resolveHelpSupport(settings);
  const officeAddress =
    settings?.storeAddress ||
    settings?.hubAddress ||
    'Warehouse Address, Mumbai, Maharashtra - 400001';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--brand-surface)] font-sans text-[color:var(--brand-text)]">

      <main className="pb-28 md:pb-14">
        <div className="bg-[color:var(--brand-primary)] text-[color:var(--brand-bg)] py-8 sm:py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-6 left-8 w-40 h-40 bg-[color:var(--brand-accent)] rounded-full blur-[80px]" />
            <div className="absolute bottom-4 right-8 w-40 h-40 bg-[color:var(--brand-primary-light)] rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto px-4">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-[color:var(--brand-accent)]" />
              <span className="text-[color:var(--brand-accent)] font-bold tracking-[0.18em] uppercase text-[length:calc(10px*var(--fs))] sm:text-xs">
                Get in Touch
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-2">Contact Us</h1>
            <p className="text-xs sm:text-sm text-[#A2B5A8] leading-relaxed">
              {help.subtitle}
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 sm:-mt-5 relative z-20 space-y-3">
          <div className="bg-white rounded-2xl border border-[color:var(--brand-border)] shadow-sm p-4 sm:p-5">
            <h2 className="font-serif text-lg font-bold text-[color:var(--brand-primary)] mb-3">Contact Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={`tel:${help.phoneTel}`}
                className="flex items-start gap-3 p-3 rounded-xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-border)] hover:border-[color:var(--brand-primary)]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-wider text-stone-500">Phone</p>
                  <p className="text-sm font-bold text-[color:var(--brand-primary)] truncate">{help.phone}</p>
                  <p className="text-[length:calc(10px*var(--fs))] text-stone-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {help.phoneHours}
                  </p>
                </div>
              </a>

              <a
                href={`mailto:${help.email}`}
                className="flex items-start gap-3 p-3 rounded-xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-border)] hover:border-[color:var(--brand-primary)]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-wider text-stone-500">Email</p>
                  <p className="text-sm font-bold text-[color:var(--brand-primary)] break-all">{help.email}</p>
                  <p className="text-[length:calc(10px*var(--fs))] text-stone-500 mt-0.5">{help.emailNote}</p>
                </div>
              </a>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-border)] hover:border-[color:var(--brand-primary)]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-wider text-stone-500">Instagram</p>
                  <p className="text-sm font-bold text-[color:var(--brand-primary)]">{INSTAGRAM_HANDLE}</p>
                  <p className="text-[length:calc(10px*var(--fs))] text-stone-500 mt-0.5">Recipes, tips & offers</p>
                </div>
              </a>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-border)]">
                <div className="w-9 h-9 rounded-full bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-wider text-stone-500">Office</p>
                  <p className="text-sm font-bold text-[color:var(--brand-primary)] leading-snug">{officeAddress}</p>
                </div>
              </div>
            </div>
          </div>

          <Link
            to={help.fullHelpLink.startsWith('/') ? help.fullHelpLink : '/help-support'}
            className="flex items-center justify-between gap-3 w-full p-3.5 sm:p-4 rounded-2xl bg-white border border-[color:var(--brand-border)] shadow-sm hover:border-[color:var(--brand-primary)]/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] flex items-center justify-center shrink-0">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold text-[color:var(--brand-primary)]">Help & Support</p>
                <p className="text-[length:calc(10px*var(--fs))] text-stone-500 mt-0.5">Order help, FAQs & more</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[color:var(--brand-accent-dark)] shrink-0" />
          </Link>
        </div>
      </main>

    </div>
  );
}
