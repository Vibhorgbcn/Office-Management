const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
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
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  expenseType: {
    type: String,
    enum: ['court-fee', 'travel', 'document', 'consultation', 'miscellaneous', 'other'],
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
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'cheque', 'bank-transfer', 'online', 'credit-card', 'other'],
    default: 'cash'
  },
  receipt: {
    name: String,
    url: String,
    uploadedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reimbursed'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: Date,
  reimbursedDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

expenseSchema.index({ caseId: 1 });
expenseSchema.index({ clientId: 1 });
expenseSchema.index({ expenseDate: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ expenseType: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

