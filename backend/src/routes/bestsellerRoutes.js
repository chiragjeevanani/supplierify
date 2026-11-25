import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import bestsellerController from '../controllers/bestsellerController.js';

const router = Router();

/**
 * @route   GET /api/v1/bestsellers
 * @desc    Get active Bestsellers for User App homepage
 * @access  Public
 */
router.get('/', authMiddleware, bestsellerController.getPublicBestsellers);

export default router;
