const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Legal', 'HR', 'Accounts', 'Admin', 'Support']
  },
  subAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  permissions: {
    canViewAttendance: { type: Boolean, default: true },
    canViewCases: { type: Boolean, default: false },
    canViewBilling: { type: Boolean, default: false },
    canViewHR: { type: Boolean, default: false },
    canApproveTimesheets: { type: Boolean, default: false },
    canApproveLeaves: { type: Boolean, default: false },
    canApproveBills: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

departmentSchema.index({ subAdmin: 1 });
departmentSchema.index({ name: 1 });

module.exports = mongoose.model('Department', departmentSchema);


