const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    enum: ['Legal', 'HR', 'Accounts', 'Admin', 'Support'],
    default: 'Legal'
  },
  joiningDate: {
    type: Date,
    required: true
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },
  salaryStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryStructure'
  },
  reportingManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  employmentStatus: {
    type: String,
    enum: ['active', 'on-leave', 'suspended', 'terminated', 'resigned'],
    default: 'active'
  },
  lastPromotionDate: {
    type: Date
  },
  skills: [String],
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ user: 1 });
employeeSchema.index({ reportingManager: 1 });

module.exports = mongoose.model('Employee', employeeSchema);


