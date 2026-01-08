const mongoose = require('mongoose');

const causelistSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  court: {
    type: String,
    required: true,
    trim: true
  },
  courtLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourtLocation',
    default: null
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  caseNumber: {
    type: String,
    required: true,
    trim: true
  },
  bench: {
    type: String,
    trim: true
  },
  courtRoom: {
    type: String,
    trim: true
  },
  itemNumber: {
    type: String,
    trim: true
  },
  advocateName: {
    type: String,
    trim: true
  },
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  purpose: {
    type: String,
    enum: ['hearing', 'arguments', 'judgment', 'appointment', 'other'],
    default: 'hearing'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'adjourned', 'cancelled'],
    default: 'scheduled'
  },
  outcome: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  notified: {
    type: Boolean,
    default: false
  },
  notifiedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

causelistSchema.index({ date: 1, court: 1 });
causelistSchema.index({ caseId: 1 });
causelistSchema.index({ advocateId: 1 });
causelistSchema.index({ status: 1 });

module.exports = mongoose.model('Causelist', causelistSchema);

