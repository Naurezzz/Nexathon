import multer from 'multer';
import fs from 'fs';
import { parseDocument, normalizeInvoiceData } from '../services/documentParser.js';
import Upload from '../models/Upload.js';
import FraudResult from '../models/FraudResult.js';
import { callFraudService } from '../services/mlProxy.js';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for multiple file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/batch/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

export const batchUpload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

export const batchUploadAndAnalyze = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const userId = req.user.id;
    const companyId = req.body.companyId || userId;
    const batchId = uuidv4();
    
    console.log(`📦 Processing batch upload: ${req.files.length} files`);
    
    const results = [];
    let totalInvoices = 0;
    let totalSuspicious = 0;
    
    // Process each file
    for (const file of req.files) {
      try {
        console.log(`📁 Processing: ${file.originalname}`);
        
        const uploadId = uuidv4();
        const filePath = file.path;
        
        // Create upload record
        const uploadRecord = new Upload({
          userId,
          companyId,
          uploadId,
          fileName: file.originalname,
          fileType: 'invoice',
          status: 'processing',
          rowCount: 0
        });
        
        await uploadRecord.save();
        
        // Parse document
        const rawData = await parseDocument(filePath, file.mimetype);
        const invoices = normalizeInvoiceData(rawData);
        
        if (invoices.length === 0) {
          uploadRecord.status = 'failed';
          uploadRecord.result = { error: 'No valid invoice data found' };
          await uploadRecord.save();
          continue;
        }
        
        uploadRecord.rowCount = invoices.length;
        await uploadRecord.save();
        
        // Call ML service
        const fraudResults = await callFraudService(uploadId, companyId, invoices);
        
        // Save fraud results
        const fraudRecord = new FraudResult({
            uploadId,
            userId: req.user.id,  // ADD THIS
            companyId,
            summary: fraudResults.summary,
            predictions: fraudResults.predictions
        });

        await fraudRecord.save();
        
        // Update upload status
        uploadRecord.status = 'completed';
        uploadRecord.result = {
          summary: fraudResults.summary,
          timestamp: fraudResults.timestamp
        };
        await uploadRecord.save();
        
        // Clean up file
        fs.unlinkSync(filePath);
        
        // Aggregate results
        totalInvoices += invoices.length;
        totalSuspicious += fraudResults.summary.suspicious_count;
        
        results.push({
          fileName: file.originalname,
          uploadId,
          invoicesProcessed: invoices.length,
          suspiciousCount: fraudResults.summary.suspicious_count,
          summary: fraudResults.summary,
          status: 'success'
        });
        
        console.log(`✅ ${file.originalname}: ${invoices.length} invoices processed`);
        
      } catch (fileError) {
        console.error(`❌ Error processing ${file.originalname}:`, fileError.message);
        
        // Clean up file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        results.push({
          fileName: file.originalname,
          status: 'failed',
          error: fileError.message
        });
      }
    }
    
    console.log(`✅ Batch processing complete: ${totalInvoices} total invoices`);
    
    res.json({
      success: true,
      batchId,
      filesProcessed: req.files.length,
      totalInvoices,
      totalSuspicious,
      overallRisk: totalInvoices > 0 ? (totalSuspicious / totalInvoices * 100).toFixed(1) : 0,
      results,
      message: `Batch processing complete: ${req.files.length} files, ${totalInvoices} invoices analyzed`
    });
    
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ 
      error: 'Batch processing failed', 
      details: error.message 
    });
  }
};
