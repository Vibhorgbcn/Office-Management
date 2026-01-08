const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  contractType: {
    type: String,
    enum: ['service-agreement', 'retainer', 'consultation', 'partnership', 'employment', 'nda', 'other'],
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  templateId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending-review', 'under-review', 'approved', 'rejected', 'signed', 'expired', 'terminated'],
    default: 'draft'
  },
  content: {
    type: String,
    required: true
  },
  terms: {
    startDate: Date,
    endDate: Date,
    renewalDate: Date,
    autoRenew: { type: Boolean, default: false },
    paymentTerms: String,
    amount: Number,
    currency: { type: String, default: 'INR' }
  },
  approvalWorkflow: [{
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comments: String,
    approvedAt: Date
  }],
  signatories: [{
    name: String,
    email: String,
    role: String,
    signed: { type: Boolean, default: false },
    signedAt: Date,
    signatureUrl: String
  }],
  eStampDetails: {
    stampNumber: String,
    stampAmount: Number,
    stampedAt: Date
  },
  riskAnalysis: {
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    flaggedClauses: [String],
    aiAnalysis: String
  },
  documents: [{
    name: String,
    url: String,
    version: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: [{
    content: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

contractSchema.index({ contractNumber: 1 });
contractSchema.index({ clientId: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ 'terms.endDate': 1 });

module.exports = mongoose.model('Contract', contractSchema);

