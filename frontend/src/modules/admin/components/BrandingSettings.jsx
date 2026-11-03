import React, { useEffect, useRef } from 'react';
import { Palette, RotateCcw, AlertTriangle, Check, Type } from 'lucide-react';

import ImageUploadField from './ImageUploadField';
import { useStoreRules } from '../../../hooks/useStoreRules';
import {
  DEFAULT_THEME, THEME_PRESETS, THEME_FIELDS, applyTheme, normalizeTheme, isHex, themeWarnings,
  DEFAULT_FONT_SCALE, FONT_SCALE_MIN, FONT_SCALE_MAX, FONT_SCALE_PRESETS, applyFontScale, normalizeFontScale
} from '../../../utils/theme';

const sameTheme = (a, b) => ['primary', 'accent', 'background', 'text'].every((k) => String(a?.[k]).toUpperCase() === String(b?.[k]).toUpperCase());

function ColorRow({ field, value, onChange }) {
  const valid = isHex(value);
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={valid ? value : '#000000'}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="w-11 h-11 rounded-lg border border-stone-300 bg-white cursor-pointer p-0.5"
        aria-label={`${field.label} colour`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-stone-800">{field.label}</span>
          <span className="text-[length:calc(11px*var(--fs))] text-stone-500 truncate">{field.hint}</span>
        </div>
        <input
          type="text"
          value={value}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
          className={`mt-1 w-28 px-2.5 py-1.5 text-xs font-mono rounded-lg border bg-white focus:outline-none ${valid ? 'border-stone-300 focus:border-stone-500' : 'border-rose-400'}`}
          aria-label={`${field.label} hex value`}
        />
      </div>
    </div>
  );
}

/**
 * Admin > Settings > Branding: logo, favicon and the colour theme.
 * Colour changes preview live across the whole admin panel; nothing is saved until the form is saved.
 */
export default function BrandingSettings({ logoUrl, faviconUrl, theme, fontScale, onChange }) {
  const rules = useStoreRules();
  const savedRef = useRef({ theme: rules.theme, fontScale: rules.fontScale });
  savedRef.current = { theme: rules.theme, fontScale: rules.fontScale };

  const t = normalizeTheme(theme);
  const warnings = themeWarnings(theme);
  const scale = normalizeFontScale(fontScale);

  // Live preview (not persisted)
  useEffect(() => {
    applyTheme(theme, { persist: false });
  }, [theme]);
  useEffect(() => {
    applyFontScale(scale, { persist: false });
  }, [scale]);

  // Leaving the page without saving restores the saved colours and text size
  useEffect(() => () => {
    applyTheme(savedRef.current.theme, { persist: false });
    applyFontScale(savedRef.current.fontScale, { persist: false });
  }, []);

  const setColor = (key, value) => onChange('theme', { ...t, ...{ [key]: value } });

  return (
    <section className="space-y-5 pb-6 border-b border-stone-200" aria-labelledby="branding-heading">
      <div>
        <h3 id="branding-heading" className="font-serif text-lg font-bold text-[color:var(--brand-primary)] flex items-center gap-2">
          <Palette className="w-5 h-5 text-[color:var(--brand-accent-dark)]" /> Branding & Colours
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Upload your logo and choose the website colours. Colour changes preview instantly on this page; press Save to publish them.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ImageUploadField
          label="Logo"
          value={logoUrl}
          onChange={(url) => onChange('logoUrl', url)}
          folder="branding"
          aspect="aspect-[3/1]"
          contain
          compress={false}
          hint="Shown in the site header and sidebar. A wide PNG with a transparent background works best (about 400 x 120 px)."
        />
        <ImageUploadField
          label="Favicon (browser tab icon)"
          value={faviconUrl}
          onChange={(url) => onChange('faviconUrl', url)}
          folder="branding"
          aspect="aspect-[3/1]"
          contain
          compress={false}
          hint="A small square image, 64 x 64 px or larger (PNG)."
        />
      </div>

      <div>
        <p className="text-xs font-bold text-stone-800 mb-2">Colour presets</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {THEME_PRESETS.map((p) => {
            const on = sameTheme(t, p.theme);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange('theme', { ...p.theme })}
                aria-pressed={on}
                className={`text-left rounded-xl border-2 p-2.5 transition-colors ${on ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-surface)]' : 'border-stone-200 hover:border-stone-400 bg-white'}`}
              >
                <div className="flex h-7 rounded-md overflow-hidden border border-black/10">
                  <span className="flex-1" style={{ background: p.theme.primary }} />
                  <span className="flex-1" style={{ background: p.theme.accent }} />
                  <span className="flex-1" style={{ background: p.theme.background }} />
                  <span className="flex-1" style={{ background: p.theme.text }} />
                </div>
                <div className="mt-1.5 text-xs font-bold text-stone-800 flex items-center justify-between">
                  {p.name} {on && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-stone-800">Custom colours</p>
          <button
            type="button"
            onClick={() => onChange('theme', { ...DEFAULT_THEME })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[color:var(--brand-primary)]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to default
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-border)]">
          {THEME_FIELDS.map((f) => (
            <ColorRow key={f.key} field={f} value={theme?.[f.key] ?? t[f.key]} onChange={(v) => setColor(f.key, v)} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Type className="w-4 h-4 text-[color:var(--brand-accent-dark)]" /> Text size
          </p>
          <button
            type="button"
            onClick={() => onChange('fontScale', DEFAULT_FONT_SCALE)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[color:var(--brand-primary)]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to normal
          </button>
        </div>
        <div className="p-4 rounded-2xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-border)] space-y-3">
          <div className="flex flex-wrap gap-2">
            {FONT_SCALE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange('fontScale', p.value)}
                aria-pressed={scale === p.value}
                className={`px-3.5 py-2 rounded-lg border-2 text-xs font-bold transition-colors ${
                  scale === p.value ? 'border-[color:var(--brand-primary)] bg-white text-[color:var(--brand-primary)]' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                }`}
              >
                {p.label} <span className="font-normal text-stone-500">{p.value}%</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500">A</span>
            <input
              type="range"
              min={FONT_SCALE_MIN}
              max={FONT_SCALE_MAX}
              step={5}
              value={scale}
              onChange={(e) => onChange('fontScale', Number(e.target.value))}
              className="flex-1 accent-[color:var(--brand-primary)]"
              aria-label="Text size percentage"
            />
            <span className="text-lg font-bold text-stone-500">A</span>
            <span className="w-12 text-right text-xs font-bold text-stone-800">{scale}%</span>
          </div>
          <p className="text-[length:calc(11px*var(--fs))] text-stone-500">
            Changes the size of all text on the store and in this admin panel. It previews instantly; press Save to publish it. Page layout and images stay the same.
          </p>
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="space-y-1.5" role="alert">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" /> {w}
            </li>
          ))}
        </ul>
      )}

      {/* Mini preview of how the colours combine */}
      <div className="rounded-2xl border border-[color:var(--brand-border)] overflow-hidden flex h-32" aria-label="Colour preview">
        <div className="w-24 sm:w-32 bg-[color:var(--brand-primary)] p-2.5 space-y-1.5 shrink-0">
          <div className="h-5 rounded bg-[color:var(--brand-accent)]" />
          <div className="h-3.5 rounded bg-white/25" />
          <div className="h-3.5 rounded bg-white/25" />
        </div>
        <div className="flex-1 bg-[color:var(--brand-bg)] p-3 space-y-2">
          <div className="text-sm font-bold text-[color:var(--brand-primary)]">Heading in the primary colour</div>
          <div className="text-xs text-[color:var(--brand-text)]">Body text on the page background.</div>
          <span className="inline-block rounded-md bg-[color:var(--brand-primary)] text-white text-xs font-bold px-3 py-1.5">Button</span>{' '}
          <span className="inline-block rounded-md bg-[color:var(--brand-accent)] text-[color:var(--brand-primary)] text-xs font-bold px-3 py-1.5">Highlight</span>
        </div>
      </div>
    </section>
  );
}
