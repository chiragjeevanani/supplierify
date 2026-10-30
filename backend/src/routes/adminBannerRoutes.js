import { Router } from 'express';
import bannerController from '../controllers/bannerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get('/', (req, res, next) => bannerController.getAll(req, res, next));
router.post('/', (req, res, next) => bannerController.create(req, res, next));
router.put('/:id', (req, res, next) => bannerController.update(req, res, next));
router.delete('/:id', (req, res, next) => bannerController.remove(req, res, next));

export default router;
