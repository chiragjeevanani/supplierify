import React, { useRef, useState } from 'react';
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-react';

import { uploadApi, assetUrl } from '../../../utils/api';
import { compressImageFile } from '../../../utils/compressImage';

/**
 * Single-image uploader used for the logo, favicon and banners.
 * Uploads to the server's local storage and reports the stored path ("/uploads/...") through onChange.
 */
export default function ImageUploadField({
  label,
  value,
  onChange,
  folder = 'branding',
  hint = '',
  aspect = 'aspect-[16/6]',
  contain = false,
  compress = true
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) {
      setError('Please choose a JPG, PNG, WEBP, GIF or AVIF image.');
      return;
    }
    setBusy(true);
    try {
      // Large photos are shrunk in the browser first (keeps uploads fast); PNG/GIF logos are sent untouched
      const toSend = compress && /jpeg|webp/.test(file.type) ? await compressImageFile(file).catch(() => file) : file;
      const res = await uploadApi.uploadImage(toSend, folder);
      const url = res?.data?.url;
      if (!url) throw new Error('Upload failed. Please try again.');
      onChange(url);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && <label className="block text-xs font-bold text-stone-800 mb-1">{label}</label>}
      <div className={`relative w-full ${aspect} rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 overflow-hidden flex items-center justify-center`}>
        {value ? (
          <img
            src={assetUrl(value)}
            alt={label || 'Uploaded image'}
            className={`w-full h-full ${contain ? 'object-contain p-3' : 'object-cover'}`}
          />
        ) : (
          <div className="text-center text-stone-400 text-xs flex flex-col items-center gap-1">
            <ImageIcon className="w-6 h-6" />
            <span>No image yet</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[color:var(--brand-primary)]" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[color:var(--brand-primary)] text-white text-xs font-bold hover:bg-[color:var(--brand-primary-hover)] disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {value ? 'Replace image' : 'Upload image'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 text-stone-600 text-xs font-bold hover:text-rose-600 hover:border-rose-300 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {hint && <p className="text-[11px] text-stone-500 mt-1.5">{hint}</p>}
      {error && <p className="text-[11px] text-rose-600 font-semibold mt-1.5">{error}</p>}
    </div>
  );
}
