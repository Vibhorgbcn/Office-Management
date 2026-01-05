const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Case = require('../models/Case');
const { auth, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { calculateBillAmount, getSuggestedFees, CLIENT_BASE_RATES } = require('../utils/billingEngine');

// @route   POST /api/bills/generate
// @desc    Auto-generate bill based on case and client type (Admin only)
// @access  Private/Admin
router.post('/generate', [
  auth,
  adminOnly,
  body('caseId').notEmpty().withMessage('Case ID is required'),
  body('feeStructure').isIn(['hourly', 'fixed', 'contingency', 'retainer']).withMessage('Invalid fee structure'),
  body('hours').optional().isNumeric().withMessage('Hours must be a number'),
  body('baseAmount').optional().isNumeric().withMessage('Base amount must be a number'),
  body('workType').optional().isIn(['Drafting', 'Appearance', 'Consultation', 'Research', 'Filing']).withMessage('Invalid work type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { caseId, feeStructure, hours, baseAmount, additionalCharges, discount, dueDate, workType, overrideAmount } = req.body;

    // Get case details
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Use advanced billing engine
    const billingParams = {
      clientType: caseDoc.clientType || 'regular',
      court: caseDoc.court || 'District Court',
      caseType: caseDoc.caseType || 'Criminal',
      workType: workType || 'Drafting',
      feeStructure,
      hours: hours || 0,
      caseValue: baseAmount || 0
    };

    const calculation = calculateBillAmount(billingParams);

    // Allow admin override
    const finalBaseAmount = overrideAmount || calculation.baseAmount;

    // Calculate additional charges
    const additionalTotal = (additionalCharges || []).reduce((sum, charge) => sum + (charge.amount || 0), 0);

    // Calculate total before tax
    let totalBeforeTax = finalBaseAmount + additionalTotal - (discount || 0);
    
    // Add tax (18% GST)
    const tax = totalBeforeTax * 0.18;
    const totalAmount = totalBeforeTax + tax;

    // Create bill
    const bill = new Bill({
      caseId,
      clientName: caseDoc.clientName,
      clientType: billingParams.clientType,
      workType: billingParams.workType,
      court: billingParams.court,
      caseType: billingParams.caseType,
      feeStructure,
      baseAmount: finalBaseAmount,
      hours: hours || 0,
      hourlyRate: calculation.hourlyRate,
      calculationDetails: {
        multipliers: calculation.multipliers
      },
      additionalCharges: additionalCharges || [],
      discount: discount || 0,
      tax,
      totalAmount,
      generatedBy: req.user._id,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await bill.save();

    const populated = await Bill.findById(bill._id)
      .populate('caseId', 'caseNumber title court caseType')
      .populate('generatedBy', 'name email');

    res.status(201).json({
      message: 'Bill generated successfully',
      bill: populated,
      calculation: calculation.calculation,
      multipliers: calculation.multipliers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bills/fee-rates
// @desc    Get fee rates for client types
// @access  Private/Admin
router.get('/fee-rates', auth, adminOnly, (req, res) => {
  res.json(CLIENT_BASE_RATES);
});

// @route   POST /api/bills/suggest-fees
// @desc    Get suggested fees for a case
// @access  Private/Admin
router.post('/suggest-fees', [
  auth,
  adminOnly,
  body('caseId').notEmpty().withMessage('Case ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const caseDoc = await Case.findById(req.body.caseId);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const suggestions = getSuggestedFees({
      clientType: caseDoc.clientType || 'regular',
      court: caseDoc.court || 'District Court',
      caseType: caseDoc.caseType || 'Criminal'
    });

    res.json({
      case: {
        caseNumber: caseDoc.caseNumber,
        clientType: caseDoc.clientType,
        court: caseDoc.court,
        caseType: caseDoc.caseType
      },
      suggestions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bills
// @desc    Get all bills
// @access  Private/Admin
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { status, clientType, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (clientType) query.clientType = clientType;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bills = await Bill.find(query)
      .populate('caseId', 'caseNumber title court caseType')
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bills/:id
// @desc    Get single bill
// @access  Private/Admin
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('caseId', 'caseNumber title court caseType clientName')
      .populate('generatedBy', 'name email');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bills/:id
// @desc    Update bill
// @access  Private/Admin
router.put('/:id', [
  auth,
  adminOnly,
  body('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    Object.assign(bill, req.body);

    if (req.body.status === 'paid') {
      bill.paidDate = new Date();
    }

    await bill.save();

    const populated = await Bill.findById(bill._id)
      .populate('caseId', 'caseNumber title court caseType')
      .populate('generatedBy', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bills/:id
// @desc    Delete bill
// @access  Private/Admin
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    await bill.deleteOne();
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

