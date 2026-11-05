import express from 'express';
import cors from 'cors';

import env from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';
import bestsellerRoutes from './routes/bestsellerRoutes.js';
import adminBestsellerRoutes from './routes/adminBestsellerRoutes.js';
import adminProductRoutes from './routes/adminProductRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminCategoryRoutes from './routes/adminCategoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminSettingsRoutes from './routes/adminSettingsRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminReviewRoutes from './routes/adminReviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminPaymentRoutes from './routes/adminPaymentRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import adminCouponRoutes from './routes/adminCouponRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import adminBannerRoutes from './routes/adminBannerRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import adminRecipeRoutes from './routes/adminRecipeRoutes.js';
import fcmTokenRoutes from './routes/fcmTokenRoutes.js';
import adminShiprocketRoutes from './routes/adminShiprocketRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import shiprocketController from './controllers/shiprocketController.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { requireAdmin } from './middleware/roleMiddleware.js';
import { validateOrderId } from './validations/orderValidation.js';
import { notFoundHandler, errorMiddleware } from './middleware/errorMiddleware.js';
import { sendSuccess } from './utils/response.js';
import { UPLOADS_ROOT } from './services/uploadService.js';

// Initialize Express
const app = express();

// Enable CORS — allow production storefront + local Vite ports
const configuredOrigins = String(env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://supplierfy.in',
  'https://www.supplierfy.in'
];
const allowAllOrigins = env.CLIENT_URL === '*';
const allowedOrigins = allowAllOrigins
  ? null
  : [...new Set([...configuredOrigins, ...defaultOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / server-to-server / mobile webviews may omit Origin
      if (!origin || allowAllOrigins) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-guest-id',
      'X-Guest-Id',
      'Accept',
      'x-razorpay-signature',
      'x-api-key'
    ]
  })
);

// Body Parsing Middleware (with rawBody capture for webhook signature verification)
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for file uploads
app.use(
  '/uploads',
  express.static(UPLOADS_ROOT, {
    index: false,
    dotfiles: 'deny',
    maxAge: '30d',
    immutable: true,
    setHeaders: (res) => {
      // Uploaded files are images only; never let a browser sniff them into something executable
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

// Health Check Endpoints
app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, 'Server health check passed', {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  return sendSuccess(res, 'Server health check passed', {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting (v1 & standard)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/upload', uploadRoutes);
app.use('/api/v1/bestsellers', bestsellerRoutes);
app.use('/api/v1/admin/bestsellers', adminBestsellerRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/v1/admin/categories', adminCategoryRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/v1/user/addresses', addressRoutes);
app.use('/api/user/addresses', addressRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);

// Convenience Shiprocket actions nested under admin orders (same controller)
const mountOrderShiprocket = (basePath) => {
  app.post(`${basePath}/:id/shiprocket/create`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.createShipment);
  app.post(`${basePath}/:id/shiprocket/fulfill`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.fulfill);
  app.get(`${basePath}/:id/shiprocket/serviceability`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.serviceability);
  app.post(`${basePath}/:id/shiprocket/awb`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.assignAwb);
  app.post(`${basePath}/:id/shiprocket/pickup`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.schedulePickup);
  app.post(`${basePath}/:id/shiprocket/label`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.generateLabel);
  app.post(`${basePath}/:id/shiprocket/invoice`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.generateInvoice);
  app.post(`${basePath}/:id/shiprocket/manifest`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.generateManifest);
  app.get(`${basePath}/:id/shiprocket/track`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.track);
  app.post(`${basePath}/:id/shiprocket/cancel`, authMiddleware, requireAdmin, validateOrderId, shiprocketController.cancelShipment);
};
mountOrderShiprocket('/api/v1/admin/orders');
mountOrderShiprocket('/api/admin/orders');

app.use('/api/v1/admin/shiprocket', adminShiprocketRoutes);
app.use('/api/admin/shiprocket', adminShiprocketRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/v1/shipping', shippingRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/v1/admin/settings', adminSettingsRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/v1/products/:id/reviews', reviewRoutes);
app.use('/api/products/:id/reviews', reviewRoutes);
app.use('/api/v1/admin/reviews', adminReviewRoutes);
app.use('/api/admin/reviews', adminReviewRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/v1/admin/payments', adminPaymentRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/v1/admin/coupons', adminCouponRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/admin/notifications', adminNotificationRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/v1/admin/banners', adminBannerRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/v1/admin/recipes', adminRecipeRoutes);
app.use('/api/admin/recipes', adminRecipeRoutes);
app.use('/api/v1/fcm-tokens', fcmTokenRoutes);
app.use('/api/fcm-tokens', fcmTokenRoutes);
app.use('/api/v1/admin', adminRoutes);

// API only: the storefront is hosted separately, so there is no frontend to serve here.
app.get('/', (req, res) => sendSuccess(res, 'Dry Fruit Wholesale API is running', { health: '/api/v1/health' }));

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorMiddleware);

export default app;
