import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, ShieldCheck, ArrowLeft, AlertCircle, Lock, UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getConfettiColors } from '../../../utils/theme';

import { useAuth } from '../../../context/AuthContext';
import { useStoreRules } from '../../../hooks/useStoreRules';
import PasswordInput, { PASSWORD_MIN } from '../components/PasswordInput';

const FIELD =
  'w-full px-3.5 py-3 text-sm font-semibold text-stone-900 placeholder:text-stone-400 rounded-2xl border border-stone-300 bg-[color:var(--brand-surface)]/50 focus:outline-none focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[color:var(--brand-primary)]/10 transition-all';
const LABEL = 'block text-xs font-bold text-[color:var(--brand-primary)] mb-2';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token, isAuthenticated, loginWithPassword, signUp } = useAuth();
  const rules = useStoreRules();

  const redirectTarget = searchParams.get('redirect') || location.state?.from?.pathname || '/account';
  const isSignup = searchParams.get('mode') === 'signup';

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated (JWT + user), redirect
  useEffect(() => {
    if ((isAuthenticated || (token && user)) && !isLoading && !successMsg) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, token, user, navigate, redirectTarget, isLoading, successMsg]);

  const switchMode = (signup) => {
    const next = new URLSearchParams(searchParams);
    if (signup) next.set('mode', 'signup');
    else next.delete('mode');
    // keep location.state so we still return to the page that asked for login
    setSearchParams(next, { replace: true, state: location.state });
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setShowHelp(false);
  };

  const validate = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) return 'Please enter a valid 10-digit mobile number.';
    if (!password) return 'Please enter your password.';
    if (!isSignup) return '';
    if (email.trim() && !/^\S+@\S+\.\S{2,}$/.test(email.trim())) return 'Please enter a valid email address.';
    if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg('');
    const problem = validate();
    if (problem) {
      setErrorMsg(problem);
      return;
    }

    setIsLoading(true);
    const res = isSignup
      ? await signUp({ phone, email: email.trim(), password, confirmPassword })
      : await loginWithPassword(phone, password);

    if (res.success) {
      setSuccessMsg(isSignup ? 'Account created. Welcome!' : 'Logged in successfully.');
      setIsLoading(false);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 }, colors: getConfettiColors() });
      } catch {
        // ignore
      }
      setTimeout(() => navigate(redirectTarget, { replace: true }), 500);
    } else {
      setIsLoading(false);
      setErrorMsg(res.message);
    }
  };

  const supportPhone = rules.supportPhone;
  const whatsapp = rules.whatsappNumber;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[color:var(--brand-surface)] text-[color:var(--brand-text)] selection:bg-[color:var(--brand-accent)] selection:text-[color:var(--brand-primary)] font-sans">
      <div>
      </div>

      <main className="flex-1 py-6 sm:py-10 md:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-center pb-24 md:pb-12">

        <div className="w-full max-w-md mx-auto">

          {/* Breadcrumb / Return Link */}
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[color:var(--brand-primary)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </Link>

            <span className="text-[length:calc(11px*var(--fs))] font-bold text-[color:var(--brand-accent-dark)] bg-[color:var(--brand-bg)] px-2.5 py-1 rounded-lg border border-[color:var(--brand-accent)]/30">
              Supplierfy Secure Access
            </span>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-[color:var(--brand-border)] shadow-xl overflow-hidden animate-fadeIn">

            {/* Top Brand Banner */}
            <div className="bg-[color:var(--brand-primary)] p-6 sm:p-8 text-center text-white border-b border-[color:var(--brand-accent)]/30 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-36 h-36 bg-[color:var(--brand-accent)]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-[color:var(--brand-accent)]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-[color:var(--brand-primary-light)] border border-[color:var(--brand-accent)]/40 flex items-center justify-center text-[color:var(--brand-accent)] shadow-md mb-3">
                  {isSignup ? <UserPlus className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {isSignup ? 'Create Account' : 'Log In'}
                </h1>

                <p className="text-xs text-[#A2B5A8] mt-1 font-normal max-w-xs leading-relaxed">
                  {isSignup
                    ? 'Sign up with your mobile number and a password.'
                    : 'Use your mobile number and password.'}
                </p>
              </div>
            </div>

            {/* Body Form */}
            <div className="p-6 sm:p-8 space-y-5">

              {/* Log in / Sign up switch */}
              <div role="tablist" className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-stone-100">
                {[[false, 'Log In'], [true, 'Sign Up']].map(([signup, label]) => (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={isSignup === signup}
                    onClick={() => switchMode(signup)}
                    className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isSignup === signup
                        ? 'bg-white text-[color:var(--brand-primary)] shadow-sm'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {errorMsg && (
                <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className={LABEL} htmlFor="authPhone">Mobile Number</label>
                  <div className="flex items-center rounded-2xl border border-stone-300 focus-within:border-[color:var(--brand-primary)] focus-within:ring-2 focus-within:ring-[color:var(--brand-primary)]/10 overflow-hidden bg-[color:var(--brand-surface)]/50 transition-all">
                    <div className="flex items-center gap-1.5 px-3.5 py-3 border-r border-stone-200 bg-stone-50/80 text-xs font-bold text-stone-700 select-none shrink-0">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      id="authPhone"
                      name="username"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="username"
                      autoFocus
                      value={phone}
                      onChange={(e) => {
                        // accept pasted "+91 98765 43210" as well
                        let digits = e.target.value.replace(/\D/g, '');
                        if (digits.length > 10) digits = digits.replace(/^(91|0)/, '');
                        setPhone(digits.slice(0, 10));
                      }}
                      placeholder="Enter 10-digit number"
                      className="w-full px-3.5 py-3 text-sm font-semibold text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none tracking-wide"
                    />
                  </div>
                </div>

                {isSignup && (
                  <div>
                    <label className={LABEL} htmlFor="authEmail">
                      Email <span className="font-medium text-stone-400">(optional)</span>
                    </label>
                    <input
                      id="authEmail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={FIELD}
                    />
                  </div>
                )}

                <div>
                  <label className={LABEL} htmlFor="authPassword">Password</label>
                  <PasswordInput
                    id="authPassword"
                    name="password"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={setPassword}
                    placeholder={isSignup ? `At least ${PASSWORD_MIN} characters` : 'Enter your password'}
                    className={FIELD}
                  />
                </div>

                {isSignup && (
                  <div>
                    <label className={LABEL} htmlFor="authConfirm">Confirm Password</label>
                    <PasswordInput
                      id="authConfirm"
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Type the password again"
                      className={FIELD}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary-light)] text-[color:var(--brand-accent)] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
                >
                  <span>
                    {isSignup
                      ? (isLoading ? 'Creating account...' : 'Create Account')
                      : (isLoading ? 'Logging in...' : 'Log In')}
                  </span>
                  {!isLoading && <ArrowRight className="w-4 h-4 text-[color:var(--brand-accent)]" />}
                </button>
              </form>

              {!isSignup && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowHelp((v) => !v)}
                    className="text-xs font-bold text-[color:var(--brand-primary)] underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                  {showHelp && (
                    <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                      Contact us and we will set a new password for you.
                      {supportPhone && (
                        <>
                          {' '}Call{' '}
                          <a className="font-bold underline" href={`tel:${String(supportPhone).replace(/[^\d+]/g, '')}`}>{supportPhone}</a>.
                        </>
                      )}
                      {whatsapp && (
                        <>
                          {' '}
                          <a
                            className="font-bold underline"
                            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello, please reset the password for my account${phone ? ` (mobile ${phone})` : ''}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Message us on WhatsApp
                          </a>.
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}

              {isSignup && (
                <p className="text-center text-[length:calc(11px*var(--fs))] text-stone-500 leading-relaxed">
                  By creating an account you agree to our{' '}
                  <Link className="underline" to="/terms-and-conditions">Terms &amp; Conditions</Link> and{' '}
                  <Link className="underline" to="/privacy-policy">Privacy Policy</Link>.
                </p>
              )}

              {/* Security & Assurance Badge */}
              <div className="flex items-center justify-center gap-2 text-[length:calc(11px*var(--fs))] text-stone-500 pt-3 border-t border-stone-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted connection • Supplierfy Safe Access</span>
              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
