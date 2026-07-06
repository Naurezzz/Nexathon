import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseDocument, normalizeInvoiceData } from '../services/documentParser.js';
import Upload from '../models/Upload.js';
import FraudResult from '../models/FraudResult.js';
import { callFraudService } from '../services/mlProxy.js';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for CSV/Excel uploads (disk storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
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

// Configure multer for PDF uploads (memory storage)
const memoryStorage = multer.memoryStorage();

// File filter for CSV/Excel
const csvExcelFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ CSV/Excel file accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ Invalid file type for CSV/Excel:', file.mimetype);
    cb(new Error('Invalid file type. Only CSV and Excel files are supported currently.'));
  }
};

// File filter for PDFs
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    console.log('✅ PDF file accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ Invalid file type for PDF:', file.mimetype);
    cb(new Error('Only PDF files are supported for this endpoint.'));
  }
};

// ✅ Export CSV/Excel upload (existing functionality)
export const upload = multer({ 
  storage, 
  fileFilter: csvExcelFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ✅ Export PDF upload (new functionality)
export const pdfUpload = multer({ 
  storage: memoryStorage, 
  fileFilter: pdfFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ✅ CSV/Excel upload handler (existing functionality - unchanged)
export const uploadAndAnalyzeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    const companyId = req.body.companyId || userId;
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const uploadId = uuidv4();
    
    console.log(`📁 Processing file: ${fileName} for user: ${userId}`);
    
    // Create upload record
    const uploadRecord = new Upload({
      userId,
      companyId,
      uploadId,
      fileName,
      fileType: 'invoice',
      status: 'processing',
      rowCount: 0
    });
    
    await uploadRecord.save();
    
    try {
      // Parse document
      console.log(`📊 Parsing document...`);
      const rawData = await parseDocument(filePath, req.file.mimetype);
      
      // Normalize to invoice format
      const invoices = normalizeInvoiceData(rawData);
      
      if (invoices.length === 0) {
        throw new Error('No valid invoice data found in document');
      }
      
      console.log(`✅ Extracted ${invoices.length} invoices`);
      
      // Update upload
      uploadRecord.rowCount = invoices.length;
      await uploadRecord.save();
      
      // Call ML service
      console.log(`🤖 Analyzing with ML...`);
      const fraudResults = await callFraudService(uploadId, companyId, invoices);
      
      // Save fraud results with userId
      const fraudRecord = new FraudResult({
        uploadId,
        userId,
        companyId,
        summary: fraudResults.summary,
        predictions: fraudResults.predictions
      });
      
      await fraudRecord.save();
      console.log(`✅ Saved fraud results to database with userId: ${userId}`);
      
      // Update upload status
      uploadRecord.status = 'completed';
      uploadRecord.result = {
        summary: fraudResults.summary,
        timestamp: fraudResults.timestamp
      };
      uploadRecord.updatedAt = new Date();
      await uploadRecord.save();
      
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      console.log(`✅ File analysis complete for ${fileName}`);
      
      res.json({
        success: true,
        uploadId,
        fileName,
        invoicesProcessed: invoices.length,
        summary: fraudResults.summary,
        predictions: fraudResults.predictions,
        message: 'File processed successfully'
      });
      
    } catch (error) {
      uploadRecord.status = 'failed';
      uploadRecord.result = { error: error.message };
      await uploadRecord.save();
      
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'File processing failed', 
      details: error.message 
    });
  }
};

// ✅ PDF upload handler (new functionality)
export const uploadAndAnalyzePDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }
    
    const userId = req.user.id;
    const companyId = req.body.companyId || userId;
    const fileName = req.file.originalname;
    const uploadId = uuidv4();
    
    console.log(`📄 Processing PDF: ${fileName} for user: ${userId}`);
    
    // Create upload record
    const uploadRecord = new Upload({
      userId,
      companyId,
      uploadId,
      fileName,
      fileType: 'pdf_invoice',
      status: 'processing',
      rowCount: 0
    });
    
    await uploadRecord.save();
    
    try {
      // Forward to Python ML service for OCR + fraud detection
      const FormData = (await import('form-data')).default;
      const axios = (await import('axios')).default;
      
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: fileName,
        contentType: 'application/pdf'
      });
      
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
      console.log(`   → Forwarding to ML service: ${mlServiceUrl}/extract-and-analyze`);
      
      const mlResponse = await axios.post(
        `${mlServiceUrl}/extract-and-analyze`,
        formData,
        {
          headers: formData.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 60000
        }
      );
      
      const result = mlResponse.data;
      
      if (!result.success) {
        throw new Error(result.error || 'PDF extraction failed');
      }
      
      console.log(`✅ PDF processed: extracted invoice data`);
      
      // Update upload record
      uploadRecord.rowCount = 1;
      await uploadRecord.save();
      
      const fraudAnalysis = result.fraud_analysis;
      
      // Save fraud results
      const fraudRecord = new FraudResult({
        uploadId,
        userId,
        companyId,
        summary: fraudAnalysis.summary,
        predictions: fraudAnalysis.predictions
      });
      
      await fraudRecord.save();
      console.log(`✅ Saved PDF fraud results to database with userId: ${userId}`);
      
      // Update upload status
      uploadRecord.status = 'completed';
      uploadRecord.result = {
        summary: fraudAnalysis.summary,
        timestamp: fraudAnalysis.timestamp,
        extractedData: result.extraction
      };
      uploadRecord.updatedAt = new Date();
      await uploadRecord.save();
      
      console.log(`✅ PDF analysis complete for ${fileName}`);
      
      res.json({
        success: true,
        uploadId,
        fileName,
        invoicesProcessed: 1,
        extractedData: result.extraction,
        summary: fraudAnalysis.summary,
        predictions: fraudAnalysis.predictions,
        model_version: fraudAnalysis.model_version,
        message: 'PDF invoice processed successfully'
      });
      
    } catch (error) {
      uploadRecord.status = 'failed';
      uploadRecord.result = { error: error.message };
      await uploadRecord.save();
      
      // Handle specific errors
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'ML service unavailable',
          details: 'The fraud detection service is not running. Please try again later.'
        });
      }
      
      if (error.response?.status === 400) {
        return res.status(400).json({
          error: 'Invalid PDF or extraction failed',
          details: error.response.data?.detail || 'Could not extract invoice data from PDF',
          suggestion: 'Please ensure the PDF contains a clear, readable invoice'
        });
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ 
      error: 'PDF processing failed', 
      details: error.message 
    });
  }
};

export default { 
  upload, 
  pdfUpload, 
  uploadAndAnalyzeFile, 
  uploadAndAnalyzePDF 
};
