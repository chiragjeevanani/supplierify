import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import categoryController from '../controllers/categoryController.js';

const router = Router();

/**
 * @route   GET /api/v1/categories
 * @route   GET /api/categories
 * @desc    Fetch active categories for user app / storefront sorted by sortOrder
 */
router.get('/', authMiddleware, categoryController.getActiveCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @route   GET /api/categories/:id
 * @desc    Fetch single category by MongoDB ID or slug
 */
router.get('/:id', authMiddleware, categoryController.getCategoryById);

export default router;
