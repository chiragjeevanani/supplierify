import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, ShoppingBag, LayoutGrid, ShoppingCart, Heart, User, LifeBuoy, Shield, X, Search, Package,
  Info, Phone, Menu, LogIn
} from 'lucide-react';
import WhatsAppIcon from '../../../components/WhatsAppIcon';

import Logo from './Logo';
import { BRAND } from '../../../config/brand';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { useWishlist } from '../../../context/WishlistContext';
import { buildGeneralEnquiry, buildWhatsAppUrl } from '../../../utils/whatsapp';

const NAV_ITEMS = [
  { label: 'Home', to: '/', icon: Home, end: true },
  { label: 'All Products', to: '/shop', icon: ShoppingBag, match: (p, s) => p === '/shop' && !s.includes('tab=categories') },
  { label: 'Categories', to: '/shop?tab=categories', icon: LayoutGrid, match: (p, s) => p === '/shop' && s.includes('tab=categories') },
  { label: 'My Cart', to: '/cart', icon: ShoppingCart, badge: 'cart' },
  { label: 'My Orders', to: '/account?tab=orders', icon: Package, match: (p, s) => p === '/account' && s.includes('tab=orders') },
  { label: 'Favourites', to: '/wishlist', icon: Heart, badge: 'wishlist' },
  { label: 'My Account', to: '/account', icon: User, match: (p, s) => p === '/account' && !s.includes('tab=orders') },
  { label: 'Help & Support', to: '/help-support', icon: LifeBuoy },
  { label: 'About Us', to: '/about', icon: Info },
  { label: 'Contact', to: '/contact', icon: Phone },
  { label: 'Privacy Policy', to: '/privacy-policy', icon: Shield }
];

const PAGE_TITLES = [
  ['/shop', 'Wholesale Catalogue'],
  ['/product', 'Product Details'],
  ['/cart', 'My Cart'],
  ['/checkout', 'Checkout'],
  ['/wishlist', 'Favourites'],
  ['/order-tracking', 'Track Order'],
  ['/account', 'My Account'],
  ['/login', 'Login'],
  ['/about', 'About Us'],
  ['/contact', 'Contact'],
  ['/privacy-policy', 'Privacy Policy'],
  ['/help-support', 'Help & Support']
];

const SIDEBAR_KEY = 'wholesale_sidebar_hidden';

export default function UserLayout({ children }) {
  const { lineCount, whatsappNumber, whatsappGreeting, storeName } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopHidden, setDesktopHidden] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; }
  });
  const [query, setQuery] = useState('');

  // Close the mobile drawer on navigation and lock page scroll while it is open
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleSidebar = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setDesktopHidden((v) => {
        const next = !v;
        try { localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0'); } catch { /* ignore */ }
        return next;
      });
    } else {
      setMobileOpen((v) => !v);
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
  };

  const pageTitle =
    location.pathname === '/'
      ? `Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`
      : (PAGE_TITLES.find(([p]) => location.pathname.startsWith(p)) || [null, BRAND.name])[1];

  const isActive = (item) =>
    item.match ? item.match(location.pathname, location.search) : undefined;

  const badgeFor = (item) => {
    if (item.badge === 'cart') return lineCount;
    if (item.badge === 'wishlist') return wishlistCount;
    return 0;
  };

  const waUrl = buildWhatsAppUrl(whatsappNumber, buildGeneralEnquiry({ greeting: whatsappGreeting }));
  // The floating button is hidden only where a fixed bottom bar already has its own WhatsApp icon (or would cover it)
  const hideFab =
    /^\/(product|checkout)/.test(location.pathname) || (location.pathname.startsWith('/cart') && lineCount > 0);

  const sidebar = (
    <div className="h-full flex flex-col bg-[color:var(--brand-primary)] text-white">
      <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-white/10">
        <Logo variant="light" size="small" />
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const badge = badgeFor(item);
            return (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive: routeActive }) => {
                    const active = isActive(item) ?? routeActive;
                    return `group flex items-center gap-3 rounded-lg px-3 py-3 text-[length:calc(14px*var(--fs))] font-semibold transition-colors border-l-4 ${
                      active
                        ? 'bg-[color:var(--brand-accent)] text-[color:var(--brand-primary)] border-[color:var(--brand-accent-lighter)]'
                        : 'text-white/85 border-transparent hover:bg-white/10 hover:text-white'
                    }`;
                  }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {badge > 0 && (
                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-500 text-white text-[length:calc(11px*var(--fs))] font-extrabold flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 p-3 border-t border-white/10">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] hover:bg-[#1fb857] text-white font-bold text-sm py-3 transition-colors"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Chat on WhatsApp
          </a>
        )}
        <p className="text-[length:calc(11px*var(--fs))] text-white/50 text-center mt-2">Wholesale orders only</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[color:var(--brand-bg)] text-[color:var(--brand-text)]">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 w-64 z-40 transition-transform duration-200 ${
          desktopHidden ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className={`min-h-screen flex flex-col transition-[margin] duration-200 ${desktopHidden ? 'lg:ml-0' : 'lg:ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[color:var(--brand-border)] shadow-sm flex items-center gap-2 sm:gap-4 px-3 sm:px-6">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-[color:var(--brand-primary)] hover:bg-stone-100"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="min-w-0 hidden sm:block">
            <p className="text-[length:calc(11px*var(--fs))] uppercase tracking-wider text-stone-500 leading-tight">{BRAND.shortName}</p>
            <h1 className="font-serif text-base lg:text-lg font-bold text-[color:var(--brand-primary)] leading-tight truncate">{pageTitle}</h1>
          </div>

          <form onSubmit={submitSearch} className="flex-1 min-w-0 max-w-xl ml-auto sm:ml-4" role="search">
            <div className="flex items-center rounded-lg border border-[color:var(--brand-border-strong)] bg-[color:var(--brand-surface)] focus-within:border-[color:var(--brand-accent)] overflow-hidden">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button type="submit" className="px-3 py-2 text-[color:var(--brand-primary)] hover:text-[color:var(--brand-accent-dark)]" aria-label="Search">
                <Search className="w-4.5 h-4.5" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-[color:var(--brand-primary)] hover:bg-stone-100"
              aria-label="Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {lineCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[length:calc(10px*var(--fs))] font-extrabold flex items-center justify-center">
                  {lineCount}
                </span>
              )}
            </Link>

            {user ? (
              <Link
                to="/account"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-stone-100"
                title="My account"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[color:var(--brand-accent)]" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] flex items-center justify-center text-sm font-bold">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden md:block text-sm font-semibold max-w-[110px] truncate">{user.name || 'Account'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg bg-[color:var(--brand-primary)] text-white px-2.5 sm:px-4 py-2 text-sm font-bold whitespace-nowrap hover:bg-[color:var(--brand-primary-hover)]"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>

        <footer className="border-t border-[color:var(--brand-border)] bg-white px-4 sm:px-6 py-4 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} {storeName || BRAND.name}. Wholesale orders only.{' '}
          <Link to="/privacy-policy" className="underline hover:text-[color:var(--brand-primary)]">Privacy</Link>
        </footer>
      </div>

      {!hideFab && waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <WhatsAppIcon className="w-7 h-7 sm:w-8 sm:h-8" />
        </a>
      )}
    </div>
  );
}
