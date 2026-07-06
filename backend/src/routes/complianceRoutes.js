import express from 'express';
import { 
  checkDocumentCompliance, 
  checkBatchCompliance, 
  getComplianceHistory, 
  getComplianceCheck 
} from '../controllers/complianceController.js';
import { 
  uploadCompliance, 
  uploadAndCheckCompliance, 
  getComplianceHistory as getFileHistory
} from '../controllers/complianceFileController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Text-based compliance check
router.post('/check', authenticateUser, checkDocumentCompliance);

// Batch compliance check
router.post('/check-batch', authenticateUser, checkBatchCompliance);

// File upload compliance check
router.post('/check-file', authenticateUser, uploadCompliance.single('file'), uploadAndCheckCompliance);

// Get compliance check history
router.get('/history', authenticateUser, getComplianceHistory);

// Get specific compliance check
router.get('/check/:checkId', authenticateUser, getComplianceCheck);

export default router;
