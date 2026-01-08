const mongoose = require('mongoose');

const workAssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    required: true
  },
  actualHours: {
    type: Number,
    default: 0
  },
  deliveryDays: {
    type: Number, // Days taken to complete
    default: 0
  },
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'submitted', 'approved', 'rejected', 'completed', 'overdue'],
    default: 'assigned'
  },
  taskName: {
    type: String,
    trim: true
  },
  isOverdue: {
    type: Boolean,
    default: false
  },
  overdueDays: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  workLogs: [{
    date: { type: Date, default: Date.now },
    hours: Number,
    description: String,
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  notes: {
    type: String
  },
  // Provakil-like enhancements
  category: {
    type: String,
    enum: ['drafting', 'research', 'filing', 'hearing', 'consultation', 'documentation', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkAssignment'
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  comments: [{
    content: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
    editedAt: Date
  }],
  updates: [{
    type: {
      type: String,
      enum: ['status-change', 'assignment', 'due-date', 'priority', 'progress', 'comment', 'attachment'],
      required: true
    },
    description: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    oldValue: String,
    newValue: String
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    interval: Number,
    endDate: Date
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskTemplate',
    default: null
  },
  estimatedCompletionDate: Date,
  reminderDate: Date,
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate delivery days and overdue status
workAssignmentSchema.pre('save', function(next) {
  // Calculate delivery days when work is completed
  if (this.isModified('completedDate') && this.completedDate && this.assignedDate) {
    const diffTime = Math.abs(this.completedDate - this.assignedDate);
    this.deliveryDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Check if overdue
  if (this.dueDate && !this.completedDate && this.status !== 'completed') {
    const now = new Date();
    if (now > this.dueDate) {
      this.isOverdue = true;
      const diffTime = Math.abs(now - this.dueDate);
      this.overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (this.status !== 'overdue') {
        this.status = 'overdue';
      }
    } else {
      this.isOverdue = false;
      this.overdueDays = 0;
    }
  }
  
  next();
});

module.exports = mongoose.model('WorkAssignment', workAssignmentSchema);

