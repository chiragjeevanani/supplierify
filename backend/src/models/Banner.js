import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '', maxlength: 120 },
    subtitle: { type: String, trim: true, default: '', maxlength: 240 },
    ctaLabel: { type: String, trim: true, default: 'Shop Now', maxlength: 40 },
    // Where the banner button goes: an in-site path ("/shop?category=cashews") or a full https:// URL
    link: { type: String, trim: true, default: '/shop' },
    // Relative path of an uploaded image ("/uploads/banners/...") or an https:// URL
    image: { type: String, trim: true, required: [true, 'Banner image is required'] },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    sortOrder: { type: Number, default: 0, index: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
