import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ComplianceCheck from '../models/ComplianceCheck.js';
import { callComplianceService } from '../services/complianceProxy.js';

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/compliance/';
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
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only TXT, PDF, DOC, and DOCX files are supported.'));
  }
};

export const uploadCompliance = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const parseComplianceDocument = async (filePath, mimetype) => {
  if (mimetype === 'text/plain') {
    console.log('📄 Reading plain text file...');
    const content = fs.readFileSync(filePath, 'utf-8');
    return [{ text: content, name: path.basename(filePath) }];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return [{ text: content, name: path.basename(filePath) }];
};

// Helper function to safely parse recommendations
const parseRecommendations = (recommendations) => {
  console.log('🔍 Parsing recommendations, type:', typeof recommendations);
  
  // If it's already an array of strings, return it
  if (Array.isArray(recommendations)) {
    if (recommendations.length === 0) return [];
    if (typeof recommendations[0] === 'string') return recommendations;
    
    // If array of objects, extract text
    return recommendations.map(r => {
      if (typeof r === 'string') return r;
      if (typeof r === 'object') {
        return r.recommendation || r.clause || r.text || JSON.stringify(r);
      }
      return String(r);
    });
  }
  
  // If it's a string, try to parse it
  if (typeof recommendations === 'string') {
    // Try to convert JavaScript object notation to JSON
    let jsonStr = recommendations
      .replace(/'/g, '"')  // Replace single quotes with double quotes
      .replace(/(\w+):/g, '"$1":')  // Add quotes around keys
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']');  // Remove trailing commas in arrays
    
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed.map(r => {
          if (typeof r === 'string') return r;
          if (typeof r === 'object') {
            return r.recommendation || r.clause || r.text || JSON.stringify(r);
          }
          return String(r);
        });
      }
      return [String(parsed)];
    } catch (e) {
      console.log('⚠️ Could not parse as JSON, treating as single string');
      // If it looks like an array string, try to extract text manually
      if (recommendations.includes('recommendation:')) {
        const matches = recommendations.match(/recommendation:\s*'([^']+)'/g);
        if (matches) {
          return matches.map(m => m.replace(/recommendation:\s*'([^']+)'/, '$1'));
        }
      }
      return [recommendations];
    }
  }
  
  // Fallback
  return [String(recommendations)];
};

export const uploadAndCheckCompliance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    const companyId = req.body.companyId || userId;
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    
    console.log(`📁 Processing compliance file: ${fileName}`);
    
    try {
      const documents = await parseComplianceDocument(filePath, req.file.mimetype);
      
      if (documents.length === 0) {
        throw new Error('No content extracted from document');
      }
      
      console.log(`✅ Extracted ${documents.length} document(s)`);
      
      const checkId = uuidv4();
      const documentId = `DOC_${Date.now()}`;
      const documentText = documents[0].text;
      
      if (documentText.length < 50) {
        throw new Error('Document text is too short. Minimum 50 characters required.');
      }
      
      console.log(`🤖 Analyzing compliance with ML...`);
      const complianceResult = await callComplianceService(documentText, documentId);
      
      // Parse recommendations safely
      const cleanRecommendations = parseRecommendations(complianceResult.recommendations || []);
      
      console.log(`✅ Parsed ${cleanRecommendations.length} recommendations`);
      
      // Save to database
      const complianceCheck = new ComplianceCheck({
        checkId,
        userId,
        companyId,
        documentId: complianceResult.document_id || documentId,
        documentName: fileName,
        documentType: req.body.documentType || 'contract',
        summary: complianceResult.summary || {
          compliance_score: 0,
          compliant_clauses: 0,
          non_compliant_clauses: 0,
          total_clauses: 0,
          risk_level: 'Unknown'
        },
        results: complianceResult.results || [],
        recommendations: cleanRecommendations,
        status: 'completed'
      });
      
      await complianceCheck.save();
      console.log(`✅ Saved compliance check to database with userId: ${userId}`);
      
      // Clean up file
      fs.unlinkSync(filePath);
      
      console.log(`✅ Compliance check complete for ${fileName}`);
      
      res.json({
        success: true,
        checkId,
        fileName,
        document_id: complianceResult.document_id,
        summary: complianceResult.summary,
        results: complianceResult.results,
        recommendations: cleanRecommendations,
        message: 'Compliance check completed successfully'
      });
      
    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Compliance file upload error:', error);
    res.status(500).json({ 
      error: 'Compliance check failed', 
      details: error.message 
    });
  }
};

export const getComplianceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    
    const checks = await ComplianceCheck.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await ComplianceCheck.countDocuments({ userId });
    
    res.json({
      checks,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Get compliance history error:', error);
    res.status(500).json({ error: 'Failed to retrieve compliance history' });
  }
};
