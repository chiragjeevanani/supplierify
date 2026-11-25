import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { adminUserApi } from '../../../utils/api';

const MIN = 8;

/** Customer profile: set a new login password (forgotten password, or an older account without one). */
export default function CustomerPasswordPanel({ customerId, hasPassword, onSaved }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ ok: false, text: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < MIN) {
      setMessage({ ok: false, text: `Password must be at least ${MIN} characters.` });
      return;
    }
    setSaving(true);
    setMessage({ ok: false, text: '' });
    try {
      await adminUserApi.setPassword(customerId, password);
      setMessage({ ok: true, text: `Password set to "${password}". Share it with the customer now; it will not be shown again.` });
      setPassword('');
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setMessage({ ok: false, text: err?.message || 'Could not set the password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-stone-200 space-y-3 text-xs sm:text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-[color:var(--brand-primary)] flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" /> Login Password
          </h4>
          <p className="text-stone-500 text-xs mt-0.5">
            {hasPassword ? 'The customer has set a password.' : 'No password yet. The customer cannot log in until one is set.'}
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => { setOpen(true); setMessage({ ok: false, text: '' }); }}
            className="px-3.5 py-1.5 rounded-lg border border-stone-200 font-bold text-[color:var(--brand-primary)] hover:bg-stone-100"
          >
            {hasPassword ? 'Reset password' : 'Set password'}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2" noValidate>
          <input
            type="text"
            autoComplete="off"
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`New password (at least ${MIN} characters)`}
            aria-label="New password for this customer"
            className="flex-1 px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-[color:var(--brand-primary)]"
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[color:var(--brand-primary)] text-white font-bold disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setPassword(''); setMessage({ ok: false, text: '' }); }}
            className="px-4 py-2 rounded-lg border border-stone-200 font-bold text-stone-600"
          >
            Cancel
          </button>
        </form>
      )}

      {message.text && (
        <p role="alert" className={`text-xs font-semibold break-words ${message.ok ? 'text-emerald-800' : 'text-rose-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
