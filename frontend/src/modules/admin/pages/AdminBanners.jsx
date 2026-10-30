import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, AlertCircle, Loader2, Images } from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import ImageUploadField from '../components/ImageUploadField';
import { bannerApi, assetUrl } from '../../../utils/api';

const EMPTY = { title: '', subtitle: '', ctaLabel: 'Shop Now', link: '/shop', image: '', status: 'ACTIVE', sortOrder: 0 };

const inputClass =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 bg-white text-[color:var(--brand-primary)] focus:outline-none focus:border-[color:var(--brand-primary)]';

function BannerModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(initial?._id);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.image) {
      setError('Please upload a banner image.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        ctaLabel: form.ctaLabel,
        link: form.link || '/shop',
        image: form.image,
        status: form.status,
        sortOrder: Number(form.sortOrder) || 0
      };
      if (isEdit) await bannerApi.updateBanner(initial._id, payload);
      else await bannerApi.createBanner(payload);
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save the banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 bg-black/60 overflow-y-auto" data-lenis-prevent>
      <form onSubmit={submit} className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="font-serif text-lg font-bold text-[color:var(--brand-primary)]">{isEdit ? 'Edit banner' : 'New banner'}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span className="font-semibold">{error}</span>
            </div>
          )}

          <ImageUploadField
            label="Banner image *"
            value={form.image}
            onChange={(url) => set('image', url)}
            folder="banners"
            aspect="aspect-[16/6]"
            hint="Best size: 1600 x 600 pixels (wide). Put the main subject in the middle; the text is shown over the left side."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Headline</label>
              <input className={inputClass} value={form.title} maxLength={120} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Fresh Cashews, Direct From Source" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Button text</label>
              <input className={inputClass} value={form.ctaLabel} maxLength={40} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="Shop Now" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">Sub-headline</label>
            <input className={inputClass} value={form.subtitle} maxLength={240} onChange={(e) => set('subtitle', e.target.value)} placeholder="e.g. Wholesale rates, minimum order 5 kg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-800 mb-1">Button link</label>
              <input className={inputClass} value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="/shop or /shop?category=cashews" />
              <p className="text-[11px] text-stone-500 mt-1">A page on your site (starts with /) or a full https:// address.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Order</label>
              <input type="number" className={inputClass} value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
              <p className="text-[11px] text-stone-500 mt-1">Smaller shows first.</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
            <input type="checkbox" checked={form.status === 'ACTIVE'} onChange={(e) => set('status', e.target.checked ? 'ACTIVE' : 'INACTIVE')} />
            Show this banner on the home page
          </label>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-stone-200">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-bold text-stone-700">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-[color:var(--brand-primary)] text-white text-sm font-bold hover:bg-[color:var(--brand-primary-hover)] disabled:opacity-60 inline-flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} {isEdit ? 'Save changes' : 'Add banner'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminBanners() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, banner = edit

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await bannerApi.getAdminBanners();
      setBanners(res?.data?.banners || []);
    } catch (err) {
      setError(err.message || 'Could not load banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (b) => {
    try {
      await bannerApi.updateBanner(b._id, { status: b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      load();
    } catch (err) {
      setError(err.message || 'Could not update the banner.');
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete the banner "${b.title || 'Untitled'}"? This cannot be undone.`)) return;
    try {
      await bannerApi.deleteBanner(b._id);
      load();
    } catch (err) {
      setError(err.message || 'Could not delete the banner.');
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--brand-surface)] flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Home Banners" />

        <main className="p-4 sm:p-8 space-y-5 max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600 max-w-xl">
              Banners appear as a slideshow at the top of the home page. With no active banner, the default welcome section is shown.
            </p>
            <button
              onClick={() => setEditing({})}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[color:var(--brand-primary)] text-white text-sm font-bold hover:bg-[color:var(--brand-primary-hover)]"
            >
              <Plus className="w-4 h-4" /> Add banner
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span className="font-semibold">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-stone-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : banners.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-10 text-center">
              <Images className="w-10 h-10 mx-auto text-stone-400" />
              <p className="font-bold text-[color:var(--brand-primary)] mt-2">No banners yet</p>
              <p className="text-sm text-stone-500">Add your first banner to show an image slideshow on the home page.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {banners.map((b) => (
                <li key={b._id} className="bg-white rounded-2xl border border-[color:var(--brand-border)] overflow-hidden flex flex-col sm:flex-row">
                  <div className="sm:w-64 aspect-[16/6] sm:aspect-auto sm:h-auto bg-stone-100 shrink-0">
                    <img src={assetUrl(b.image)} alt={b.title || 'Banner'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[color:var(--brand-primary)] truncate">{b.title || 'Untitled banner'}</h3>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${b.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                        {b.status === 'ACTIVE' ? 'LIVE' : 'HIDDEN'}
                      </span>
                    </div>
                    {b.subtitle && <p className="text-sm text-stone-600 line-clamp-2">{b.subtitle}</p>}
                    <p className="text-xs text-stone-500">Button: {b.ctaLabel || 'Shop Now'} → {b.link} · Order {b.sortOrder}</p>
                    <div className="flex flex-wrap gap-2 mt-auto pt-1">
                      <button onClick={() => setEditing(b)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-700 hover:border-[color:var(--brand-primary)]">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => toggle(b)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-700 hover:border-[color:var(--brand-primary)]">
                        {b.status === 'ACTIVE' ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
                      </button>
                      <button onClick={() => remove(b)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-rose-600 hover:border-rose-300">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>

      {editing && (
        <BannerModal
          initial={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
