import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Bestseller from '../models/Bestseller.js';
import Review from '../models/Review.js';
import notificationService from './notificationService.js';
import { HTTP_STATUS } from '../constants/status.js';
import { DRYFRUIT_PRODUCTS_SEED } from '../data/dryfruitSeed.js';

export const INITIAL_PRODUCTS_SEED = DRYFRUIT_PRODUCTS_SEED;

/**
 * Original (MRP) price must be >= selling price. A missing / 0 original price means "no strike-through price".
 */
const assertPriceOrder = (price, oldPrice, label = 'Product') => {
  const sell = Number(price);
  const original = Number(oldPrice);
  if (original > 0 && sell > 0 && original < sell) {
    const err = new Error(`${label}: original price (₹${original}) must be greater than or equal to the selling price (₹${sell}).`);
    err.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw err;
  }
};

class ProductService {
  /**
   * Get all active store products with query filtering
   */
  async getAllProducts(filters = {}, { publicOnly = false } = {}) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot fetch products while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const query = { status: { $ne: 'ARCHIVED' } };

    if (publicOnly) {
      // Storefront: only ACTIVE products — never inactive/archived, regardless of query params
      query.status = 'ACTIVE';
    } else if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.inStock !== undefined) {
      query.inStock = filters.inStock === 'true' || filters.inStock === true;
    }
    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }
    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [{ name: regex }, { flavor: regex }, { tags: regex }, { subtitle: regex }];
    }

    // Live rating aggregates from APPROVED reviews (stored Product.rating / reviewsCount can be stale seed data)
    const ratingStats = await Review.aggregate([
      { $match: { status: 'APPROVED' } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, reviewsCount: { $sum: 1 } } }
    ]);
    const ratingByProduct = new Map(ratingStats.map((r) => [String(r._id), r]));

    return await Product.find(query)
      .select(
        'name slug subtitle tagline category flavor price oldPrice discountPercent rating reviewsCount weight weightOptions inStock stockCount badge badgeType isBestseller isNewLaunch isFeatured image gallery description details productDetails status createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .lean()
      .then((docs) =>
        docs.map((p) => {
          const image =
            typeof p.image === 'string' && !p.image.startsWith('data:')
              ? p.image
              : (Array.isArray(p.gallery)
                  ? p.gallery.find((g) => typeof g === 'string' && !g.startsWith('data:'))
                  : '') || p.image || '';
          const gallery = Array.isArray(p.gallery)
            ? p.gallery.filter((g) => typeof g === 'string' && g && !g.startsWith('data:')).slice(0, 4)
            : [];
          const live = ratingByProduct.get(String(p._id));
          return {
            ...p,
            rating: live ? Math.round(live.avgRating * 10) / 10 : 0,
            reviewsCount: live ? live.reviewsCount : 0,
            _id: p._id?.toString?.() || p._id,
            id: p._id?.toString?.() || p._id,
            image,
            gallery: gallery.length > 0 ? gallery : (image ? [image] : [])
          };
        })
      );
  }

  /**
   * Helper: Find product by MongoDB ObjectId or slug string
   */
  async _findProductByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;
    const cleanId = String(idOrSlug).trim();
    let product = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      product = await Product.findById(cleanId);
    }
    if (!product) {
      product = await Product.findOne({ slug: cleanId.toLowerCase() });
    }
    return product;
  }

  /**
   * Get product by MongoDB ID or slug
   */
  async getProductById(idOrSlug, { publicOnly = false } = {}) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot fetch product while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const product = await this._findProductByIdOrSlug(idOrSlug);
    if (!product || (publicOnly && product.status !== 'ACTIVE')) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }
    return product;
  }

  /**
   * Create a new product in the store catalog
   * Auto-syncs to Bestseller collection if isBestseller is true
   */
  async createProduct(data) {
    if (!data.name || !data.name.trim()) {
      const err = new Error('Product name is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Require active MongoDB connection for data persistence
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database is currently offline. Cannot persist product to database.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }


    // Generate unique slug
    let slug = (data.slug || data.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Calculate prices with intelligent fallbacks
    const priceNum = Number(data.price || data.variants?.[0]?.price || 249);
    const oldPriceNum = Number(data.oldPrice || data.variants?.[0]?.oldPrice || (priceNum > 0 ? Math.round(priceNum * 1.2) : 299));

    assertPriceOrder(priceNum, data.oldPrice ? oldPriceNum : 0);
    (Array.isArray(data.variants) ? data.variants : []).forEach((v) => {
      assertPriceOrder(v.price || priceNum, v.oldPrice, `Variant ${v.weight || ''}`.trim());
    });
    (Array.isArray(data.weightOptions) ? data.weightOptions : []).forEach((w) => {
      assertPriceOrder(w.price, w.oldPrice, `Pack ${w.weight || ''}`.trim());
    });

    // Map weight options from variants or default
    let weightOptions = data.weightOptions;
    if (!weightOptions || weightOptions.length === 0) {
      if (data.variants && data.variants.length > 0) {
        weightOptions = data.variants.map((v, idx) => ({
          weight: v.weight || '1 kg',
          price: Number(v.price || priceNum),
          oldPrice: Number(v.oldPrice || oldPriceNum),
          isDefault: idx === 0
        }));
      } else {
        weightOptions = [
          { weight: data.weight || '1 kg', price: priceNum, oldPrice: oldPriceNum, isDefault: true }
        ];
      }
    }

    let discountPercent = Number(data.discountPercent || 0);
    if (!discountPercent && oldPriceNum > priceNum) {
      discountPercent = Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100);
    }

    // High quality signature pouch default image if none provided
    const defaultImage = '/assets/dryfruits/placeholder.svg';
    const resolvedImage = data.image && typeof data.image === 'string' && data.image.trim() && !data.image.includes('photo-1599488615731')
      ? data.image.trim()
      : defaultImage;

    const newProduct = await Product.create({
      name: data.name.trim(),
      subtitle: data.subtitle || data.tagline || '',
      tagline: data.tagline || data.subtitle || '',
      slug,
      category: data.category || 'almonds-nuts',
      flavor: data.flavor || data.name.split(' ')[0] || '',
      diet: data.diet || ['natural', 'vegan', 'gluten-free'],
      price: priceNum,
      oldPrice: oldPriceNum,
      discountPercent,
      rating: Number(data.rating || 5.0),
      reviewsCount: Number(data.reviewsCount || 0),
      weight: data.weight || '1 kg',
      weightOptions,
      minOrderQty: Math.max(0, Number(data.minOrderQty) || 0),
      sku: data.sku || '',
      shippingWeightKg: data.shippingWeightKg != null ? Number(data.shippingWeightKg) : null,
      lengthCm: data.lengthCm != null ? Number(data.lengthCm) : null,
      breadthCm: data.breadthCm != null ? Number(data.breadthCm) : null,
      heightCm: data.heightCm != null ? Number(data.heightCm) : null,
      inStock: data.inStock !== false,
      stockCount: Number(data.stockCount ?? 150),
      badge: data.badge || (data.isBestseller ? 'BESTSELLER' : ''),
      badgeType: data.badgeType || (data.isBestseller ? 'bestseller' : 'popular'),
      isBestseller: Boolean(data.isBestseller),
      image: resolvedImage,
      gallery: Array.isArray(data.gallery) && data.gallery.length > 0 ? data.gallery : [resolvedImage],
      description: data.description || '',
      details: data.details || data.productDetails || '',
      productDetails: data.productDetails || data.details || '',
      ingredients: data.ingredients || '',
      tags: data.tags || [data.name, data.category].filter(Boolean),
      status: data.status || 'ACTIVE'
    });

    // Auto-sync into Bestseller collection if isBestseller is true
    if (data.isBestseller) {
      try {
        const highestOrder = await Bestseller.findOne().sort({ displayOrder: -1 }).select('displayOrder');
        const nextOrder = (highestOrder?.displayOrder ?? 0) + 1;
        await Bestseller.create({
          product: newProduct._id,
          productName: newProduct.name,
          displayOrder: nextOrder,
          isActive: true
        });
      } catch (err) {
        console.warn('[Auto-Bestseller] Product already in bestsellers or duplicate note:', err.message);
      }
    }

    return newProduct;
  }

  /**
   * Update existing product catalog details
   */
  async updateProduct(productId, updateData = {}) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot update product while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const product = await this._findProductByIdOrSlug(productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    // Only apply editable catalog fields — never Object.assign raw client payloads
    // (avoids overwriting _id/timestamps and CastError/ValidationError on some products)
    const ALLOWED_FIELDS = [
      'name', 'subtitle', 'tagline', 'category', 'flavor', 'diet',
      'price', 'oldPrice', 'discountPercent', 'rating', 'reviewsCount',
      'weight', 'weightOptions', 'inStock', 'stockCount', 'badge', 'badgeType',
      'isBestseller', 'isNewLaunch', 'isFeatured', 'image', 'gallery',
      'description', 'details', 'productDetails', 'ingredients', 'tags', 'status',
      'sku', 'shippingWeightKg', 'lengthCm', 'breadthCm', 'heightCm', 'minOrderQty'
    ];

    const safeUpdate = {};
    for (const key of ALLOWED_FIELDS) {
      if (updateData[key] !== undefined) {
        safeUpdate[key] = updateData[key];
      }
    }

    // Map UI variants → weightOptions when weightOptions not explicitly sent
    if (Array.isArray(updateData.variants) && updateData.variants.length > 0 && !Array.isArray(safeUpdate.weightOptions)) {
      safeUpdate.weightOptions = updateData.variants.map((v, idx) => ({
        weight: v.weight || '1 kg',
        price: Number(v.price || updateData.price || product.price),
        oldPrice: Number(v.oldPrice || updateData.oldPrice || product.oldPrice || 0),
        isDefault: idx === 0
      }));
      if (safeUpdate.weightOptions[0]?.weight) {
        safeUpdate.weight = safeUpdate.weightOptions[0].weight;
      }
    }

    if (safeUpdate.price !== undefined && safeUpdate.price !== '') {
      safeUpdate.price = Number(safeUpdate.price);
    }
    if (safeUpdate.oldPrice !== undefined && safeUpdate.oldPrice !== '') {
      safeUpdate.oldPrice = Number(safeUpdate.oldPrice);
    }
    if (safeUpdate.stockCount !== undefined && safeUpdate.stockCount !== '') {
      safeUpdate.stockCount = Number(safeUpdate.stockCount);
      if (safeUpdate.inStock === undefined) {
        safeUpdate.inStock = safeUpdate.stockCount > 0;
      }
    }
    if (safeUpdate.isBestseller !== undefined) {
      safeUpdate.isBestseller = Boolean(safeUpdate.isBestseller);
    }

    // Reject oversized base64 blobs that blow past Mongo/body limits and freeze the admin UI
    const MAX_STORED_IMAGE_CHARS = 500_000;
    const isOversizedDataUrl = (val) =>
      typeof val === 'string' && val.startsWith('data:') && val.length > MAX_STORED_IMAGE_CHARS;

    if (isOversizedDataUrl(safeUpdate.image)) {
      const err = new Error('Product image is too large to store. Please upload the photo again so it can be saved on the server.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }
    if (Array.isArray(safeUpdate.gallery)) {
      safeUpdate.gallery = safeUpdate.gallery.filter((img) => typeof img === 'string' && img.trim());
      if (safeUpdate.gallery.some(isOversizedDataUrl)) {
        const err = new Error('One or more gallery photos are still local previews and too large to save. Wait for upload to finish or remove them.');
        err.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw err;
      }
    }

    const nextPrice = safeUpdate.price !== undefined ? safeUpdate.price : product.price;
    const nextOldPrice = safeUpdate.oldPrice !== undefined ? safeUpdate.oldPrice : product.oldPrice;
    // Only enforce when the admin is actually changing prices (don't block unrelated edits on legacy data)
    if (safeUpdate.price !== undefined || safeUpdate.oldPrice !== undefined) {
      assertPriceOrder(nextPrice, nextOldPrice);
    }
    if (Array.isArray(safeUpdate.weightOptions)) {
      safeUpdate.weightOptions.forEach((w) => assertPriceOrder(w.price, w.oldPrice, `Pack ${w.weight || ''}`.trim()));
    }
    if (
      nextPrice &&
      nextOldPrice &&
      nextOldPrice > nextPrice &&
      safeUpdate.discountPercent === undefined
    ) {
      safeUpdate.discountPercent = Math.round(((nextOldPrice - nextPrice) / nextOldPrice) * 100);
    }

    Object.keys(safeUpdate).forEach((key) => {
      product.set(key, safeUpdate[key]);
    });
    await product.save();

    if (safeUpdate.stockCount !== undefined) {
      notificationService.checkAndNotifyLowStock(product).catch(() => {});
    }

    // Sync Bestseller status
    if (safeUpdate.isBestseller !== undefined) {
      if (safeUpdate.isBestseller) {
        const existing = await Bestseller.findOne({ product: product._id });
        if (!existing) {
          const highestOrder = await Bestseller.findOne().sort({ displayOrder: -1 }).select('displayOrder');
          const nextOrder = (highestOrder?.displayOrder ?? 0) + 1;
          await Bestseller.create({
            product: product._id,
            productName: product.name,
            displayOrder: nextOrder,
            isActive: true
          });
        } else if (existing.productName !== product.name) {
          existing.productName = product.name;
          await existing.save();
        }
      } else {
        await Bestseller.deleteOne({ product: product._id });
      }
    }

    return product;
  }

  /**
   * Delete product and clean up references
   */
  async deleteProduct(productId) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot delete product while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const product = await this._findProductByIdOrSlug(productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const name = product.name;
    const actualId = product._id;
    await Product.deleteOne({ _id: actualId });
    await Bestseller.deleteOne({ product: actualId });

    return { message: `Product "${name}" was deleted successfully from catalog and bestsellers.` };
  }

  /**
   * Toggle in-stock status
   */
  async toggleProductStatus(productId) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot change product status while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const product = await this._findProductByIdOrSlug(productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    product.inStock = !product.inStock;
    product.status = product.inStock ? 'ACTIVE' : 'INACTIVE';
    await product.save();

    return product;
  }

  /**
   * Update stock count
   */
  async updateStock(productId, stockCount) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot update stock while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const product = await this._findProductByIdOrSlug(productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const count = Math.max(0, Number(stockCount));
    product.stockCount = count;
    product.inStock = count > 0;
    if (!product.inStock) {
      product.status = 'INACTIVE';
    } else if (product.status === 'INACTIVE') {
      product.status = 'ACTIVE';
    }
    await product.save();

    // Check and trigger Admin low-stock notification if below threshold
    notificationService.checkAndNotifyLowStock(product).catch(() => {});

    return product;
  }

  /**
   * Seed default catalog products if collection is empty
   */
  async seedInitialProducts() {
    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        await Product.insertMany(INITIAL_PRODUCTS_SEED);
        console.log(`[Product Seeding] Successfully seeded ${INITIAL_PRODUCTS_SEED.length} initial store products.`);
      }
    } catch (error) {
      console.error('[Product Seeding Error] Could not seed products:', error.message);
    }
  }
}

export const productService = new ProductService();
export default productService;
