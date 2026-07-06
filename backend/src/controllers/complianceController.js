import ComplianceCheck from '../models/ComplianceCheck.js';
import { callComplianceService, callBatchComplianceService } from '../services/complianceProxy.js';
import { v4 as uuidv4 } from 'uuid';

// Helper function to safely parse recommendations (SAME AS FILE UPLOAD)
const parseRecommendations = (recommendations) => {
  console.log('🔍 Parsing recommendations, type:', typeof recommendations);
  
  if (Array.isArray(recommendations)) {
    if (recommendations.length === 0) return [];
    if (typeof recommendations[0] === 'string') return recommendations;
    
    return recommendations.map(r => {
      if (typeof r === 'string') return r;
      if (typeof r === 'object') {
        return r.recommendation || r.clause || r.text || JSON.stringify(r);
      }
      return String(r);
    });
  }
  
  if (typeof recommendations === 'string') {
    let jsonStr = recommendations
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');
    
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
      if (recommendations.includes('recommendation:')) {
        const matches = recommendations.match(/recommendation:\s*'([^']+)'/g);
        if (matches) {
          return matches.map(m => m.replace(/recommendation:\s*'([^']+)'/, '$1'));
        }
      }
      return [recommendations];
    }
  }
  
  return [String(recommendations)];
};

export const checkDocumentCompliance = async (req, res) => {
  try {
    const { documentText, documentName, documentType } = req.body;
    const userId = req.user.id;
    const companyId = req.body.companyId || userId;
    
    if (!documentText || documentText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'Document text is too short. Minimum 50 characters required.' 
      });
    }
    
    const checkId = uuidv4();
    const documentId = `DOC_${Date.now()}`;
    
    console.log(`📋 Checking compliance for: ${documentName || documentId}`);
    
    // Call ML compliance service
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
      documentName: documentName || 'Untitled Document',
      documentType: documentType || 'contract',
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
    
    console.log(`✅ Compliance check complete. Score: ${complianceResult.summary?.compliance_score || 0}%`);
    
    res.json({
      success: true,
      checkId,
      document_id: complianceResult.document_id,
      summary: complianceResult.summary,
      results: complianceResult.results,
      recommendations: cleanRecommendations,
      message: 'Compliance check completed successfully'
    });
    
  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({ 
      error: 'Compliance check failed', 
      details: error.message 
    });
  }
};

export const checkBatchCompliance = async (req, res) => {
  try {
    const { documents } = req.body;
    const userId = req.user.id;
    const companyId = req.body.companyId || userId;
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'No documents provided' });
    }
    
    console.log(`📋 Batch checking ${documents.length} documents for compliance`);
    
    const docsWithIds = documents.map((doc, idx) => ({
      document_id: doc.documentId || `DOC_${Date.now()}_${idx}`,
      document_text: doc.documentText,
      document_type: doc.documentType || 'contract'
    }));
    
    const batchResult = await callBatchComplianceService(docsWithIds);
    
    const savedChecks = [];
    for (let i = 0; i < batchResult.results.length; i++) {
      const result = batchResult.results[i];
      const originalDoc = documents[i];
      
      // Parse recommendations for each document
      const cleanRecommendations = parseRecommendations(result.recommendations || []);
      
      const checkId = uuidv4();
      const complianceCheck = new ComplianceCheck({
        checkId,
        userId,
        companyId,
        documentId: result.document_id,
        documentName: originalDoc.documentName || `Document ${i + 1}`,
        documentType: originalDoc.documentType || 'contract',
        summary: result.summary,
        results: result.results,
        recommendations: cleanRecommendations,
        status: 'completed'
      });
      
      await complianceCheck.save();
      savedChecks.push(checkId);
    }
    
    console.log(`✅ Batch compliance check complete for ${documents.length} documents`);
    
    res.json({
      success: true,
      checkIds: savedChecks,
      batchSummary: batchResult.batch_summary,
      results: batchResult.results,
      message: `Batch compliance check completed for ${documents.length} documents`
    });
    
  } catch (error) {
    console.error('Batch compliance error:', error);
    res.status(500).json({ 
      error: 'Batch compliance check failed', 
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

export const getComplianceCheck = async (req, res) => {
  try {
    const { checkId } = req.params;
    const userId = req.user.id;
    
    const check = await ComplianceCheck.findOne({ checkId, userId });
    
    if (!check) {
      return res.status(404).json({ error: 'Compliance check not found' });
    }
    
    res.json(check);
    
  } catch (error) {
    console.error('Get compliance check error:', error);
    res.status(500).json({ error: 'Failed to retrieve compliance check' });
  }
};
