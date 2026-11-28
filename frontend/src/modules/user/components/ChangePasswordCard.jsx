import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import PasswordInput, { PASSWORD_MIN } from './PasswordInput';

const FIELD =
  'w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-white text-[color:var(--brand-primary)] focus:outline-none focus:border-[color:var(--brand-primary)]';
const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Account > Profile: lets the customer change their login password. */
export default function ChangePasswordCard() {
  const { changePassword } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ ok: false, text: '' });

  const set = (key) => (value) => {
    setMessage({ ok: false, text: '' });
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) return setMessage({ ok: false, text: 'Please enter your current password.' });
    if (form.newPassword.length < PASSWORD_MIN) {
      return setMessage({ ok: false, text: `New password must be at least ${PASSWORD_MIN} characters.` });
    }
    if (form.newPassword !== form.confirmPassword) return setMessage({ ok: false, text: 'Passwords do not match.' });
    setSaving(true);
    const res = await changePassword(form);
    setSaving(false);
    if (res.success) {
      setForm(EMPTY);
      setMessage({ ok: true, text: 'Password changed.' });
    } else {
      setMessage({ ok: false, text: res.message });
    }
    return undefined;
  };

  const field = (key, label, autoComplete) => (
    <div>
      <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor={key}>{label}</label>
      <PasswordInput id={key} name={key} autoComplete={autoComplete} value={form[key]} onChange={set(key)} className={FIELD} />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md pt-5 mt-5 border-t border-stone-200" noValidate>
      <h3 className="text-sm font-bold text-[color:var(--brand-primary)]">Change Password</h3>
      {message.text && (
        <p
          role="alert"
          className={`text-xs font-medium rounded-xl border px-3 py-2 ${
            message.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </p>
      )}
      {field('currentPassword', 'Current Password', 'current-password')}
      {field('newPassword', 'New Password', 'new-password')}
      {field('confirmPassword', 'Confirm New Password', 'new-password')}
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] font-bold text-xs uppercase tracking-wider hover:bg-[color:var(--brand-primary-light)] transition-colors shadow-sm min-h-[44px] disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Change Password'}
      </button>
    </form>
  );
}
