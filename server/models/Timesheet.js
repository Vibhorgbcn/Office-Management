const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkAssignment'
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  durationHours: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  billable: {
    type: Boolean,
    default: true
  },
  billableRate: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  tags: [String]
}, {
  timestamps: true
});

timesheetSchema.index({ user: 1, date: 1 });
timesheetSchema.index({ caseId: 1 });
timesheetSchema.index({ taskId: 1 });
timesheetSchema.index({ status: 1 });
timesheetSchema.index({ billable: 1 });

module.exports = mongoose.model('Timesheet', timesheetSchema);


