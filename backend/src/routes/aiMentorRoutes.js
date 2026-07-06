import express from 'express';
import { explainAnalysis, chatWithMentor } from '../controllers/aiMentorController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Health check - PUBLIC
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-mentor',
    features: [
      'Analysis explanation',
      'Interactive chat',
      'RAG knowledge base',
      'Multi-agent support'
    ],
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint - PUBLIC (no auth required for demo)
router.post('/chat', chatWithMentor);

// Explain endpoint - Requires auth
router.post('/explain', authenticateUser, explainAnalysis);

export default router;
