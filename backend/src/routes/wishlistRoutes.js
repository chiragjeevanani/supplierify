import { Router } from 'express';
import wishlistController from '../controllers/wishlistController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware, requireUser);

// Wishlist endpoints
router.get('/', (req, res, next) => wishlistController.getWishlist(req, res, next));
router.post('/toggle', (req, res, next) => wishlistController.toggleWishlist(req, res, next));
router.delete('/items', (req, res, next) => wishlistController.removeItem(req, res, next));
router.delete('/', (req, res, next) => wishlistController.clearWishlist(req, res, next));
router.post('/sync', (req, res, next) => wishlistController.syncWishlist(req, res, next));

export default router;
