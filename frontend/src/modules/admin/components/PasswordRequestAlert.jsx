import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KeyRound, X } from 'lucide-react';
import { adminNotificationApi } from '../../../utils/api';

const CHECK_EVERY_MS = 30_000;
const HIDDEN_KEY = 'wholesale_admin_hidden_password_alert';

/** Pop-up on any admin page while a customer is waiting for a new password. */
export default function PasswordRequestAlert() {
  const location = useLocation();
  const [request, setRequest] = useState(null);
  const [hiddenId, setHiddenId] = useState(() => {
    try { return sessionStorage.getItem(HIDDEN_KEY) || ''; } catch { return ''; }
  });

  const check = useCallback(async () => {
    try {
      const res = await adminNotificationApi.getNotifications({ status: 'unread', type: 'PASSWORD_REQUEST', limit: 20 });
      const waiting = (res?.data?.notifications || []).filter((n) => n.metadata?.needsAction);
      setRequest(waiting.length ? { ...waiting[0], count: waiting.length } : null);
    } catch {
      /* the bell still shows it on the next try */
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    window.addEventListener('wholesale:password-request-changed', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('wholesale:password-request-changed', check);
    };
  }, [check, location.pathname]);

  const id = String(request?._id || request?.id || '');
  if (!request || id === hiddenId) return null;

  const hide = () => {
    setHiddenId(id);
    try { sessionStorage.setItem(HIDDEN_KEY, id); } catch { /* ignore */ }
  };

  return (
    <div role="alert" className="fixed bottom-4 right-4 z-[900] w-[calc(100%-2rem)] max-w-sm rounded-xl border border-amber-300 bg-amber-50 shadow-xl p-4 font-sans">
      <div className="flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-950">
            {request.count > 1 ? `${request.count} password reset requests` : request.title}
          </p>
          <p className="text-xs text-amber-900 mt-0.5 break-words">{request.message}</p>
          <Link to={request.link || '/admin/customers'} onClick={hide} className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-[color:var(--brand-primary)] text-white text-xs font-bold">
            Set new password
          </Link>
        </div>
        <button type="button" onClick={hide} aria-label="Close" className="p-1 text-amber-700 hover:text-amber-950">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
