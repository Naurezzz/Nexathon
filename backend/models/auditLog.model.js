const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['upload', 'scan', 'review', 'confirm', 'flag_false_positive', 'report_download'],
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    blockchainTxHash: String,
  },
  { 
    timestamps: true,
    collection: 'auditLogs'
  }
);

auditLogSchema.index({ scanId: 1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
