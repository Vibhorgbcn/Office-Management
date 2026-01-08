const mongoose = require('mongoose');

const legalNoticeSchema = new mongoose.Schema({
  noticeNumber: {
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
  noticeType: {
    type: String,
    enum: ['demand', 'legal', 'recovery', 'termination', 'breach', 'other'],
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
  recipient: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    email: String,
    phone: String
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'delivered', 'acknowledged', 'responded', 'escalated', 'closed'],
    default: 'draft'
  },
  sentDate: Date,
  deliveryDate: Date,
  responseDate: Date,
  response: {
    type: String,
    trim: true
  },
  recoveryWorkflow: {
    stage: {
      type: String,
      enum: ['notice', 'reminder', 'legal-action', 'litigation', 'recovery', 'closed'],
      default: 'notice'
    },
    nextAction: String,
    nextActionDate: Date,
    actions: [{
      action: String,
      date: Date,
      outcome: String,
      notes: String
    }]
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  tracking: {
    sentVia: { type: String, enum: ['email', 'post', 'courier', 'hand-delivery'], default: 'email' },
    trackingNumber: String,
    deliveryProof: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

legalNoticeSchema.index({ noticeNumber: 1 });
legalNoticeSchema.index({ clientId: 1 });
legalNoticeSchema.index({ status: 1 });
legalNoticeSchema.index({ 'recoveryWorkflow.stage': 1 });

module.exports = mongoose.model('LegalNotice', legalNoticeSchema);

