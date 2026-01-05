const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientType: {
    type: String,
    enum: ['regular', 'known', 'government', 'corporate', 'pro-bono'],
    required: true
  },
  workType: {
    type: String,
    enum: ['Drafting', 'Appearance', 'Consultation', 'Research', 'Filing'],
    default: 'Drafting'
  },
  court: String,
  caseType: String,
  calculationDetails: {
    multipliers: {
      court: Number,
      caseType: Number,
      workType: Number,
      combined: Number
    }
  },
  feeStructure: {
    type: String,
    enum: ['hourly', 'fixed', 'contingency', 'retainer'],
    required: true
  },
  baseAmount: {
    type: Number,
    required: true
  },
  hours: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  additionalCharges: [{
    description: String,
    amount: Number
  }],
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'cheque', 'bank-transfer', 'online', 'other']
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Auto-generate bill number
billSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    const count = await mongoose.model('Bill').countDocuments();
    this.billNumber = `BILL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);

