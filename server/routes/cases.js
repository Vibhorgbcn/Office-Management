const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const { auth, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { notifyCaseAssigned } = require('../utils/notifications');

// @route   POST /api/cases
// @desc    Create a new case (Admin only)
// @access  Private/Admin
router.post('/', [
  auth,
  adminOnly,
  body('caseNumber').trim().notEmpty().withMessage('Case number is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('clientName').trim().notEmpty().withMessage('Client name is required'),
  body('court').isIn(['National Criminal Court', 'Supreme Court', 'High Court', 'District Court']).withMessage('Invalid court'),
  body('caseType').isIn(['Criminal', 'Environment Law', 'Civil', 'Constitutional', 'Other']).withMessage('Invalid case type'),
  body('filingDate').optional().isISO8601().withMessage('Valid filing date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const caseData = {
      ...req.body,
      assignedBy: req.user._id,
      status: 'pending'
    };

    // Convert empty string clientId to null (optional field)
    if (caseData.clientId === '' || caseData.clientId === null || caseData.clientId === undefined) {
      caseData.clientId = null;
    }

    // Convert empty string assignedTo to null (optional field)
    if (caseData.assignedTo === '' || caseData.assignedTo === null || caseData.assignedTo === undefined) {
      caseData.assignedTo = null;
    }

    // Handle filingDate - use provided date or default to today
    if (!caseData.filingDate || caseData.filingDate === '') {
      caseData.filingDate = new Date();
    } else {
      caseData.filingDate = new Date(caseData.filingDate);
    }

    const newCase = new Case(caseData);
    await newCase.save();

    const populatedCase = await Case.findById(newCase._id)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email designation');

    res.status(201).json(populatedCase);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Case number already exists' });
    }
    console.error('Error creating case:', error);
    // Provide more detailed error message for debugging
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/cases
// @desc    Get all cases
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = {};

    // Admin sees all cases, employees see only assigned cases
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    }

    const { status, court, caseType, assignedTo } = req.query;
    if (status) query.status = status;
    if (court) query.court = court;
    if (caseType) query.caseType = caseType;
    if (assignedTo && req.user.role === 'admin') query.assignedTo = assignedTo;

    const cases = await Case.find(query)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email designation')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cases/:id
// @desc    Get a single case
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email designation')
      .populate('notes.addedBy', 'name email');

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Check if employee has access to this case
    if (req.user.role !== 'admin' && caseDoc.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(caseDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/cases/:id/assign
// @desc    Assign case to employee (Admin only)
// @access  Private/Admin
router.put('/:id/assign', [
  auth,
  adminOnly,
  body('assignedTo').notEmpty().withMessage('Employee ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    caseDoc.assignedTo = req.body.assignedTo;
    caseDoc.status = 'assigned';

    await caseDoc.save();

    const populatedCase = await Case.findById(caseDoc._id)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email designation');

    // Send notification to assigned employee
    if (populatedCase.assignedTo && populatedCase.assignedTo._id) {
      try {
        await notifyCaseAssigned(populatedCase.assignedTo._id.toString(), populatedCase);
      } catch (error) {
        console.error('Error sending notification:', error);
        // Don't fail the request if notification fails
      }
    }

    res.json(populatedCase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/cases/:id
// @desc    Update case
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Only admin or assigned employee can update
    if (req.user.role !== 'admin' && caseDoc.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Admin can update all fields, employees have limited update
    const updateFields = req.user.role === 'admin' 
      ? req.body 
      : { status: req.body.status, notes: req.body.notes };

    Object.assign(caseDoc, updateFields);
    await caseDoc.save();

    const populatedCase = await Case.findById(caseDoc._id)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email designation');

    res.json(populatedCase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cases/:id
// @desc    Delete case (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case not found' });
    }

    await caseDoc.deleteOne();
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

