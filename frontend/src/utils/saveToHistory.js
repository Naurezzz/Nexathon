import axios from '../config/axios'; // Use your configured axios

export const saveToHistory = async (analysisType, result, metadata = {}) => {
  try {
    // Build summary based on type
    const summary = buildSummary(analysisType, result);

    // axios interceptor will add auth token automatically
    await axios.post('/api/history', {
      analysisType,
      result,
      summary,
      metadata,
      status: 'completed'
    });

    console.log('✅ Saved to history:', analysisType);
    
  } catch (error) {
    console.error('❌ History save failed:', error.message);
    // Silently fail - don't break the user experience
  }
};

function buildSummary(type, result) {
  switch(type) {
    case 'invoice-fraud':
      return {
        total: result.summary?.total_invoices || 1,
        suspicious: result.summary?.suspicious_count || 0,
        risk: result.summary?.overall_risk_score || 0
      };
      
    case 'document-validator':
      return {
        verdict: result.verdict,
        confidence: result.authenticity_score,
        type: result.document_type
      };
      
    case 'financial-risk':
      return {
        category: result.risk_category,
        score: result.risk_score,
        confidence: result.confidence
      };
      
    case 'cybersecurity':
      return {
        prediction: result.prediction,
        risk: result.risk_score
      };
      
    case 'compliance':
      return {
        total: result.summary?.total_clauses_checked,
        passed: result.summary?.clauses_found,
        score: result.summary?.compliance_score
      };
      
    default:
      return { status: 'completed' };
  }
}
