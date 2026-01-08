const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Timesheet = require('../models/Timesheet');

// @route   GET /api/timesheets
// @desc    Get timesheets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, caseId, taskId } = req.query;
    const query = {};

    // If not admin, only show own timesheets
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (caseId) query.caseId = caseId;
    if (taskId) query.taskId = taskId;

    const timesheets = await Timesheet.find(query)
      .populate('user', 'name email')
      .populate('caseId', 'caseNumber title')
      .populate('taskId', 'title')
      .populate('clientId', 'name')
      .sort({ date: -1, createdAt: -1 });

    res.json(timesheets);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/timesheets
// @desc    Create timesheet entry
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      date,
      taskId,
      caseId,
      clientId,
      startTime,
      endTime,
      durationHours,
      description,
      billable,
      billableRate,
      tags
    } = req.body;

    // Calculate duration if not provided
    let calculatedDuration = durationHours;
    if (startTime && endTime && !durationHours) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      calculatedDuration = (end - start) / (1000 * 60 * 60); // Convert to hours
    }

    const timesheet = new Timesheet({
      user: req.user._id,
      date: date || new Date(),
      taskId: taskId || null,
      caseId: caseId || null,
      clientId: clientId || null,
      startTime: startTime || new Date(),
      endTime: endTime || new Date(),
      durationHours: calculatedDuration,
      description,
      billable: billable !== undefined ? billable : true,
      billableRate: billableRate || 0,
      tags: tags || [],
      status: 'draft'
    });

    await timesheet.save();
    const populated = await Timesheet.findById(timesheet._id)
      .populate('caseId', 'caseNumber title')
      .populate('taskId', 'title')
      .populate('clientId', 'name');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating timesheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/timesheets/:id
// @desc    Update timesheet
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check ownership or admin
    if (timesheet.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cannot edit approved timesheets
    if (timesheet.status === 'approved') {
      return res.status(400).json({ message: 'Cannot edit approved timesheet' });
    }

    Object.assign(timesheet, req.body);
    await timesheet.save();

    const populated = await Timesheet.findById(timesheet._id)
      .populate('caseId', 'caseNumber title')
      .populate('taskId', 'title')
      .populate('clientId', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error updating timesheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/timesheets/:id/submit
// @desc    Submit timesheet for approval
// @access  Private
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (timesheet.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    timesheet.status = 'submitted';
    await timesheet.save();

    res.json(timesheet);
  } catch (error) {
    console.error('Error submitting timesheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/timesheets/:id/approve
// @desc    Approve/reject timesheet
// @access  Private/Admin
router.post('/:id/approve', auth, async (req, res) => {
  try {
    if (!['admin', 'senior-advocate'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, rejectionReason } = req.body;
    const timesheet = await Timesheet.findById(req.params.id);

    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    timesheet.status = status;
    timesheet.approvedBy = req.user._id;
    timesheet.approvedAt = new Date();
    if (status === 'rejected' && rejectionReason) {
      timesheet.rejectionReason = rejectionReason;
    }

    await timesheet.save();
    const populated = await Timesheet.findById(timesheet._id)
      .populate('caseId', 'caseNumber title')
      .populate('taskId', 'title')
      .populate('approvedBy', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error approving timesheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


