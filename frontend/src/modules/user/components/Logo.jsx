import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { BRAND } from '../../../config/brand';
import { useStoreRules } from '../../../hooks/useStoreRules';
import { assetUrl } from '../../../utils/api';

/**
 * Site logo. Shows the logo image uploaded in Admin > Settings > Branding; until one is uploaded it
 * falls back to a simple text mark using the store name.
 */
export default function Logo({ variant = 'dark', size = 'default', to = '/', className = '' }) {
  const rules = useStoreRules();
  const name = rules.storeName || BRAND.name;
  const light = variant === 'light';
  // If the uploaded logo file can't be loaded (deleted / moved), fall back to the text mark
  const [failedUrl, setFailedUrl] = useState('');
  useEffect(() => { setFailedUrl(''); }, [rules.logoUrl]);

  if (rules.logoUrl && failedUrl !== rules.logoUrl) {
    const h = { small: 'h-9', default: 'h-11', large: 'h-14' }[size] || 'h-11';
    return (
      <Link to={to} className={`inline-flex items-center select-none shrink-0 ${className}`} aria-label={name}>
        {/* On dark backgrounds the logo sits on a light plate so any logo colours stay readable */}
        <span className={light ? 'bg-white/95 rounded-lg px-2 py-1 inline-flex' : 'inline-flex'}>
          <img
            src={assetUrl(rules.logoUrl)}
            alt={name}
            data-no-fallback
            onError={() => setFailedUrl(rules.logoUrl)}
            className={`${h} w-auto max-w-[170px] object-contain`}
          />
        </span>
      </Link>
    );
  }

  const box = { small: 'w-8 h-8', default: 'w-10 h-10', large: 'w-12 h-12' }[size] || 'w-10 h-10';
  const text = { small: 'text-base', default: 'text-lg', large: 'text-xl' }[size] || 'text-lg';

  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 group select-none shrink-0 ${className}`} aria-label={name}>
      <span className={`${box} rounded-lg bg-[color:var(--brand-accent)] text-[color:var(--brand-primary)] flex items-center justify-center shadow-sm`}>
        <Leaf className="w-1/2 h-1/2" />
      </span>
      <span className={`font-serif font-bold leading-tight ${text} ${light ? 'text-white' : 'text-[color:var(--brand-primary)]'}`}>
        {name}
      </span>
    </Link>
  );
}
