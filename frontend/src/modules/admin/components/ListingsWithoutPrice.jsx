import React from 'react';
import { AlertTriangle, IndianRupee } from 'lucide-react';
import { resolveProductImage } from '../../../utils/productImage';
import { groupOf, groupLabel } from '../../../utils/categoryGroups';

/** Admin warning: items customers can see but cannot buy, with one button each to add the price. */
export default function ListingsWithoutPrice({ listings, onAddPrice }) {
  if (!listings?.length) return null;
  return (
    <section aria-label="Items without a price" className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {listings.length === 1 ? '1 item has no price' : `${listings.length} items have no price`}, so customers cannot buy {listings.length === 1 ? 'it' : 'them'}
        </h2>
        <p className="text-xs text-amber-900 mt-1">
          Press <strong>Add price</strong>, enter the price and stock, and save. The item then shows its price and Add to Cart in the shop.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {listings.map((c) => (
          <div key={c._id || c.id || c.slug} className="flex items-center gap-3 rounded-lg bg-white border border-amber-200 p-2.5">
            <img src={resolveProductImage(c.image)} alt="" className="w-11 h-11 rounded-md object-cover border border-stone-200 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-[color:var(--brand-primary)] truncate" title={c.name}>{c.name}</p>
              <p className="text-[length:calc(11px*var(--fs))] text-stone-500">{groupLabel(groupOf(c))}</p>
            </div>
            <button
              type="button"
              onClick={() => onAddPrice(c)}
              aria-label={`Add price for ${c.name}`}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[color:var(--brand-primary)] text-white text-xs font-bold cursor-pointer hover:bg-[color:var(--brand-primary-light)]"
            >
              <IndianRupee className="w-3.5 h-3.5" /> Add price
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
