import express from 'express';
import multer from 'multer';
import { 
  analyzeFinancialRisk, 
  getAnalysisHistory,
  getAnalysisById,
  analyzeFromFile
} from '../controllers/financialRiskController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Setup multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes require authentication
router.use(authenticateUser);

// Analyze financial risk - manual entry
router.post('/analyze', analyzeFinancialRisk);

// Analyze financial risk - file upload
router.post('/analyze-file', upload.single('file'), analyzeFromFile);

// Get analysis history
router.get('/history', getAnalysisHistory);

// Get specific analysis
router.get('/history/:id', getAnalysisById);

export default router;
