import React, { useEffect, useState } from 'react';
import { Wallet, Loader2, Check } from 'lucide-react';
import { adminUserApi } from '../../../utils/api';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/**
 * Admin > Customers > profile: this customer's pay-on-credit status, with a custom limit and a block switch.
 * `onSaved(creditOverview)` lets the list row refresh its credit badge.
 */
export default function CustomerCreditPanel({ customerId, onSaved }) {
  const [credit, setCredit] = useState(null);
  const [error, setError] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [customLimit, setCustomLimit] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hydrate = (c) => {
    setCredit(c);
    setUseCustom(Boolean(c?.limitIsCustom));
    setCustomLimit(c?.limitIsCustom ? String(c.limit) : '');
    setBlocked(Boolean(c?.blocked));
  };

  useEffect(() => {
    let alive = true;
    setCredit(null);
    setError('');
    adminUserApi
      .getCredit(customerId)
      .then((res) => { if (alive) hydrate(res?.data?.credit || null); })
      .catch((err) => { if (alive) setError(err?.message || 'Could not load credit details.'); });
    return () => { alive = false; };
  }, [customerId]);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const limitValue = useCustom ? Math.max(0, Number(customLimit) || 0) : null;
      const res = await adminUserApi.updateCredit(customerId, { creditLimitOverride: limitValue, creditBlocked: blocked });
      const c = res?.data?.credit;
      if (c) {
        hydrate(c);
        onSaved?.({
          eligible: c.eligible, blocked: c.blocked, totalPaidSpend: c.totalPaidSpend,
          limit: c.limit, limitIsCustom: c.limitIsCustom, used: c.used, available: c.available
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-sans text-sm sm:text-base font-bold text-[color:var(--brand-primary)] flex items-center gap-2">
        <Wallet className="w-4 h-4" /> Pay on credit
      </h4>

      {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}

      {!credit && !error ? (
        <p className="text-xs text-stone-400 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading credit…</p>
      ) : credit ? (
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 space-y-3 text-xs sm:text-sm">
          {!credit.enabled && (
            <p className="text-amber-800 font-semibold">Pay on credit is switched off for the store (Settings).</p>
          )}
          <p className="font-semibold">
            {credit.blocked ? (
              <span className="text-rose-700">Blocked for this customer</span>
            ) : credit.eligible ? (
              <span className="text-emerald-700">Eligible</span>
            ) : (
              <span className="text-stone-600">
                Not eligible yet: {inr(credit.totalPaidSpend)} of {inr(credit.eligibilityAmount)} paid orders ({inr(credit.remainingToUnlock)} to go)
              </span>
            )}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div><span className="block text-[length:calc(11px*var(--fs))] font-bold uppercase text-stone-500">Limit</span><strong>{inr(credit.limit)}</strong></div>
            <div><span className="block text-[length:calc(11px*var(--fs))] font-bold uppercase text-stone-500">Owes</span><strong className={credit.used > 0 ? 'text-amber-700' : ''}>{inr(credit.used)}</strong></div>
            <div><span className="block text-[length:calc(11px*var(--fs))] font-bold uppercase text-stone-500">Available</span><strong className="text-emerald-700">{inr(credit.available)}</strong></div>
          </div>

          {credit.overdueCount > 0 && (
            <p className="text-rose-700 font-semibold">{credit.overdueCount} overdue credit {credit.overdueCount === 1 ? 'order' : 'orders'}.</p>
          )}

          <div className="pt-2 border-t border-sky-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} className="w-4 h-4 accent-[color:var(--brand-primary)]" />
              <span className="font-semibold text-stone-800">Give this customer their own credit limit</span>
            </label>
            {useCustom && (
              <input
                type="number"
                min={0}
                step={1000}
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                placeholder="e.g. 100000"
                aria-label="Custom credit limit in rupees"
                className="w-40 px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[color:var(--brand-primary)]"
              />
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} className="w-4 h-4 accent-rose-600" />
              <span className="font-semibold text-stone-800">Block pay on credit for this customer</span>
            </label>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[color:var(--brand-primary)] text-white text-xs font-bold disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
              {saved ? 'Saved' : 'Save credit settings'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
