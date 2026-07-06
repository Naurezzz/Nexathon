import express from 'express';
import { getNationalStatistics } from '../controllers/nationalController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/statistics', authenticateUser, getNationalStatistics);

export default router;
