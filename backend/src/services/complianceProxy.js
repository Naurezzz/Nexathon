import axios from 'axios';

const COMPLIANCE_SERVICE_URL = process.env.COMPLIANCE_SERVICE_URL || 'http://localhost:8002';

export const callComplianceService = async (documentText, documentId) => {
  try {
    const response = await axios.post(`${COMPLIANCE_SERVICE_URL}/check`, {
      document_id: documentId,
      document_text: documentText
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response.data;
  } catch (error) {
    console.error('Compliance service error:', error.message);
    throw new Error(`Compliance service unavailable: ${error.message}`);
  }
};

export const callBatchComplianceService = async (documents) => {
  try {
    const response = await axios.post(`${COMPLIANCE_SERVICE_URL}/check-batch`, {
      documents: documents
    }, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response.data;
  } catch (error) {
    console.error('Batch compliance service error:', error.message);
    throw new Error(`Batch compliance service unavailable: ${error.message}`);
  }
};

export const healthCheckComplianceService = async () => {
  try {
    const response = await axios.get(`${COMPLIANCE_SERVICE_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};
