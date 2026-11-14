import { useSyncExternalStore } from 'react';

// Desktop collapse state of the admin sidebar, remembered across pages and visits.
// The page offset (.admin-main in index.css) follows the data attribute set below.
const KEY = 'wholesale_admin_sidebar_collapsed';
const listeners = new Set();

const read = () => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};

let collapsed = typeof window !== 'undefined' ? read() : false;

const apply = () => {
  if (typeof document === 'undefined') return;
  if (collapsed) document.documentElement.setAttribute('data-admin-sidebar', 'collapsed');
  else document.documentElement.removeAttribute('data-admin-sidebar');
};
apply();

export const isDesktop = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

export function toggleAdminSidebarCollapsed() {
  collapsed = !collapsed;
  try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
  apply();
  listeners.forEach((l) => l());
}

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useAdminSidebarCollapsed = () =>
  useSyncExternalStore(subscribe, () => collapsed, () => false);
