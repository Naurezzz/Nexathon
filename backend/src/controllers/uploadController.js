import Upload from '../models/Upload.js';
import FraudResult from '../models/FraudResult.js';
import { callFraudService } from '../services/mlProxy.js';
import { v4 as uuidv4 } from 'uuid';

export const uploadAndAnalyze = async (req, res) => {
  try {
    const { companyId, invoices } = req.body;
    const userId = req.user.id;
    
    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ error: 'Invalid invoice data' });
    }
    
    const uploadId = uuidv4();
    const upload = new Upload({
      userId,
      companyId: companyId || userId,
      uploadId,
      fileName: `manual_upload_${Date.now()}.json`,
      fileType: 'invoice',
      status: 'processing',
      rowCount: invoices.length
    });
    
    await upload.save();
    
    console.log(`📤 Processing ${invoices.length} invoices for upload ${uploadId}`);
    
    try {
      const fraudResults = await callFraudService(uploadId, companyId || userId, invoices);
      
      // Save fraud results with userId for graph queries
      const fraudRecord = new FraudResult({
        uploadId,
        userId,  // CRITICAL: Added this
        companyId: companyId || userId,
        summary: fraudResults.summary,
        predictions: fraudResults.predictions
      });
      
      await fraudRecord.save();
      console.log(`✅ Saved fraud results to database with userId: ${userId}`);
      
      upload.status = 'completed';
      upload.result = {
        summary: fraudResults.summary,
        timestamp: fraudResults.timestamp
      };
      upload.updatedAt = new Date();
      await upload.save();
      
      console.log(`✅ Analysis complete for upload ${uploadId}`);
      
      res.json({
        success: true,
        uploadId,
        summary: fraudResults.summary,
        predictions: fraudResults.predictions,
        message: 'Analysis completed successfully'
      });
      
    } catch (mlError) {
      upload.status = 'failed';
      upload.result = { error: mlError.message };
      await upload.save();
      throw mlError;
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message 
    });
  }
};

export const getUploadStatus = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user.id;
    
    const upload = await Upload.findOne({ uploadId, userId });
    
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    
    let fraudResult = null;
    if (upload.status === 'completed') {
      fraudResult = await FraudResult.findOne({ uploadId, userId });
    }
    
    res.json({
      uploadId: upload.uploadId,
      status: upload.status,
      fileName: upload.fileName,
      rowCount: upload.rowCount,
      result: upload.result,
      fraudAnalysis: fraudResult,
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt
    });
    
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to retrieve upload status' });
  }
};

export const getUserUploads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    
    const uploads = await Upload.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Upload.countDocuments({ userId });
    
    res.json({
      uploads,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({ error: 'Failed to retrieve uploads' });
  }
};

export const getGraphData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 100, mode = 'private' } = req.query;
    
    console.log(`📊 Fetching graph data for user: ${userId}, mode: ${mode}`);
    
    let query = {};
    
    // MODE 1: Private - Only show data for THIS company
    if (mode === 'private') {
      query = { userId: userId };
      console.log('🔒 Private mode: Showing only your company data');
    }
    
    // MODE 2: National - Show ALL data (anonymized) - ONLY for admin/government users
    else if (mode === 'national') {
      // Check if user has admin privileges
      if (!req.user.isAdmin && !req.user.isGovernment) {
        return res.status(403).json({
          error: 'Unauthorized',
          message: 'National view is restricted to government officials only'
        });
      }
      
      query = {}; // Get all data from all companies
      console.log('🌐 National mode: Showing anonymized cross-company data');
    }
    
    // Get fraud results based on mode
    const fraudResults = await FraudResult.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    console.log(`📦 Found ${fraudResults.length} fraud result documents`);
    
    if (fraudResults.length === 0) {
      return res.json({
        invoices: [],
        message: 'No fraud analysis data found. Please analyze some invoices first.',
        hasData: false
      });
    }
    
    // Extract invoices
    const invoices = [];
    const companyMap = new Map(); // Track unique companies for anonymization
    
    fraudResults.forEach(result => {
      if (result.predictions && Array.isArray(result.predictions)) {
        // Anonymize company ID in national mode
        let companyId = result.companyId || result.userId;
        
        if (mode === 'national') {
          // Map real company ID to anonymous ID (Company A, Company B, etc.)
          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, `COMPANY_${String.fromCharCode(65 + companyMap.size)}`);
          }
          companyId = companyMap.get(companyId);
        }
        
        result.predictions.forEach(pred => {
          invoices.push({
            invoice_no: pred.invoice_no || 'UNKNOWN',
            vendor: pred.vendor || 'Unknown Vendor',
            company_id: companyId,
            total_amount: pred.amount || 0,
            fraud_score: pred.fraud_score || 0,
            timestamp: result.timestamp
          });
        });
      }
    });
    
    console.log(`✅ Retrieved ${invoices.length} invoices from ${fraudResults.length} analysis sessions`);
    console.log(`📊 Mode: ${mode}, Companies: ${mode === 'national' ? companyMap.size : 1}`);
    
    res.json({
      invoices,
      total: invoices.length,
      hasData: invoices.length > 0,
      mode: mode,
      companiesInvolved: mode === 'national' ? companyMap.size : 1,
      message: `Found ${invoices.length} invoices for network analysis`
    });
    
  } catch (error) {
    console.error('❌ Get graph data error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve graph data',
      details: error.message 
    });
  }
};

export const testUploadNoAuth = async (req, res) => {
  try {
    const { companyId, invoices } = req.body;
    
    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ error: 'Invalid invoice data' });
    }
    
    console.log(`📤 TEST: Processing ${invoices.length} invoices`);
    
    const uploadId = uuidv4();
    const fraudResults = await callFraudService(uploadId, companyId || 'test', invoices);
    
    console.log(`✅ TEST: Analysis complete`);
    
    res.json({
      success: true,
      uploadId,
      summary: fraudResults.summary,
      predictions: fraudResults.predictions,
      message: 'Test analysis completed successfully'
    });
    
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message 
    });
  }
};
