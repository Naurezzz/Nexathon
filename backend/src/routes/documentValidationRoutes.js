import express from 'express';
import { 
  uploadDocument,
  validateDocument,
  getValidationHistory,
  getValidationDetails,
  getValidationStatistics,
  getAllValidations
} from '../controllers/documentValidationController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validate document
router.post('/validate', authenticateUser, uploadDocument.single('document'), validateDocument);

// Get validation history
router.get('/history', authenticateUser, getValidationHistory);

// Get validation details
router.get('/validation/:validationId', authenticateUser, getValidationDetails);

// Get statistics
router.get('/statistics', authenticateUser, getValidationStatistics);

// Government access - all validations
router.get('/all', authenticateUser, getAllValidations);

export default router;
