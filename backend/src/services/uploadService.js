import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

/**
 * Local image storage.
 * Files are written to <backend>/uploads/<folder>/ and served by Express at /uploads/<folder>/<file>.
 * Only the relative path ("/uploads/...") is stored in the database, so it keeps working if the site
 * moves to another domain. When hosting, make sure the `uploads` folder lives on persistent storage
 * and is included in backups.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// UPLOADS_DIR lets a host point this at a persistent disk (e.g. /var/data/uploads on Render)
export const UPLOADS_ROOT = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../../uploads');

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// Allowed image types, detected from the file's real bytes (never trust the client-supplied type).
const SIGNATURES = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', test: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'gif', mime: 'image/gif', test: (b) => b.length > 6 && ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii')) },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.length > 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  { ext: 'avif', mime: 'image/avif', test: (b) => b.length > 12 && b.subarray(4, 8).toString('ascii') === 'ftyp' && /avif|avis/.test(b.subarray(8, 16).toString('ascii')) }
];
const ALLOWED_EXTS = new Set(SIGNATURES.map((s) => s.ext));

const badRequest = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const safeFolder = (folder) => {
  const f = String(folder || '').toLowerCase().trim();
  return /^[a-z0-9_-]{1,40}$/.test(f) ? f : 'misc';
};

/** Accepts a Buffer or a base64 data URI; remote URLs are deliberately not fetched. */
const toBuffer = (source) => {
  if (Buffer.isBuffer(source)) return source;
  if (typeof source === 'string') {
    const m = source.match(/^data:image\/[a-z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!m) throw badRequest('Please upload an image file (JPG, PNG, WEBP, GIF or AVIF).');
    return Buffer.from(m[1], 'base64');
  }
  throw badRequest('No image file or data provided for upload.');
};

class UploadService {
  /**
   * Save an image to local disk.
   * @param {Buffer|string} fileSource file buffer or base64 data URI
   * @param {{ folder?: string }} [options]
   * @returns {Promise<{ url: string, publicId: string, format: string, bytes: number }>}
   */
  async uploadImage(fileSource, options = {}) {
    if (!fileSource) throw badRequest('No image file or data provided for upload.');

    const buffer = toBuffer(fileSource);
    if (!buffer.length) throw badRequest('The uploaded file is empty.');
    if (buffer.length > MAX_BYTES) throw badRequest('Image is too large. Maximum size is 10 MB.', 413);

    const type = SIGNATURES.find((s) => s.test(buffer));
    if (!type) throw badRequest('Unsupported file. Please upload a JPG, PNG, WEBP, GIF or AVIF image.', 415);

    const folder = safeFolder(options.folder);
    const dir = path.join(UPLOADS_ROOT, folder);
    await fs.promises.mkdir(dir, { recursive: true });

    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${type.ext}`;
    await fs.promises.writeFile(path.join(dir, name), buffer);

    return {
      url: `/uploads/${folder}/${name}`,
      publicId: `${folder}/${name}`,
      format: type.ext,
      bytes: buffer.length
    };
  }

  /**
   * Delete a previously uploaded image. Accepts "folder/name.ext" or "/uploads/folder/name.ext".
   * Anything that does not resolve to a file inside the uploads folder is ignored.
   */
  async deleteImage(publicIdOrUrl) {
    const rel = String(publicIdOrUrl || '').replace(/^\/?uploads\//, '').replace(/^\/+/, '');
    if (!/^[a-z0-9_-]{1,40}\/[A-Za-z0-9._-]+$/.test(rel)) return { result: 'ok', skipped: true };

    const ext = path.extname(rel).slice(1).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) return { result: 'ok', skipped: true };

    const full = path.resolve(UPLOADS_ROOT, rel);
    if (!full.startsWith(UPLOADS_ROOT + path.sep)) return { result: 'ok', skipped: true };

    try {
      await fs.promises.unlink(full);
      return { result: 'deleted' };
    } catch (err) {
      if (err.code === 'ENOENT') return { result: 'not_found' };
      throw err;
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;
