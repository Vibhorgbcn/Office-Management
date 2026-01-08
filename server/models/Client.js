const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  clientType: {
    type: String,
    enum: ['regular', 'known', 'government', 'corporate', 'pro-bono'],
    default: 'regular'
  },
  pan: {
    type: String,
    trim: true,
    uppercase: true
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true
  },
  organizationName: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect'],
    default: 'active'
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
clientSchema.index({ name: 1, phone: 1 });
clientSchema.index({ clientType: 1 });

module.exports = mongoose.model('Client', clientSchema);

