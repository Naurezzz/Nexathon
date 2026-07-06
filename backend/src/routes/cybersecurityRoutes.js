import express from 'express';
import { 
  checkURL, 
  checkBatchURLs,
  getCheckHistory,
  getCheckById 
} from '../controllers/cybersecurityController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Check single URL
router.post('/check-url', checkURL);

// Check multiple URLs
router.post('/check-batch', checkBatchURLs);

// Get check history
router.get('/history', getCheckHistory);

// Get specific check
router.get('/history/:id', getCheckById);

export default router;
