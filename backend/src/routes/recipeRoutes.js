import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import recipeController from '../controllers/recipeController.js';

const router = Router();

// GET /api/v1/recipes - Get public active recipes
router.get('/', authMiddleware, recipeController.getPublicRecipes);

// GET /api/v1/recipes/:id - Get single recipe details
router.get('/:id', authMiddleware, recipeController.getRecipeByIdOrSlug);

export default router;
