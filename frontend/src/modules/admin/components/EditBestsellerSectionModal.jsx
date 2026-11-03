import React, { useState, useEffect } from 'react';
import { X, Settings, Save, AlertCircle } from 'lucide-react';

export default function EditBestsellerSectionModal({ isOpen, onClose, config, onSave }) {
  const [formData, setFormData] = useState({
    sectionLabel: 'OUR BESTSELLERS',
    sectionHeading: 'DISCOVER OUR MOST LOVED FLAVOURS',
    viewAllText: 'VIEW ALL PRODUCTS',
    viewAllLink: '/shop',
    isEnabled: true
  });

  useEffect(() => {
    if (config) {
      setFormData({
        sectionLabel: config.sectionLabel || 'OUR BESTSELLERS',
        sectionHeading: config.sectionHeading || 'DISCOVER OUR MOST LOVED FLAVOURS',
        viewAllText: config.viewAllText || 'VIEW ALL PRODUCTS',
        viewAllLink: config.viewAllLink || '/shop',
        isEnabled: config.isEnabled !== false
      });
    }
  }, [config, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans selection:bg-[color:var(--brand-accent)] selection:text-[color:var(--brand-primary)]">
      
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl border border-[color:var(--brand-border)] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-[color:var(--brand-primary)] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[color:var(--brand-accent)]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[color:var(--brand-primary-light)] border border-[color:var(--brand-accent)]/40 flex items-center justify-center text-[color:var(--brand-accent)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
                Section Content & Settings
              </h3>
              <p className="text-[length:calc(11px*var(--fs))] sm:text-xs text-[#A2B5A8]">
                Customize the titles, badges, and links displayed on the User App homepage.
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 bg-[color:var(--brand-surface)]">
          
          {/* Section Enable Toggle */}
          <div className="p-3.5 rounded-xl bg-white border border-[color:var(--brand-border)] flex items-center justify-between shadow-2xs">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                Display Bestseller Section
              </h4>
              <p className="text-[length:calc(11px*var(--fs))] text-stone-500">
                When disabled, the section is completely hidden from the User App homepage.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[color:var(--brand-primary)]"></div>
            </label>
          </div>

          {/* Section Small Eyebrow Label */}
          <div>
            <label className="block text-xs font-bold text-[color:var(--brand-primary)] mb-1.5 uppercase tracking-wider">
              Section Eyebrow Label
            </label>
            <input
              type="text"
              required
              value={formData.sectionLabel}
              onChange={(e) => setFormData({ ...formData, sectionLabel: e.target.value })}
              placeholder="e.g. OUR BESTSELLERS"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[color:var(--brand-primary)] bg-white text-stone-900 font-semibold"
            />
          </div>

          {/* Main Section Heading */}
          <div>
            <label className="block text-xs font-bold text-[color:var(--brand-primary)] mb-1.5 uppercase tracking-wider">
              Main Section Heading
            </label>
            <input
              type="text"
              required
              value={formData.sectionHeading}
              onChange={(e) => setFormData({ ...formData, sectionHeading: e.target.value })}
              placeholder="e.g. DISCOVER OUR MOST LOVED FLAVOURS"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[color:var(--brand-primary)] bg-white text-stone-900 font-semibold"
            />
          </div>

          {/* View All Button Text & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[color:var(--brand-primary)] mb-1.5 uppercase tracking-wider">
                Action Button Text
              </label>
              <input
                type="text"
                required
                value={formData.viewAllText}
                onChange={(e) => setFormData({ ...formData, viewAllText: e.target.value })}
                placeholder="VIEW ALL PRODUCTS"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[color:var(--brand-primary)] bg-white text-stone-900 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[color:var(--brand-primary)] mb-1.5 uppercase tracking-wider">
                Button Target Link
              </label>
              <input
                type="text"
                required
                value={formData.viewAllLink}
                onChange={(e) => setFormData({ ...formData, viewAllLink: e.target.value })}
                placeholder="/shop"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[color:var(--brand-primary)] bg-white text-stone-900 font-semibold"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-bold text-[color:var(--brand-primary)] bg-[color:var(--brand-accent)] hover:bg-[color:var(--brand-accent-light)] rounded-xl shadow-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
