import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import uploadRoutes from './routes/uploadRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import nationalRoutes from './routes/nationalRoutes.js';
import documentValidationRoutes from './routes/documentValidationRoutes.js';
import financialRiskRoutes from './routes/financialRiskRoutes.js';
import cybersecurityRoutes from './routes/cybersecurityRoutes.js';
import aiMentorRoutes from './routes/aiMentorRoutes.js'; // NEW
import historyRoutes from './routes/historyRoutes.js'; // Add import

// Import health check services
import { healthCheckFraudService } from './services/mlProxy.js';
import { healthCheckComplianceService } from './services/complianceProxy.js';
import { initializeRAG } from './controllers/aiMentorController.js'; // NEW

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'AEGIS-AI Backend', 
    status: 'operational',
    version: '2.0.0',
    modules: [
      'fraud-detection',
      'compliance-auditing',
      'document-validation',
      'financial-risk-analysis',
      'cybersecurity-scanning',
      'ai-mentor-hub', // NEW
      'national-dashboard'
    ]
  });
});

// Health check for AI Mentor service
async function healthCheckAIMentorService() {
  try {
    // Check if RAG is initialized
    const ragStatus = await initializeRAG();
    return { 
      status: 'healthy', 
      service: 'ai-mentor',
      rag_initialized: true
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      service: 'ai-mentor',
      error: error.message 
    };
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check all ML services
    const [fraudHealth, complianceHealth, aiMentorHealth] = await Promise.all([
      healthCheckFraudService().catch(err => ({ status: 'unhealthy', error: err.message })),
      healthCheckComplianceService().catch(err => ({ status: 'unhealthy', error: err.message })),
      healthCheckAIMentorService().catch(err => ({ status: 'unhealthy', error: err.message }))
    ]);
    
    res.json({
      status: 'healthy',
      database: dbStatus,
      services: {
        fraudDetection: fraudHealth,
        complianceAuditing: complianceHealth,
        financialRisk: { status: 'healthy', port: 8006 },
        cybersecurity: { status: 'healthy', port: 8007 },
        documentValidator: { status: 'healthy', port: 8003 },
        aiMentor: aiMentorHealth // NEW
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Register routes
app.use('/api/upload', uploadRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/national', nationalRoutes);
app.use('/api/document-validation', documentValidationRoutes);

// AI Agent routes
app.use('/api/financial-risk', financialRiskRoutes);
app.use('/api/cybersecurity', cybersecurityRoutes);
app.use('/api/ai-mentor', aiMentorRoutes); // NEW

//history routes
app.use('/api/history', historyRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
  console.log('🔄 Attempting MongoDB connection...');
  
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
    .then(async () => {
      console.log('✅ MongoDB connected');
      
      // Initialize AI Mentor RAG knowledge base
      console.log('🤖 Initializing AI Mentor RAG...');
      try {
        await initializeRAG();
        console.log('✅ AI Mentor RAG initialized');
      } catch (error) {
        console.error('⚠️ AI Mentor RAG initialization failed:', error.message);
        console.log('   AI Mentor will still work but without knowledge base');
      }
      
      app.listen(PORT, '0.0.0.0', () => {
        console.log('='.repeat(70));
        console.log('🚀 AEGIS-AI Backend Server Started');
        console.log('='.repeat(70));
        console.log(`   Port: ${PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Health check: http://localhost:${PORT}/health`);
        console.log('\n📡 ML Services:');
        console.log('   • Invoice Fraud Detection (Port 8001)');
        console.log('   • Compliance Auditing (Port 8002)');
        console.log('   • Document Validator (Port 8003)');
        console.log('   • Financial Risk Agent (Port 8006)');
        console.log('   • Cybersecurity Agent (Port 8007)');
        console.log('\n🤖 AI Services:');
        console.log('   • AI Mentor Hub (Integrated)');
        console.log('   • RAG Knowledge Base (Ready)');
        console.log('='.repeat(70));
      });
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('⏳ Retrying in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
connectWithRetry();

export default app;
