const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    default: null
  },
  documentType: {
    type: String,
    enum: ['FIR', 'Charge Sheet', 'Court Order', 'Petition', 'Evidence', 'Contract', 'Bail Application', 'Other'],
    default: 'Other'
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number // in bytes
  },
  mimeType: {
    type: String
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  description: {
    type: String
  },
  isConfidential: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
documentSchema.index({ caseId: 1 });
documentSchema.index({ clientId: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Document', documentSchema);

