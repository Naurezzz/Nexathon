const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    supabaseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'auditor', 'admin'],
      default: 'user',
    },
    fullName: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { 
    timestamps: true,
    collection: 'users' // Explicit collection name (plural, lowercase)
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
