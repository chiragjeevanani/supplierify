import { Router } from 'express';
import bannerController from '../controllers/bannerController.js';

const router = Router();

/** @route GET /api/v1/banners  @desc Active home-page banners  @access Public */
router.get('/', (req, res, next) => bannerController.getPublic(req, res, next));

export default router;
