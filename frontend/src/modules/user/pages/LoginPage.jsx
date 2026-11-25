import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, ShieldCheck, AlertCircle, Lock, UserPlus, Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getConfettiColors } from '../../../utils/theme';

import { useAuth } from '../../../context/AuthContext';
import { useStoreRules } from '../../../hooks/useStoreRules';
import PasswordInput, { PASSWORD_MIN } from '../components/PasswordInput';

const FIELD =
  'w-full px-3.5 py-3 text-sm font-semibold text-stone-900 placeholder:text-stone-400 rounded-2xl border border-stone-300 bg-[color:var(--brand-surface)]/50 focus:outline-none focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[color:var(--brand-primary)]/10 transition-all';
const LABEL = 'block text-xs font-bold text-[color:var(--brand-primary)] mb-2';

// [heading, line under it] for each step
const TITLES = {
  phone: ['Log In or Sign Up', 'Enter your mobile number to see our products.'],
  password: ['Welcome Back', 'Enter your password to log in.'],
  signup: ['Create Account', 'This number is new here. Add your details to continue.'],
  contact: ['Set Your Password', 'We need to set up this account for you.']
};
// [button text, text while working]
const BUTTONS = {
  phone: ['Continue', 'Checking...'],
  password: ['Log In', 'Logging in...'],
  signup: ['Create Account', 'Creating account...']
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, token, isAuthenticated, checkPhone, loginWithPassword, signUp } = useAuth();
  const rules = useStoreRules();

  const redirectTarget = searchParams.get('redirect') || location.state?.from?.pathname || '/';

  // 'phone' first; the server then says: 'password' (existing), 'signup' (new) or 'contact'
  const [step, setStep] = useState('phone');
  const isSignup = step === 'signup';

  const [name, setName] = useState('');
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

  const changeNumber = () => {
    setStep('phone');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setShowHelp(false);
  };

  const validate = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) return 'Please enter a valid 10-digit mobile number.';
    if (step === 'phone') return '';
    if (isSignup && name.trim().length < 2) return 'Please enter your name.';
    if (isSignup && email.trim() && !/^\S+@\S+\.\S{2,}$/.test(email.trim())) return 'Please enter a valid email address.';
    if (!password) return 'Please enter your password.';
    if (!isSignup) return '';
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

    if (step === 'phone') {
      const res = await checkPhone(phone);
      setIsLoading(false);
      if (res.success && ['password', 'signup', 'contact'].includes(res.step)) setStep(res.step);
      else setErrorMsg(res.message || 'Could not continue. Please try again.');
      return;
    }

    const res = isSignup
      ? await signUp({ name: name.trim(), phone, email: email.trim(), password, confirmPassword })
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

          <div className="mb-4 flex items-center justify-center">
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
                  {step === 'phone' && <Phone className="w-6 h-6" />}
                  {isSignup && <UserPlus className="w-6 h-6" />}
                  {(step === 'password' || step === 'contact') && <Lock className="w-6 h-6" />}
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {TITLES[step][0]}
                </h1>

                <p className="text-xs text-[#A2B5A8] mt-1 font-normal max-w-xs leading-relaxed">
                  {TITLES[step][1]}
                </p>
              </div>
            </div>

            {/* Body Form */}
            <div className="p-6 sm:p-8 space-y-5">

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

              {step !== 'phone' && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm">
                  <span className="font-bold text-stone-900 tracking-wide">+91 {phone}</span>
                  <button type="button" onClick={changeNumber} className="text-xs font-bold text-[color:var(--brand-primary)] underline cursor-pointer">
                    Change
                  </button>
                </div>
              )}

              {step !== 'contact' && (
              <form key={step} onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* lets password managers save the number with the password */}
                {step !== 'phone' && <input type="text" name="username" autoComplete="username" value={phone} readOnly hidden />}
                {isSignup && (
                  <div>
                    <label className={LABEL} htmlFor="authName">Full Name</label>
                    <input
                      id="authName"
                      name="name"
                      type="text"
                      autoComplete="name"
                      autoFocus
                      maxLength={100}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className={FIELD}
                    />
                  </div>
                )}

                {step === 'phone' && (
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
                )}

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

                {step !== 'phone' && (
                <div>
                  <label className={LABEL} htmlFor="authPassword">Password</label>
                  <PasswordInput
                    id="authPassword"
                    name="password"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    autoFocus={!isSignup}
                    value={password}
                    onChange={setPassword}
                    placeholder={isSignup ? `At least ${PASSWORD_MIN} characters` : 'Enter your password'}
                    className={FIELD}
                  />
                </div>
                )}

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
                  <span>{isLoading ? BUTTONS[step][1] : BUTTONS[step][0]}</span>
                  {!isLoading && <ArrowRight className="w-4 h-4 text-[color:var(--brand-accent)]" />}
                </button>
              </form>
              )}

              {step === 'contact' && (
                <p className="text-sm text-stone-700 leading-relaxed text-center">
                  This number already has an account without a password. Contact us and we will set one for you.
                </p>
              )}

              {(step === 'password' || step === 'contact') && (
                <div className="text-center">
                  {step === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowHelp((v) => !v)}
                      className="text-xs font-bold text-[color:var(--brand-primary)] underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                  {(showHelp || step === 'contact') && (
                    <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                      {step === 'password' ? 'Contact us and we will set a new password for you.' : ''}
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
