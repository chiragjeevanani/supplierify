import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Quantity stepper for wholesale kg quantities.
 * - Never goes below `min`: the minus button is disabled at the minimum, and anything typed
 *   below it snaps back up to `min` as soon as the field loses focus / Enter is pressed.
 * - `onChange` is only ever called with a whole number between `min` and `max`.
 */
export default function KgStepper({ value, min, max = 100000, onChange, size = 'md', className = '' }) {
  const [draft, setDraft] = useState(null);

  const clamp = (n) => {
    const v = Math.floor(Number(n));
    if (!Number.isFinite(v)) return min;
    return Math.min(Math.max(v, min), Math.max(min, max));
  };

  const commit = () => {
    if (draft === null) return;
    const next = clamp(draft === '' ? value : draft);
    setDraft(null);
    if (next !== value) onChange(next);
  };

  const btn = size === 'sm' ? 'w-8 h-9' : 'w-9 h-10';
  const field = size === 'sm' ? 'w-12 h-9' : 'w-14 h-10';

  return (
    <div className={`inline-flex items-center rounded-lg border border-[color:var(--brand-border-strong)] overflow-hidden bg-white ${className}`}>
      <button
        type="button"
        onClick={() => { setDraft(null); onChange(clamp(value - 1)); }}
        disabled={value <= min}
        className={`${btn} flex items-center justify-center text-[color:var(--brand-primary)] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Decrease kg"
        title={value <= min ? `Minimum order is ${min} kg` : undefined}
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={draft ?? value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className={`${field} text-center text-sm font-bold outline-none border-x border-[color:var(--brand-border-strong)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
        aria-label="Quantity in kg"
      />
      <button
        type="button"
        onClick={() => { setDraft(null); onChange(clamp(value + 1)); }}
        disabled={value >= max}
        className={`${btn} flex items-center justify-center text-[color:var(--brand-primary)] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Increase kg"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
