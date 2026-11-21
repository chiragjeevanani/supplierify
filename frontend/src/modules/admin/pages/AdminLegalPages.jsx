import React, { useEffect, useState } from 'react';
import { Save, Check, AlertCircle, Eye, Pencil, RotateCcw, FileText, ExternalLink } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';
import { useStoreRules, refreshStoreRules } from '../../../hooks/useStoreRules';
import { LegalMarkdown } from '../../user/components/LegalPage';
import { LEGAL_PAGES, DEFAULT_LEGAL_TEXT, TOKEN_HELP, fillTokens, legalVars } from '../../../utils/legalDefaults';

const FIELD = { terms: 'termsContent', privacy: 'privacyContent', shipping: 'shippingContent' };
const UPDATED = { terms: 'termsUpdatedAt', privacy: 'privacyUpdatedAt', shipping: 'shippingUpdatedAt' };

export default function AdminLegalPages() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, updateSettings, refreshSettings } = useAdmin();
  const rules = useStoreRules();

  const [active, setActive] = useState('terms');
  const [drafts, setDrafts] = useState({}); // unsaved text per page
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => { refreshSettings?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const page = LEGAL_PAGES.find((p) => p.key === active);
  const saved = String(settings?.[FIELD[active]] || '');
  const text = drafts[active] !== undefined ? drafts[active] : saved;
  const dirty = text !== saved;
  const usingStandard = !text.trim();
  const updatedAt = settings?.[UPDATED[active]];

  const flash = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4500);
  };

  const setText = (v) => setDrafts((d) => ({ ...d, [active]: v }));

  const loadStandard = () => {
    if (text.trim() && !window.confirm('Replace what is in the box with the standard text?')) return;
    setText(fillTokens(DEFAULT_LEGAL_TEXT[active], legalVars(rules)));
  };

  const save = async (value) => {
    setSaving(true);
    try {
      await updateSettings({ [FIELD[active]]: value });
      setDrafts((d) => { const n = { ...d }; delete n[active]; return n; });
      flash('success', value.trim() ? `${page.title} saved. It is live on the website now.` : `${page.title} reset to the standard text.`);
    } catch (err) {
      flash('error', err.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetToStandard = async () => {
    if (!window.confirm('Remove your changes and go back to the standard text for this page?')) return;
    await save('');
  };

  const shown = fillTokens(text.trim() ? text : DEFAULT_LEGAL_TEXT[active], legalVars(rules));

  return (
    <div className="min-h-screen bg-[color:var(--brand-surface)] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 admin-main flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Legal Pages" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4 w-full font-sans max-w-5xl">
          {feedback.message && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm font-semibold ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
              {feedback.type === 'success' ? <Check className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-stone-600">
            Edit the text customers see on the Terms &amp; Conditions, Privacy Policy and Shipping, Return &amp; Refund pages. Changes go live as soon as you press Save.
            Please have your CA or lawyer review any legal text you change.
          </p>

          {/* Page tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {LEGAL_PAGES.map((p) => {
              const on = active === p.key;
              const edited = String(settings?.[FIELD[p.key]] || '').trim() !== '';
              return (
                <button
                  key={p.key}
                  onClick={() => { setActive(p.key); setPreview(false); }}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer ${on ? 'bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] border-[color:var(--brand-primary)] shadow-xs' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'}`}
                >
                  {p.title.replace(' (B2B)', '')}
                  {drafts[p.key] !== undefined && drafts[p.key] !== String(settings?.[FIELD[p.key]] || '') ? <span className="ml-1.5 text-amber-500">●</span> : null}
                  <span className={`ml-2 text-[10px] uppercase tracking-wider ${on ? 'opacity-80' : 'text-stone-400'}`}>{edited ? 'Custom' : 'Standard'}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-[color:var(--brand-border)] shadow-2xs p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-[color:var(--brand-primary)] shrink-0" />
                <h2 className="font-bold text-sm sm:text-base text-[color:var(--brand-primary)] truncate">{page.title}</h2>
              </div>
              <a href={page.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold underline text-stone-600">
                View live page <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className={`text-xs rounded-lg px-3 py-2 border ${usingStandard ? 'bg-stone-50 border-stone-200 text-stone-600' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
              {usingStandard
                ? 'The website is showing the standard text for this page. Press “Load standard text” to start editing it, or write your own.'
                : `The website is showing your edited text${updatedAt ? ` (last saved ${new Date(updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })})` : ''}.`}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setPreview(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${!preview ? 'bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] border-[color:var(--brand-primary)]' : 'bg-white text-stone-700 border-stone-300'}`}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => setPreview(true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${preview ? 'bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] border-[color:var(--brand-primary)]' : 'bg-white text-stone-700 border-stone-300'}`}>
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button onClick={loadStandard} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 cursor-pointer">
                Load standard text
              </button>
              {!usingStandard && saved.trim() && (
                <button onClick={resetToStandard} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to standard
                </button>
              )}
            </div>

            {preview ? (
              <div className="rounded-lg border border-stone-200 bg-[color:var(--brand-surface)] p-4 sm:p-6 space-y-4 text-sm text-stone-700 leading-relaxed max-h-[70vh] overflow-y-auto">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[color:var(--brand-primary)]">{page.title}</h1>
                <LegalMarkdown text={shown} />
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={22}
                spellCheck
                placeholder="Write the page text here, or press “Load standard text” to start from the current wording."
                className="w-full px-3.5 py-3 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-accent)] font-mono leading-relaxed"
              />
            )}

            <details className="text-xs text-stone-600">
              <summary className="cursor-pointer font-bold text-stone-700">How to format the text</summary>
              <div className="mt-2 space-y-1.5">
                <p><code className="bg-stone-100 px-1 rounded">## Heading</code> makes a heading &nbsp;·&nbsp; <code className="bg-stone-100 px-1 rounded">- item</code> makes a bullet &nbsp;·&nbsp; <code className="bg-stone-100 px-1 rounded">**bold**</code> makes bold &nbsp;·&nbsp; <code className="bg-stone-100 px-1 rounded">[link text](/privacy-policy)</code> makes a link &nbsp;·&nbsp; an empty line starts a new paragraph.</p>
                <p>These words are replaced automatically with your Settings: {TOKEN_HELP.map(([t, d]) => <span key={t} className="inline-block mr-3"><code className="bg-stone-100 px-1 rounded">{t}</code> {d}</span>)}</p>
              </div>
            </details>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => save(text)}
                disabled={saving || !dirty}
                className="px-5 py-2.5 rounded-lg bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save & publish'}
              </button>
              {dirty && (
                <button onClick={() => setDrafts((d) => { const n = { ...d }; delete n[active]; return n; })} className="text-xs font-semibold underline text-stone-600 cursor-pointer">
                  Discard changes
                </button>
              )}
              {dirty && <span className="text-xs text-amber-700 font-semibold">Unsaved changes</span>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
