import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import productController from '../controllers/productController.js';

const router = Router();

/**
 * @route   GET /api/v1/products
 * @desc    Get all active store products with search & category filters
 * @access  Public
 */
router.get('/', authMiddleware, productController.getPublicProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', authMiddleware, productController.getPublicProductById);

export default router;
