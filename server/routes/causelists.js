const express = require('express');
const router = express.Router();
const Causelist = require('../models/Causelist');
const Case = require('../models/Case');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/causelists
// @desc    Create a new causelist entry
// @access  Private
router.post('/', [
  auth,
  body('date').isISO8601().withMessage('Valid date is required'),
  body('court').trim().notEmpty().withMessage('Court is required'),
  body('caseId').notEmpty().withMessage('Case ID is required'),
  body('caseNumber').trim().notEmpty().withMessage('Case number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const causelistData = {
      ...req.body,
      date: new Date(req.body.date),
      createdBy: req.user._id
    };

    const newCauselist = new Causelist(causelistData);
    await newCauselist.save();

    // Update case with next hearing date if provided
    if (req.body.date) {
      await Case.findByIdAndUpdate(req.body.caseId, {
        nextHearingDate: new Date(req.body.date)
      });
    }

    const populatedCauselist = await Causelist.findById(newCauselist._id)
      .populate('caseId', 'caseNumber title clientName')
      .populate('advocateId', 'name email designation')
      .populate('courtLocation', 'name address')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedCauselist);
  } catch (error) {
    console.error('Error creating causelist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/causelists
// @desc    Get all causelist entries
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    
    const { date, court, caseId, advocateId, status } = req.query;
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (court) query.court = court;
    if (caseId) query.caseId = caseId;
    if (advocateId) query.advocateId = advocateId;
    if (status) query.status = status;

    // Employees see only their assigned cases
    if (req.user.role !== 'admin') {
      const userCases = await Case.find({ assignedTo: req.user._id }).select('_id');
      const caseIds = userCases.map(c => c._id);
      query.caseId = { $in: caseIds };
    }

    const causelists = await Causelist.find(query)
      .populate('caseId', 'caseNumber title clientName court')
      .populate('advocateId', 'name email designation')
      .populate('courtLocation', 'name address')
      .populate('createdBy', 'name email')
      .sort({ date: 1, itemNumber: 1 });

    res.json(causelists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/causelists/today
// @desc    Get today's causelist
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      date: { $gte: today, $lt: tomorrow }
    };

    if (req.user.role !== 'admin') {
      const userCases = await Case.find({ assignedTo: req.user._id }).select('_id');
      const caseIds = userCases.map(c => c._id);
      query.caseId = { $in: caseIds };
    }

    const causelists = await Causelist.find(query)
      .populate('caseId', 'caseNumber title clientName court')
      .populate('advocateId', 'name email designation')
      .populate('courtLocation', 'name address')
      .sort({ date: 1, itemNumber: 1 });

    res.json(causelists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/causelists/:id
// @desc    Get a single causelist entry
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const causelist = await Causelist.findById(req.params.id)
      .populate('caseId', 'caseNumber title clientName court caseType')
      .populate('advocateId', 'name email designation')
      .populate('courtLocation', 'name address coordinates')
      .populate('createdBy', 'name email');

    if (!causelist) {
      return res.status(404).json({ message: 'Causelist entry not found' });
    }

    res.json(causelist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/causelists/:id
// @desc    Update causelist entry
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const causelist = await Causelist.findById(req.params.id);
    if (!causelist) {
      return res.status(404).json({ message: 'Causelist entry not found' });
    }

    if (req.body.date) {
      req.body.date = new Date(req.body.date);
    }

    Object.assign(causelist, req.body);
    await causelist.save();

    // Update case with next hearing date if changed
    if (req.body.date && causelist.caseId) {
      await Case.findByIdAndUpdate(causelist.caseId, {
        nextHearingDate: causelist.date
      });
    }

    const populatedCauselist = await Causelist.findById(causelist._id)
      .populate('caseId', 'caseNumber title clientName')
      .populate('advocateId', 'name email designation')
      .populate('courtLocation', 'name address');

    res.json(populatedCauselist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/causelists/:id
// @desc    Delete causelist entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const causelist = await Causelist.findById(req.params.id);
    if (!causelist) {
      return res.status(404).json({ message: 'Causelist entry not found' });
    }

    await causelist.deleteOne();
    res.json({ message: 'Causelist entry deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

