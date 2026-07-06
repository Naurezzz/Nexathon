import express from 'express';
import AnalysisHistory from '../models/AnalysisHistory.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Get all analysis history for current user
router.get('/', async (req, res) => {
  try {
    const { analysisType, limit = 50, skip = 0 } = req.query;
    
    const query = { userId: req.user.id };
    
    if (analysisType) {
      query.analysisType = analysisType;
    }

    const history = await AnalysisHistory
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AnalysisHistory.countDocuments(query);

    res.json({
      success: true,
      history,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
});

// Get single analysis by ID
router.get('/:id', async (req, res) => {
  try {
    const analysis = await AnalysisHistory.findOne({
      _id: req.params.id,
      userId: req.user.id
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
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis'
    });
  }
});

// Save new analysis
router.post('/', async (req, res) => {
  try {
    const { analysisType, result, summary, metadata, tags } = req.body;

    const analysis = await AnalysisHistory.create({
      userId: req.user.id,
      analysisType,
      result,
      summary,
      metadata: {
        ...metadata,
        ipAddress: req.ip
      },
      tags: tags || []
    });

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save analysis'
    });
  }
});

// Delete analysis
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await AnalysisHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis'
    });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await AnalysisHistory.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$analysisType',
          count: { $sum: 1 },
          lastAnalysis: { $max: '$createdAt' }
        }
      }
    ]);

    const total = await AnalysisHistory.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      stats: {
        total,
        byType: stats
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
