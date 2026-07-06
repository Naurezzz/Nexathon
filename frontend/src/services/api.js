import axios from '../config/axios'; // Use authenticated axios

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const analyzeFraud = async (invoices) => {
  try {
    const response = await axios.post(`${API_BASE}/api/upload/analyze`, {
      invoices,
      companyId: 'COMPANY_001' // Optional: can be dynamic
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.error || error.message || 'Analysis failed');
  }
};

export const analyzeFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE}/api/upload/analyze-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(error.response?.data?.error || error.message || 'File upload failed');
  }
};

export const analyzeBatch = async (files) => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await axios.post(`${API_BASE}/api/upload/analyze-batch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Batch upload error:', error);
    throw new Error(error.response?.data?.error || error.message || 'Batch upload failed');
  }
};

export const checkCompliance = async (contractText) => {
  try {
    const response = await axios.post(`${API_BASE}/api/compliance/check`, {
      documentText: contractText,
      documentName: 'Contract Document',
      documentType: 'contract'
    });
    return response.data;
  } catch (error) {
    console.error('Compliance check error:', error);
    throw new Error(error.response?.data?.error || error.message || 'Compliance check failed');
  }
};

export const checkComplianceFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', 'contract');
    
    const response = await axios.post(`${API_BASE}/api/compliance/check-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Compliance file upload error:', error);
    throw new Error(error.response?.data?.error || error.message || 'Compliance file check failed');
  }
};
