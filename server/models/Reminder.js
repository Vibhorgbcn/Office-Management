const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  reminderType: {
    type: String,
    enum: ['court-hearing', 'task-deadline', 'bill-due', 'client-follow-up', 'case-action', 'document-submission', 'other'],
    required: true
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
  dueDate: {
    type: Date,
    required: true
  },
  relatedType: {
    type: String,
    enum: ['case', 'task', 'invoice', 'client', 'hearing', 'document'],
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'snoozed'],
    default: 'pending'
  },
  notifiedAt: {
    type: Date
  },
  snoozedUntil: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

reminderSchema.index({ userId: 1, dueDate: 1 });
reminderSchema.index({ status: 1, dueDate: 1 });
reminderSchema.index({ relatedType: 1, relatedId: 1 });
reminderSchema.index({ reminderType: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);


