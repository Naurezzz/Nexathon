import axios from 'axios';

const FRAUD_SERVICE_URL = process.env.FRAUD_SERVICE_URL || 'http://localhost:8001';

export const callFraudService = async (uploadId, companyId, invoiceRows) => {
  try {
    console.log('📞 Calling fraud detection service...');
    console.log(`   URL: ${FRAUD_SERVICE_URL}/predict`);
    console.log(`   Upload ID: ${uploadId}`);
    console.log(`   Company ID: ${companyId}`);
    console.log(`   Invoices: ${invoiceRows.length}`);
    
    // Log first invoice for debugging
    if (invoiceRows.length > 0) {
      console.log(`   Sample invoice:`, JSON.stringify(invoiceRows[0], null, 2));
    }

    const response = await axios.post(
      `${FRAUD_SERVICE_URL}/predict`, 
      {
        upload_id: uploadId,
        company_id: companyId,
        rows: invoiceRows
      }, 
      {
        timeout: 120000, // ✅ INCREASED: 120 seconds (2 minutes)
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('✅ Fraud service response received');
    console.log(`   Status: ${response.status}`);
    console.log(`   Predictions: ${response.data.predictions?.length || 0}`);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Fraud service error:', error.message);
    
    // Detailed error logging
    if (error.response) {
      // Server responded with error status
      console.error('   Response error:');
      console.error(`     Status: ${error.response.status}`);
      console.error(`     Data:`, JSON.stringify(error.response.data, null, 2));
      
      throw new Error(
        `Fraud service error (${error.response.status}): ${
          error.response.data?.detail || error.response.data?.error || error.message
        }`
      );
      
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      console.error('   ⏱️  Request timeout (120s exceeded)');
      console.error('   Possible causes:');
      console.error('     - GSTIN API verification is slow');
      console.error('     - ML model processing is taking too long');
      console.error('     - Network connectivity issues');
      console.error('   Suggestion: Check Python service logs');
      
      throw new Error(
        'Fraud service timeout: Request took longer than 2 minutes. ' +
        'This may be due to slow GSTIN verification. Check Python service logs.'
      );
      
    } else if (error.code === 'ECONNREFUSED') {
      // Service not running
      console.error('   🔌 Connection refused - ML service not running');
      console.error(`   Expected service at: ${FRAUD_SERVICE_URL}`);
      console.error('   Start service: python ml-services/fraud-service/serve.py');
      
      throw new Error(
        'Fraud service unavailable: ML service is not running on port 8001. ' +
        'Please start the Python fraud detection service.'
      );
      
    } else if (error.code === 'ETIMEDOUT') {
      // Connection timeout
      console.error('   ⏱️  Connection timeout');
      console.error('   Network or service issue');
      
      throw new Error('Fraud service timeout: Could not connect to ML service');
      
    } else {
      // Other errors
      console.error('   Unexpected error:', error.code || 'UNKNOWN');
      console.error('   Stack:', error.stack);
      
      throw new Error(`Fraud service unavailable: ${error.message}`);
    }
  }
};

export const healthCheckFraudService = async () => {
  try {
    console.log('🏥 Health check: Fraud service');
    const response = await axios.get(`${FRAUD_SERVICE_URL}/health`, { 
      timeout: 5000 
    });
    
    console.log('✅ Fraud service healthy');
    return response.data;
    
  } catch (error) {
    console.error('❌ Fraud service unhealthy:', error.message);
    return { 
      status: 'unhealthy', 
      error: error.message,
      code: error.code
    };
  }
};
