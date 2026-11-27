import mongoose from 'mongoose';

/**
 * An uploaded photo, kept in the database so it survives redeploys.
 * The server's uploads folder is only a cache: hosts like Hostinger replace it on every deploy.
 */
const mediaFileSchema = new mongoose.Schema(
  {
    // "folder/name.ext", the part of the URL after /uploads/
    path: { type: String, required: true, unique: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true }
  },
  { timestamps: true }
);

export const MediaFile = mongoose.model('MediaFile', mediaFileSchema);
export default MediaFile;
