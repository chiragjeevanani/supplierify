import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';

const router = Router();

/**
 * @route   GET /api/v1/settings
 * @desc    Get public store configuration and business rules
 * @access  Public
 */
router.get('/', settingsController.getPublicSettings);

/**
 * @route   GET /api/v1/settings/legal/:page   (terms | privacy | shipping)
 * @desc    Admin-edited text of a legal page (empty = show the standard text)
 * @access  Public
 */
router.get('/legal/:page', settingsController.getLegalPage);

export default router;
