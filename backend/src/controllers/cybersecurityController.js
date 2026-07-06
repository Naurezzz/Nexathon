import axios from 'axios';
import URLSecurityCheck from '../models/URLSecurityCheck.js';

const CYBERSEC_API = process.env.CYBERSEC_API || 'http://localhost:8010';

export const checkURL = async (req, res) => {
  try {
    console.log('🛡️ URL security check request received');
    
    const userId = req.user.id;
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    // Call ML service
    const response = await axios.post(`${CYBERSEC_API}/check-url`, { url });
    
    const checkResult = response.data;
    
    // Save to database
    const savedCheck = await URLSecurityCheck.create({
      userId,
      url: checkResult.url,
      prediction: checkResult.prediction,
      confidence: checkResult.confidence,
      riskScore: checkResult.risk_score,
      indicators: checkResult.indicators,
      recommendation: checkResult.recommendation,
      timestamp: new Date(checkResult.timestamp)
    });
    
    console.log('✅ Check saved to database');
    
    res.json({
      success: true,
      check: {
        id: savedCheck._id,
        ...checkResult
      }
    });
    
  } catch (error) {
    console.error('❌ URL check error:', error.message);
    res.status(500).json({
      success: false,
      error: 'URL security check failed',
      details: error.message
    });
  }
};

export const checkBatchURLs = async (req, res) => {
  try {
    console.log('🛡️ Batch URL check request received');
    
    const userId = req.user.id;
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required'
      });
    }
    
    // Call ML service
    const response = await axios.post(`${CYBERSEC_API}/check-urls`, urls);
    
    const results = response.data.results;
    
    // Save all to database
    const savedChecks = await Promise.all(
      results.map(result => URLSecurityCheck.create({
        userId,
        url: result.url,
        prediction: result.prediction,
        confidence: result.confidence,
        riskScore: result.risk_score,
        indicators: result.indicators,
        recommendation: result.recommendation,
        timestamp: new Date(result.timestamp)
      }))
    );
    
    console.log(`✅ ${savedChecks.length} checks saved to database`);
    
    res.json({
      success: true,
      checks: results,
      total: savedChecks.length
    });
    
  } catch (error) {
    console.error('❌ Batch URL check error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Batch URL check failed',
      details: error.message
    });
  }
};

export const getCheckHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;
    
    const checks = await URLSecurityCheck.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await URLSecurityCheck.countDocuments({ userId });
    
    res.json({
      success: true,
      checks,
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
      error: 'Failed to fetch check history'
    });
  }
};

export const getCheckById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const check = await URLSecurityCheck.findOne({
      _id: id,
      userId
    });
    
    if (!check) {
      return res.status(404).json({
        success: false,
        error: 'Check not found'
      });
    }
    
    res.json({
      success: true,
      check
    });
    
  } catch (error) {
    console.error('❌ Get check error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch check'
    });
  }
};
