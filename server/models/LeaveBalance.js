const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['CL', 'SL', 'EL', 'ML', 'PL'],
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  totalAllocated: {
    type: Number,
    required: true,
    default: 0
  },
  used: {
    type: Number,
    default: 0,
    min: 0
  },
  available: {
    type: Number,
    default: function() {
      return Math.max(0, this.totalAllocated - this.used);
    }
  },
  carryForward: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

leaveBalanceSchema.index({ user: 1, leaveType: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);


