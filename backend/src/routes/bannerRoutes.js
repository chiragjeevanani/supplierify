import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import bannerController from '../controllers/bannerController.js';

const router = Router();

/** @route GET /api/v1/banners  @desc Active home-page banners  @access Public */
router.get('/', authMiddleware, (req, res, next) => bannerController.getPublic(req, res, next));

export default router;
