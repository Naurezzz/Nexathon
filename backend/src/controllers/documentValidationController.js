import multer from 'multer';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import DocumentValidation from '../models/DocumentValidation.js';

const DOCUMENT_AI_SERVICE = 'http://localhost:8004';

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents/';
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
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are supported.'));
  }
};

export const uploadDocument = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const validateDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    const companyId = req.body.companyId || userId;
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const validationId = uuidv4();
    
    console.log(`🔍 Validating document: ${fileName} for user: ${userId}`);
    
    try {
      // Prepare form data for Python service
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      // Add user-provided data for consistency checking
      if (req.body.userName) {
        formData.append('user_name', req.body.userName);
      }
      if (req.body.idNumber) {
        formData.append('user_id_number', req.body.idNumber);
      }
      if (req.body.expectedDocType) {
        formData.append('expected_doc_type', req.body.expectedDocType);
      }
      
      // Call Python ML service
      console.log('🤖 Calling Document AI service...');
      const response = await axios.post(
        `${DOCUMENT_AI_SERVICE}/validate-document`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      const validationResult = response.data;
      
      if (!validationResult.success) {
        throw new Error(validationResult.message || 'Validation failed');
      }
      
      console.log(`✅ Document validated: ${validationResult.status} (Score: ${validationResult.authenticityScore}%)`);
      
      // Save to database
      const documentValidation = new DocumentValidation({
        validationId,
        userId,
        companyId,
        documentHash: validationResult.documentHash,
        fileName,
        fileType: req.file.mimetype,
        documentType: validationResult.documentType,
        status: validationResult.status,
        authenticityScore: validationResult.authenticityScore,
        riskLevel: validationResult.riskLevel,
        extractedData: {
          name: validationResult.extractedData.name,
          idNumber: validationResult.extractedData.idNumber,
          textLength: validationResult.extractedData.textLength,
          fullText: validationResult.extractedData.text
        },
        validation: validationResult.validation,
        consistency: validationResult.consistency,
        checks: validationResult.checks,
        remarks: validationResult.remarks,
        userProvidedData: {
          name: req.body.userName,
          idNumber: req.body.idNumber,
          documentType: req.body.expectedDocType
        }
      });
      
      await documentValidation.save();
      console.log(`✅ Saved validation to database with ID: ${validationId}`);
      
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      // Return response
      res.json({
        success: true,
        validationId,
        fileName,
        ...validationResult,
        message: 'Document validation completed successfully'
      });
      
    } catch (error) {
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Document validation error:', error);
    res.status(500).json({ 
      error: 'Document validation failed', 
      details: error.message 
    });
  }
};

export const getValidationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, riskLevel, status } = req.query;
    
    const query = { userId };
    
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }
    if (status) {
      query.status = status;
    }
    
    const validations = await DocumentValidation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-extractedData.fullText'); // Don't send full text
    
    const total = await DocumentValidation.countDocuments(query);
    
    res.json({
      validations,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Get validation history error:', error);
    res.status(500).json({ error: 'Failed to retrieve validation history' });
  }
};

export const getValidationDetails = async (req, res) => {
  try {
    const { validationId } = req.params;
    const userId = req.user.id;
    
    const validation = await DocumentValidation.findOne({ validationId, userId });
    
    if (!validation) {
      return res.status(404).json({ error: 'Validation not found' });
    }
    
    res.json(validation);
    
  } catch (error) {
    console.error('Get validation details error:', error);
    res.status(500).json({ error: 'Failed to retrieve validation details' });
  }
};

export const getValidationStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await DocumentValidation.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalValidations: { $sum: 1 },
          validDocuments: {
            $sum: { $cond: [{ $eq: ['$status', 'Valid'] }, 1, 0] }
          },
          suspiciousDocuments: {
            $sum: { $cond: [{ $in: ['$status', ['Suspicious', 'Invalid']] }, 1, 0] }
          },
          averageScore: { $avg: '$authenticityScore' },
          highRisk: {
            $sum: { $cond: [{ $in: ['$riskLevel', ['High', 'Critical']] }, 1, 0] }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalValidations: 0,
      validDocuments: 0,
      suspiciousDocuments: 0,
      averageScore: 0,
      highRisk: 0
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Get validation statistics error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
};

// Government access - view all validations
export const getAllValidations = async (req, res) => {
  try {
    if (!req.user.isGovernment && !req.user.isAdmin) {
      return res.status(403).json({ 
        error: 'Unauthorized', 
        message: 'This endpoint is restricted to government officials' 
      });
    }
    
    const { limit = 50, offset = 0, riskLevel, status } = req.query;
    
    const query = {};
    
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }
    if (status) {
      query.status = status;
    }
    
    const validations = await DocumentValidation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-extractedData.fullText');
    
    const total = await DocumentValidation.countDocuments(query);
    
    const riskStats = await DocumentValidation.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
          avgScore: { $avg: '$authenticityScore' }
        }
      }
    ]);
    
    res.json({
      validations,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      riskStatistics: riskStats
    });
    
  } catch (error) {
    console.error('Get all validations error:', error);
    res.status(500).json({ error: 'Failed to retrieve validations' });
  }
};
