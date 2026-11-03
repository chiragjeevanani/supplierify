import { useEffect } from 'react';
import { useStoreRules } from '../hooks/useStoreRules';
import { applyTheme, applyFontScale } from '../utils/theme';
import { assetUrl } from '../utils/api';

/**
 * Applies the admin-chosen colour theme and favicon to the whole app (storefront and admin panel).
 * Renders nothing. Mounted once in App.jsx.
 */
export default function ThemeApplier() {
  const rules = useStoreRules();

  // Wait for the server's settings: until then the cached theme applied in main.jsx stays in place
  useEffect(() => {
    if (rules.loaded) applyTheme(rules.theme);
  }, [rules.loaded, rules.theme]);

  useEffect(() => {
    if (rules.loaded) applyFontScale(rules.fontScale);
  }, [rules.loaded, rules.fontScale]);

  useEffect(() => {
    if (!rules.loaded) return;
    const href = rules.faviconUrl ? assetUrl(rules.faviconUrl) : '';
    if (!href) return;
    document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach((el) => el.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = href;
    document.head.appendChild(link);
  }, [rules.loaded, rules.faviconUrl]);

  return null;
}
