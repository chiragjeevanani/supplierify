import React from 'react';
import WhatsAppIcon from '../../../components/WhatsAppIcon';
import { useStoreRules } from '../../../hooks/useStoreRules';
import { resolveOptimizedProductImage } from '../../../utils/productImage';
import { buildListingEnquiry, buildWhatsAppUrl } from '../../../utils/whatsapp';

/**
 * A category that has no product yet, shown with its photo and details so customers can still
 * see it and ask about it. It has no cart button: only products can be ordered online.
 */
export default function ListingCard({ category }) {
  const rules = useStoreRules();
  const image = resolveOptimizedProductImage(category.image, { width: 600 });
  const waUrl = buildWhatsAppUrl(
    rules.whatsappNumber,
    buildListingEnquiry({ listing: category, greeting: rules.whatsappGreeting })
  );

  return (
    <div className="bg-white rounded-xl border border-[color:var(--brand-border)] hover:border-[color:var(--brand-accent)] shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden text-left">
      <a href={image} target="_blank" rel="noopener noreferrer" aria-label={`View photo of ${category.name}`} className="block m-2.5 sm:m-3 mb-0 aspect-square bg-[color:var(--brand-surface)] border border-stone-200/70 overflow-hidden">
        <img src={image} alt={category.name} loading="lazy" className="w-full h-full object-contain" />
      </a>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-[color:var(--brand-primary)] leading-snug break-words">{category.name}</h3>
        {category.description && category.description.trim() !== String(category.name).trim() && (
          <p className="text-sm text-stone-700 whitespace-pre-line break-words">{category.description}</p>
        )}
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1fb857] text-white font-bold text-sm py-2.5"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Enquire on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
