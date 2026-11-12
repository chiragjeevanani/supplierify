import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Lock, CheckCircle2, AlertTriangle, Clock, ShieldOff, ShoppingBag } from 'lucide-react';

import WhatsAppIcon from '../../../components/WhatsAppIcon';
import { creditApi } from '../../../utils/api';
import { useStoreRules } from '../../../hooks/useStoreRules';
import { buildWhatsAppUrl, buildCreditPaymentMessage } from '../../../utils/whatsapp';
import { formatDueDate } from '../../../utils/paymentLabel';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

function Stat({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-[color:var(--brand-primary)]',
    good: 'text-emerald-700',
    warn: 'text-amber-700'
  };
  return (
    <div className="bg-white rounded-xl border border-[color:var(--brand-border)] p-4">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${tones[tone]}`}>{value}</p>
    </div>
  );
}

export default function CreditPage() {
  const rules = useStoreRules();
  const [credit, setCredit] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    creditApi
      .getMyCredit()
      .then((res) => { if (alive) setCredit(res?.data?.credit || null); })
      .catch((err) => { if (alive) setError(err?.message || 'Could not load your credit details.'); });
    return () => { alive = false; };
  }, []);

  if (error) {
    return (
      <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-4 text-sm">{error}</div>
      </div>
    );
  }

  if (!credit) {
    return (
      <div className="px-4 sm:px-6 py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-[color:var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const header = (
    <header>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--brand-accent-darker)]">Buy now, pay later</p>
      <h2 className="font-serif text-3xl font-bold text-[color:var(--brand-primary)] mt-1 flex items-center gap-2">
        <Wallet className="w-7 h-7" /> Credit
      </h2>
    </header>
  );

  // Credit switched off by the store
  if (!credit.enabled) {
    return (
      <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
        {header}
        <div className="bg-white rounded-xl border border-[color:var(--brand-border)] p-6 text-stone-600 text-sm">
          Pay on credit is not available right now.
        </div>
      </div>
    );
  }

  if (credit.blocked) {
    return (
      <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
        {header}
        <div className="bg-white rounded-xl border border-[color:var(--brand-border)] p-6 flex items-start gap-3">
          <ShieldOff className="w-6 h-6 text-stone-500 shrink-0" />
          <p className="text-sm text-stone-700">Pay on credit is not available on your account. Please contact us if you think this is a mistake.</p>
        </div>
      </div>
    );
  }

  // Not unlocked yet: show progress towards the admin's amount
  if (!credit.eligible) {
    const pct = credit.eligibilityAmount > 0
      ? Math.min(100, Math.round((credit.totalPaidSpend / credit.eligibilityAmount) * 100))
      : 0;
    return (
      <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
        {header}
        <section className="bg-white rounded-xl border border-[color:var(--brand-border)] p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-lg text-[color:var(--brand-primary)]">Credit is locked</h3>
              <p className="text-sm text-stone-600 mt-1">
                Pay on credit unlocks once your paid orders reach <strong>{inr(credit.eligibilityAmount)}</strong> in total.
                {credit.limit > 0 && <> You will then be able to buy up to <strong>{inr(credit.limit)}</strong> on credit.</>}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-stone-700">{inr(credit.totalPaidSpend)} ordered</span>
              <span className="text-stone-500">{inr(credit.eligibilityAmount)}</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-stone-200 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-[color:var(--brand-primary)] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-sm text-stone-600 mt-2">
              <strong className="text-[color:var(--brand-primary)]">{inr(credit.remainingToUnlock)}</strong> more to unlock credit.
            </p>
          </div>

          <p className="text-xs text-stone-500">Only paid orders count. Cancelled orders are not included.</p>
          <Link to="/shop" className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--brand-primary)] text-white font-bold px-5 py-3 text-sm hover:bg-[color:var(--brand-primary-hover)]">
            <ShoppingBag className="w-4 h-4" /> Browse products
          </Link>
        </section>
      </div>
    );
  }

  // Eligible
  const usedPct = credit.limit > 0 ? Math.min(100, Math.round((credit.used / credit.limit) * 100)) : 0;
  const waUrl = credit.openOrders.length
    ? buildWhatsAppUrl(rules.whatsappNumber, buildCreditPaymentMessage({ orders: credit.openOrders, greeting: rules.whatsappGreeting }))
    : '';

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
      {header}

      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <CheckCircle2 className="w-5 h-5 shrink-0" /> You can pay on credit at checkout. Pay within {credit.dueDays} days of each order.
      </div>

      {credit.overdueCount > 0 && (
        <div className="flex items-start gap-2 text-sm font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3" role="alert">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          You have {credit.overdueCount} overdue credit {credit.overdueCount === 1 ? 'payment' : 'payments'}. New credit orders are paused until {credit.overdueCount === 1 ? 'it is' : 'they are'} paid.
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Credit limit" value={inr(credit.limit)} />
        <Stat label="Used" value={inr(credit.used)} tone={credit.used > 0 ? 'warn' : 'default'} />
        <Stat label="Available" value={inr(credit.available)} tone="good" />
      </section>

      <div>
        <div className="h-3 rounded-full bg-stone-200 overflow-hidden">
          <div className={`h-full rounded-full ${usedPct >= 90 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${usedPct}%` }} />
        </div>
        <p className="text-xs text-stone-500 mt-1.5">{usedPct}% of your credit limit is in use.</p>
      </div>

      <section className="bg-white rounded-xl border border-[color:var(--brand-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[color:var(--brand-border)] flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-[color:var(--brand-primary)]">Unpaid credit orders</h3>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1fb857] text-white font-bold text-sm px-4 py-2"
            >
              <WhatsAppIcon className="w-4 h-4" /> Pay via WhatsApp
            </a>
          )}
        </div>
        {credit.openOrders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone-500">Nothing to pay. All your credit is available.</p>
        ) : (
          <ul className="divide-y divide-[color:var(--brand-border)]">
            {credit.openOrders.map((o) => (
              <li key={o.id} className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link to={`/order-tracking/${o.orderNumber}`} className="font-bold text-[color:var(--brand-primary)] hover:underline">
                  #{o.orderNumber}
                </Link>
                <span className="font-extrabold text-stone-900">{inr(o.amount)}</span>
                <span className={`ml-auto inline-flex items-center gap-1.5 text-sm font-semibold ${o.overdue ? 'text-rose-700' : 'text-stone-600'}`}>
                  {o.overdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  {o.overdue ? 'Overdue since' : 'Due'} {formatDueDate(o.dueDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl border border-[color:var(--brand-border)] p-5">
        <h3 className="font-bold text-[color:var(--brand-primary)] mb-2">How credit works</h3>
        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-stone-700">
          <li>At checkout, choose <strong>Pay on credit</strong>. The order total must fit within your available credit.</li>
          <li>We pack and ship your order as usual.</li>
          <li>Pay within {credit.dueDays} days. Once we receive your payment, that amount becomes available again.</li>
        </ol>
      </section>
    </div>
  );
}
