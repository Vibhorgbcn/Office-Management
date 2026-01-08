const express = require('express');
const router = express.Router();
const LegalNotice = require('../models/LegalNotice');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/legal-notices
// @desc    Create a new legal notice
// @access  Private
router.post('/', [
  auth,
  body('noticeNumber').trim().notEmpty().withMessage('Notice number is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('noticeType').isIn(['demand', 'legal', 'recovery', 'termination', 'breach', 'other']).withMessage('Invalid notice type'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const noticeData = {
      ...req.body,
      createdBy: req.user._id,
      status: 'draft'
    };

    const newNotice = new LegalNotice(noticeData);
    await newNotice.save();

    const populatedNotice = await LegalNotice.findById(newNotice._id)
      .populate('clientId', 'name email phone')
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(201).json(populatedNotice);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Notice number already exists' });
    }
    console.error('Error creating legal notice:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/legal-notices/bulk
// @desc    Create multiple legal notices (bulk)
// @access  Private
router.post('/bulk', [
  auth,
  body('notices').isArray({ min: 1 }).withMessage('At least one notice is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notices = req.body.notices.map(notice => ({
      ...notice,
      createdBy: req.user._id,
      status: 'draft'
    }));

    const createdNotices = await LegalNotice.insertMany(notices);
    
    const populatedNotices = await LegalNotice.find({ _id: { $in: createdNotices.map(n => n._id) } })
      .populate('clientId', 'name email phone')
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedNotices);
  } catch (error) {
    console.error('Error creating bulk notices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/legal-notices
// @desc    Get all legal notices
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    
    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    const { status, noticeType, clientId, caseId, stage } = req.query;
    if (status) query.status = status;
    if (noticeType) query.noticeType = noticeType;
    if (clientId) query.clientId = clientId;
    if (caseId) query.caseId = caseId;
    if (stage) query['recoveryWorkflow.stage'] = stage;

    const notices = await LegalNotice.find(query)
      .populate('clientId', 'name email phone')
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/legal-notices/:id
// @desc    Get a single legal notice
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const notice = await LegalNotice.findById(req.params.id)
      .populate('clientId', 'name email phone address')
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!notice) {
      return res.status(404).json({ message: 'Legal notice not found' });
    }

    res.json(notice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/legal-notices/:id
// @desc    Update legal notice
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const notice = await LegalNotice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Legal notice not found' });
    }

    Object.assign(notice, req.body);
    await notice.save();

    const populatedNotice = await LegalNotice.findById(notice._id)
      .populate('clientId', 'name email phone')
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json(populatedNotice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/legal-notices/:id/send
// @desc    Mark notice as sent
// @access  Private
router.put('/:id/send', [
  auth,
  body('sentVia').isIn(['email', 'post', 'courier', 'hand-delivery']).withMessage('Invalid sending method'),
  body('trackingNumber').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notice = await LegalNotice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Legal notice not found' });
    }

    notice.status = 'sent';
    notice.sentDate = new Date();
    notice.tracking.sentVia = req.body.sentVia;
    if (req.body.trackingNumber) {
      notice.tracking.trackingNumber = req.body.trackingNumber;
    }

    await notice.save();
    res.json(notice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/legal-notices/:id/update-workflow
// @desc    Update recovery workflow
// @access  Private
router.put('/:id/update-workflow', [
  auth,
  body('stage').isIn(['notice', 'reminder', 'legal-action', 'litigation', 'recovery', 'closed']).withMessage('Invalid stage'),
  body('action').optional(),
  body('outcome').optional(),
  body('notes').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notice = await LegalNotice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Legal notice not found' });
    }

    notice.recoveryWorkflow.stage = req.body.stage;
    if (req.body.nextAction) notice.recoveryWorkflow.nextAction = req.body.nextAction;
    if (req.body.nextActionDate) notice.recoveryWorkflow.nextActionDate = new Date(req.body.nextActionDate);

    if (req.body.action) {
      notice.recoveryWorkflow.actions.push({
        action: req.body.action,
        date: new Date(),
        outcome: req.body.outcome || '',
        notes: req.body.notes || ''
      });
    }

    await notice.save();
    res.json(notice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/legal-notices/:id
// @desc    Delete legal notice
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notice = await LegalNotice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Legal notice not found' });
    }

    await notice.deleteOne();
    res.json({ message: 'Legal notice deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

