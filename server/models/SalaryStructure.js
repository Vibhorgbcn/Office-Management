const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  variablePay: {
    type: Number,
    default: 0,
    min: 0
  },
  allowances: {
    hra: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  effectiveFrom: {
    type: Date,
    required: true
  },
  effectiveTo: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

salaryStructureSchema.index({ employeeId: 1, effectiveFrom: 1 });
salaryStructureSchema.index({ isActive: 1 });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);


