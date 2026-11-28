import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, Shuffle, Copy, Check } from 'lucide-react';
import WhatsAppIcon from '../../../components/WhatsAppIcon';
import { adminUserApi } from '../../../utils/api';
import { buildWhatsAppUrl } from '../../../utils/whatsapp';

const MIN = 8;

/** 10 characters without look-alikes (no 0/O, 1/l/I), so it can be read out over the phone. */
const randomPassword = () => {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(values, (v) => letters[v % letters.length]).join('');
};

/**
 * Customer profile: the admin can set or reset any customer's password, then send it to them
 * on WhatsApp or by email.
 */
export default function CustomerPasswordPanel({ customer, emailAvailable, startOpen = false, onSaved }) {
  const customerId = customer._id || customer.id;
  const [open, setOpen] = useState(startOpen);
  const [password, setPassword] = useState('');
  const [emailIt, setEmailIt] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null); // { password, emailed, emailError }
  const [copied, setCopied] = useState(false);
  const box = useRef(null);
  const canEmail = Boolean(emailAvailable && customer.email);

  useEffect(() => {
    if (startOpen) box.current?.scrollIntoView({ block: 'center' });
  }, [startOpen]);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < MIN) {
      setError(`Password must be at least ${MIN} characters.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await adminUserApi.setPassword(customerId, password, canEmail && emailIt);
      setSaved({ password, emailed: Boolean(res?.data?.emailed), emailError: res?.data?.emailError || '' });
      setPassword('');
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Could not set the password.');
    } finally {
      setSaving(false);
    }
  };

  const message = saved
    ? `Hello ${customer.name || ''}, your new Supplierfy password is: ${saved.password}\nLog in with your mobile number ${customer.phone} at ${window.location.origin}/login\nYou can change it later under My Account > Profile.`
    : '';
  const whatsappUrl = saved ? buildWhatsAppUrl(customer.phone, message) : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(saved.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Could not copy. Please select the password and copy it.');
    }
  };

  return (
    <div ref={box} className={`p-4 rounded-xl border space-y-3 text-xs sm:text-sm ${customer.passwordRequestedAt ? 'border-amber-300 bg-amber-50' : 'border-stone-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-[color:var(--brand-primary)] flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" /> Login Password
          </h4>
          <p className="text-stone-600 text-xs mt-0.5">
            {customer.passwordRequestedAt
              ? `This customer asked for a new password on ${new Date(customer.passwordRequestedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}.`
              : customer.hasPassword
                ? 'The customer has set a password.'
                : 'No password yet. The customer cannot log in until one is set.'}
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => { setOpen(true); setSaved(null); setError(''); }}
            className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white font-bold text-[color:var(--brand-primary)] hover:bg-stone-100"
          >
            {customer.hasPassword ? 'Reset password' : 'Set password'}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-2" noValidate>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              autoComplete="off"
              autoFocus={startOpen}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`New password (at least ${MIN} characters)`}
              aria-label="New password for this customer"
              className="flex-1 px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[color:var(--brand-primary)]"
            />
            <button
              type="button"
              onClick={() => { setPassword(randomPassword()); setError(''); }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white font-bold text-stone-700"
            >
              <Shuffle className="w-3.5 h-3.5" /> Generate
            </button>
          </div>
          {canEmail && (
            <label className="flex items-center gap-2 text-stone-700">
              <input type="checkbox" checked={emailIt} onChange={(e) => setEmailIt(e.target.checked)} className="w-4 h-4 accent-[color:var(--brand-primary)]" />
              <span className="break-all">Also email it to {customer.email}</span>
            </label>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[color:var(--brand-primary)] text-white font-bold disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setPassword(''); setError(''); }}
              className="px-4 py-2 rounded-lg border border-stone-200 bg-white font-bold text-stone-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}

      {saved && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-emerald-900 break-words">
            Password set to &quot;{saved.password}&quot;. Send it to the customer now; it will not be shown again.
          </p>
          {saved.emailed && <p className="text-xs text-emerald-900 break-all">Emailed to {customer.email}.</p>}
          {saved.emailError && <p className="text-xs font-semibold text-rose-700">{saved.emailError}</p>}
          <div className="flex flex-wrap gap-2">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] text-white font-bold">
                <WhatsAppIcon className="w-4 h-4" /> Send on WhatsApp
              </a>
            )}
            <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white font-bold text-stone-700">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
