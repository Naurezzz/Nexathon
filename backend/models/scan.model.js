const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanType: {
      type: String,
      enum: ['fraud', 'compliance', 'document', 'reconciliation', 'bankruptcy'],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileHash: {
      type: String, // For blockchain verification
    },
    inputData: {
      type: mongoose.Schema.Types.Mixed, // Flexible for different scan types
    },
    result: {
      score: Number,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      flags: [String],
      explanation: String,
      topFeatures: [
        {
          feature: String,
          value: mongoose.Schema.Types.Mixed,
          importance: Number,
        }
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'confirmed', 'false_positive'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    blockchainTxHash: String, // Transaction hash on blockchain
  },
  { 
    timestamps: true,
    collection: 'scans'
  }
);

// Indexes
scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ scanType: 1 });
scanSchema.index({ status: 1 });

module.exports = mongoose.model('Scan', scanSchema);
