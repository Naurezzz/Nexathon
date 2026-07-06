import express from 'express';
import { 
  uploadAndAnalyze, 
  getUploadStatus, 
  getUserUploads,
  getGraphData 
} from '../controllers/uploadController.js';
import { 
  upload, 
  pdfUpload, 
  uploadAndAnalyzeFile, 
  uploadAndAnalyzePDF 
} from '../controllers/fileUploadController.js';
import { batchUpload, batchUploadAndAnalyze } from '../controllers/batchUploadController.js';
import { exportReport } from '../controllers/exportController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { testUploadNoAuth } from '../controllers/uploadController.js';

const router = express.Router();

// JSON upload
router.post('/analyze', authenticateUser, uploadAndAnalyze);

// Single file upload (CSV/Excel)
router.post('/analyze-file', authenticateUser, upload.single('file'), uploadAndAnalyzeFile);

// ✅ PDF Invoice Upload (NEW)
router.post('/analyze-pdf-invoice', authenticateUser, pdfUpload.single('file'), uploadAndAnalyzePDF);

// Batch file upload
router.post('/analyze-batch', authenticateUser, batchUpload.array('files', 10), batchUploadAndAnalyze);

// Export reports
router.get('/export/:uploadId/:format', authenticateUser, exportReport);

// Get upload status
router.get('/status/:uploadId', authenticateUser, getUploadStatus);

// Get upload history
router.get('/history', authenticateUser, getUserUploads);

// Get graph visualization data
router.get('/graph-data', authenticateUser, getGraphData);

// Test endpoint (no auth needed)
router.post('/test-analyze', testUploadNoAuth);

export default router;
