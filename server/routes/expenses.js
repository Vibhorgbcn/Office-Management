const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/expenses/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG allowed.'));
    }
  }
});

// @route   POST /api/expenses
// @desc    Create expense
// @access  Private
router.post('/', [
  auth,
  upload.single('receipt'),
  body('expenseNumber').trim().notEmpty().withMessage('Expense number is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('expenseType').isIn(['court-fee', 'travel', 'document', 'consultation', 'miscellaneous', 'other']).withMessage('Invalid expense type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expenseData = {
      ...req.body,
      createdBy: req.user._id,
      expenseDate: req.body.expenseDate ? new Date(req.body.expenseDate) : new Date()
    };

    if (req.file) {
      expenseData.receipt = {
        name: req.file.originalname,
        url: req.file.path,
        uploadedAt: new Date()
      };
    }

    // Convert empty IDs to null
    if (expenseData.caseId === '') expenseData.caseId = null;
    if (expenseData.clientId === '') expenseData.clientId = null;

    const expense = new Expense(expenseData);
    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('caseId', 'caseNumber title')
      .populate('clientId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Expense number already exists' });
    }
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses
// @desc    Get all expenses
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    const { caseId, clientId, expenseType, status, startDate, endDate } = req.query;
    if (caseId) query.caseId = caseId;
    if (clientId) query.clientId = clientId;
    if (expenseType) query.expenseType = expenseType;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('caseId', 'caseNumber title')
      .populate('clientId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ expenseDate: -1 });

    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('caseId', 'caseNumber title')
      .populate('clientId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Only admin or creator can update
    if (req.user.role !== 'admin' && expense.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(expense, req.body);
    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('caseId', 'caseNumber title')
      .populate('clientId', 'name')
      .populate('createdBy', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id/approve
// @desc    Approve/reject expense (Admin only)
// @access  Private/Admin
router.put('/:id/approve', [
  auth,
  body('status').isIn(['approved', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can approve expenses' });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    expense.status = req.body.status;
    expense.approvedBy = req.user._id;
    expense.approvedAt = new Date();

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('caseId', 'caseNumber title')
      .populate('clientId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Only admin or creator can delete
    if (req.user.role !== 'admin' && expense.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

