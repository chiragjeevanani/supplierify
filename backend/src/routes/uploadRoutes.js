import { Router } from 'express';
import multer from 'multer';
import uploadController from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { sendError } from '../utils/response.js';

const router = Router();

// Configure in-memory storage for Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, GIF or AVIF images are allowed.'), false);
    }
  }
});

// Admin Authentication & Role requirement
router.use(authMiddleware, requireAdmin);

/**
 * @route   POST /api/v1/admin/upload
 * @desc    Upload an image to the server's local uploads folder (multipart or base64 JSON)
 * @access  Admin Protected
 */
// Turn multer's file-type / size errors into clear 4xx responses instead of a generic 500
const receiveImage = (req, res, next) =>
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return sendError(res, 'Image is too large. Maximum size is 10 MB.', {}, 413);
    return sendError(res, err.message || 'Unsupported file.', {}, 415);
  });

router.post('/', receiveImage, uploadController.uploadImage);

/**
 * @route   DELETE /api/v1/admin/upload/:publicId
 * @desc    Remove an uploaded image from the local uploads folder
 * @access  Admin Protected
 */
router.delete('/:publicId', uploadController.deleteImage);

export default router;
