import mongoose from 'mongoose';
import Banner from '../models/Banner.js';
import uploadService from '../services/uploadService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import { cleanImageUrl, cleanLink } from '../utils/safeUrl.js';

/** Validate + normalise the editable banner fields. Returns { data } or { error }. */
const parseBannerBody = (body = {}, { partial = false } = {}) => {
  const data = {};

  if (!partial || body.image !== undefined) {
    const image = cleanImageUrl(body.image);
    if (!image) return { error: 'Please upload a banner image.' };
    data.image = image;
  }
  if (body.title !== undefined) data.title = String(body.title).trim().slice(0, 120);
  if (body.subtitle !== undefined) data.subtitle = String(body.subtitle).trim().slice(0, 240);
  if (body.ctaLabel !== undefined) data.ctaLabel = String(body.ctaLabel).trim().slice(0, 40);
  if (body.link !== undefined) {
    const link = body.link === '' ? '/shop' : cleanLink(body.link);
    if (!link) return { error: 'Link must start with "/" (for example /shop) or be a full https:// address.' };
    data.link = link;
  }
  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(status)) return { error: 'Status must be ACTIVE or INACTIVE.' };
    data.status = status;
  }
  if (body.sortOrder !== undefined) {
    const n = Number(body.sortOrder);
    data.sortOrder = Number.isFinite(n) ? n : 0;
  }
  return { data };
};

const isLocalUpload = (url) => typeof url === 'string' && url.startsWith('/uploads/');

class BannerController {
  /** Public: active banners for the home page slideshow */
  async getPublic(req, res, next) {
    try {
      const banners = await Banner.find({ status: 'ACTIVE' }).sort({ sortOrder: 1, createdAt: -1 }).lean();
      return sendSuccess(res, 'Banners retrieved successfully', { banners });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: every banner */
  async getAll(req, res, next) {
    try {
      const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
      return sendSuccess(res, 'Banners retrieved successfully', { banners });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { data, error } = parseBannerBody(req.body);
      if (error) return sendError(res, error, {}, HTTP_STATUS.BAD_REQUEST);
      const banner = await Banner.create(data);
      return sendSuccess(res, 'Banner created successfully', { banner }, HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid banner id.', {}, HTTP_STATUS.BAD_REQUEST);
      }
      const existing = await Banner.findById(req.params.id);
      if (!existing) return sendError(res, 'Banner not found.', {}, HTTP_STATUS.NOT_FOUND);

      const { data, error } = parseBannerBody(req.body, { partial: true });
      if (error) return sendError(res, error, {}, HTTP_STATUS.BAD_REQUEST);

      const oldImage = existing.image;
      existing.set(data);
      await existing.save();

      // The previous photo is no longer used by this banner: free the disk space
      if (data.image && data.image !== oldImage && isLocalUpload(oldImage)) {
        await uploadService.deleteImage(oldImage).catch(() => {});
      }
      return sendSuccess(res, 'Banner updated successfully', { banner: existing });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid banner id.', {}, HTTP_STATUS.BAD_REQUEST);
      }
      const banner = await Banner.findByIdAndDelete(req.params.id);
      if (!banner) return sendError(res, 'Banner not found.', {}, HTTP_STATUS.NOT_FOUND);
      if (isLocalUpload(banner.image)) await uploadService.deleteImage(banner.image).catch(() => {});
      return sendSuccess(res, 'Banner deleted successfully', {});
    } catch (err) {
      next(err);
    }
  }
}

export const bannerController = new BannerController();
export default bannerController;
