import React from 'react';
import { useStoreRules } from '../../../hooks/useStoreRules';

const InstagramIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

/**
 * Social media links. The addresses are set by the admin in Settings; a link that is empty is not shown,
 * and nothing is rendered at all when none are set.
 */
export default function SocialLinks({ variant = 'dark', showLabel = false, className = '' }) {
  const rules = useStoreRules();
  const links = [
    { key: 'instagram', label: 'Instagram', url: rules.instagramUrl, Icon: InstagramIcon },
    { key: 'facebook', label: 'Facebook', url: rules.facebookUrl, Icon: FacebookIcon }
  ].filter((l) => typeof l.url === 'string' && /^https:\/\//i.test(l.url));

  if (links.length === 0) return null;

  const light = variant === 'light';
  const btn = light
    ? 'bg-white/10 text-white hover:bg-white/20 border-white/15'
    : 'bg-white text-[color:var(--brand-primary)] hover:bg-[color:var(--brand-accent)] border-[color:var(--brand-border)]';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className={`text-[length:calc(11px*var(--fs))] font-semibold mr-1 ${light ? 'text-white/60' : 'text-stone-500'}`}>
          Follow us
        </span>
      )}
      {links.map(({ key, label, url, Icon }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} (opens in a new tab)`}
          title={label}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${btn}`}
        >
          <Icon className="w-[18px] h-[18px]" />
        </a>
      ))}
    </div>
  );
}
