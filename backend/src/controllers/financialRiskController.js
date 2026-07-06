import axios from 'axios';
import FinancialRiskAnalysis from '../models/FinancialRiskAnalysis.js';
import FormData from 'form-data';

const FINANCIAL_RISK_API = process.env.FINANCIAL_RISK_API || 'http://localhost:8006';

export const analyzeFinancialRisk = async (req, res) => {
  try {
    console.log('📊 Financial risk analysis request received');
    
    const userId = req.user.id;
    const financialData = req.body;
    
    // Call ML service
    const response = await axios.post(`${FINANCIAL_RISK_API}/predict`, financialData);
    
    const analysis = response.data;
    
    // Save to database
    const savedAnalysis = await FinancialRiskAnalysis.create({
      userId,
      companyData: financialData,
      riskScore: analysis.risk_score,
      riskCategory: analysis.risk_category,
      confidence: analysis.confidence,
      topFactors: analysis.top_factors,
      recommendations: analysis.recommendations,
      timestamp: new Date(analysis.timestamp)
    });
    
    console.log('✅ Analysis saved to database');
    
    res.json({
      success: true,
      analysis: {
        id: savedAnalysis._id,
        ...analysis
      }
    });
    
  } catch (error) {
    console.error('❌ Financial risk analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Financial risk analysis failed',
      details: error.message
    });
  }
};

export const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;
    
    const analyses = await FinancialRiskAnalysis.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await FinancialRiskAnalysis.countDocuments({ userId });
    
    res.json({
      success: true,
      analyses,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
    
  } catch (error) {
    console.error('❌ Get history error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis history'
    });
  }
};

export const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const analysis = await FinancialRiskAnalysis.findOne({
      _id: id,
      userId
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }
    
    res.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Get analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis'
    });
  }
};

export const analyzeFromFile = async (req, res) => {
  try {
    console.log('📄 File upload received:', req.file?.originalname);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Please upload CSV or Excel file.'
      });
    }

    // Create form data for ML service
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    console.log('📤 Forwarding to ML service...');

    // Forward to ML service
    const response = await axios.post(
      `${FINANCIAL_RISK_API}/predict/file`,
      form,
      { 
        headers: {
          ...form.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    console.log('✅ ML service responded:', response.data.risk_category);

    // Save to database
    const savedAnalysis = await FinancialRiskAnalysis.create({
      userId: req.user.id,
      companyData: { source: 'file_upload', filename: req.file.originalname },
      riskScore: response.data.risk_score,
      riskCategory: response.data.risk_category,
      confidence: response.data.confidence,
      topFactors: response.data.top_factors,
      recommendations: response.data.recommendations,
      timestamp: new Date(response.data.timestamp)
    });

    res.json({
      success: true,
      analysis: {
        id: savedAnalysis._id,
        ...response.data
      }
    });

  } catch (error) {
    console.error('❌ File analysis error:', error.message);
    
    // Check if it's an ML service error
    if (error.response) {
      return res.status(500).json({
        success: false,
        error: error.response.data.detail || 'ML service error',
        details: error.response.data
      });
    }

    res.status(500).json({
      success: false,
      error: 'File analysis failed: ' + error.message
    });
  }
};
