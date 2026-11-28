import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';
import { userAuthApi } from '../../../utils/api';
import PasswordInput, { PASSWORD_MIN } from '../components/PasswordInput';

const FIELD =
  'w-full px-3.5 py-2.5 text-sm font-semibold text-stone-900 placeholder:text-stone-400 rounded-2xl border border-stone-300 bg-[color:var(--brand-surface)]/50 focus:outline-none focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[color:var(--brand-primary)]/10 transition-all';
const LABEL = 'block text-xs font-bold text-[color:var(--brand-primary)] mb-1.5';
const BUTTON =
  'w-full py-3 bg-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary-light)] text-[color:var(--brand-accent)] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 min-h-[46px]';

/** Opened from the "forgot password" email: set a new password, then go straight into the store. */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword } = useAuth();

  const [link, setLink] = useState({ state: 'checking', message: '', phoneEnding: '' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    userAuthApi
      .verifyResetToken(token)
      .then((res) => { if (alive) setLink({ state: 'ok', message: '', phoneEnding: res?.data?.phoneEnding || '' }); })
      .catch((err) => { if (alive) setLink({ state: 'bad', message: err.message, phoneEnding: '' }); });
    return () => { alive = false; };
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setErrorMsg('');
    if (password.length < PASSWORD_MIN) return setErrorMsg(`Password must be at least ${PASSWORD_MIN} characters.`);
    if (password !== confirmPassword) return setErrorMsg('Passwords do not match.');
    setSaving(true);
    const res = await resetPassword({ token, newPassword: password, confirmPassword });
    setSaving(false);
    if (res.success) {
      setDone(true);
      setTimeout(() => navigate('/', { replace: true }), 900);
    } else {
      setErrorMsg(res.message);
    }
    return undefined;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-4 bg-[color:var(--brand-surface)] text-[color:var(--brand-text)] font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-[color:var(--brand-border)] shadow-xl overflow-hidden animate-fadeIn">
          <div className="bg-[color:var(--brand-primary)] px-6 py-5 text-center text-white flex flex-col items-center">
            <div className="w-11 h-11 rounded-2xl bg-[color:var(--brand-primary-light)] border border-[color:var(--brand-accent)]/40 flex items-center justify-center text-[color:var(--brand-accent)] mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-extrabold">New Password</h1>
            <p className="text-xs text-[#A2B5A8] mt-1">
              {link.phoneEnding ? `For the account with mobile number ending ${link.phoneEnding}.` : 'Set a new password for your account.'}
            </p>
          </div>

          <div className="p-5 sm:px-7 space-y-3.5">
            {link.state === 'checking' && <p className="text-sm text-stone-500 text-center py-4">Checking your link…</p>}

            {link.state === 'bad' && (
              <>
                <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{link.message}</span>
                </div>
                <Link to="/login" className={BUTTON}>Go to Log In</Link>
              </>
            )}

            {link.state === 'ok' && (
              <>
                {errorMsg && (
                  <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {done && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Password updated. Signing you in…</span>
                  </div>
                )}
                <form onSubmit={submit} className="space-y-3" noValidate>
                  <div>
                    <label className={LABEL} htmlFor="newPassword">New Password</label>
                    <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" autoFocus value={password} onChange={setPassword} placeholder={`Min. ${PASSWORD_MIN} characters`} className={FIELD} />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="confirmPassword">Confirm New Password</label>
                    <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Type it again" className={FIELD} />
                  </div>
                  <button type="submit" disabled={saving || done} className={BUTTON}>
                    <span>{saving ? 'Saving...' : 'Save Password'}</span>
                    {!saving && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
