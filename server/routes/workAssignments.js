const express = require('express');
const router = express.Router();
const WorkAssignment = require('../models/WorkAssignment');
const { auth, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { notifyTaskAssigned } = require('../utils/notifications');

// @route   POST /api/work-assignments
// @desc    Create work assignment
// @access  Private
router.post('/', [
  auth,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('assignedTo').notEmpty().withMessage('Assigned to is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('estimatedHours').isNumeric().withMessage('Estimated hours must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only admin can assign work
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can assign work' });
    }

    // Prepare assignment data - handle empty caseId
    const assignmentData = {
      ...req.body,
      assignedBy: req.user._id
    };

    // Convert empty string caseId to null (optional field)
    if (assignmentData.caseId === '' || assignmentData.caseId === null || assignmentData.caseId === undefined) {
      assignmentData.caseId = null;
    }

    const assignment = new WorkAssignment(assignmentData);

    await assignment.save();

    const populated = await WorkAssignment.findById(assignment._id)
      .populate('assignedTo', 'name email designation')
      .populate('assignedBy', 'name email')
      .populate('caseId', 'caseNumber title');

    // Send notification to assigned employee
    if (populated.assignedTo && populated.assignedTo._id) {
      try {
        await notifyTaskAssigned(populated.assignedTo._id.toString(), populated);
      } catch (error) {
        console.error('Error sending notification:', error);
        // Don't fail the request if notification fails
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating work assignment:', error);
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

// @route   GET /api/work-assignments
// @desc    Get work assignments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = {};

    // Employees see only their assignments, admin sees all
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    } else if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    const { status, priority } = req.query;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const assignments = await WorkAssignment.find(query)
      .populate('assignedTo', 'name email designation')
      .populate('assignedBy', 'name email')
      .populate('caseId', 'caseNumber title')
      .populate('comments.addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/work-assignments/:id
// @desc    Get single work assignment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await WorkAssignment.findById(req.params.id)
      .populate('assignedTo', 'name email designation')
      .populate('assignedBy', 'name email')
      .populate('caseId', 'caseNumber title')
      .populate('workLogs.loggedBy', 'name email')
      .populate('comments.addedBy', 'name email')
      .populate('updates.changedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && assignment.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/work-assignments/:id/status
// @desc    Update assignment status
// @access  Private
router.put('/:id/status', [
  auth,
  body('status').isIn(['assigned', 'in-progress', 'completed', 'overdue']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await WorkAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check access - employees can only update their own assignments
    const assignedToId = assignment.assignedTo?._id?.toString() || assignment.assignedTo?.toString();
    const userId = req.user._id.toString();
    const isAssignee = assignedToId === userId;
    
    if (req.user.role !== 'admin' && !isAssignee) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update tasks assigned to you.',
        debug: {
          assignmentId: assignment._id.toString(),
          assignedToId: assignedToId,
          userId: userId,
          isAssignee: isAssignee
        }
      });
    }

    assignment.status = req.body.status;
    
    if (req.body.status === 'completed') {
      assignment.completedDate = new Date();
    }

    await assignment.save();

    const populated = await WorkAssignment.findById(assignment._id)
      .populate('assignedTo', 'name email designation')
      .populate('assignedBy', 'name email')
      .populate('caseId', 'caseNumber title');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/work-assignments/:id/log
// @desc    Add work log
// @access  Private
router.post('/:id/log', [
  auth,
  body('hours').isNumeric().withMessage('Hours must be a number'),
  body('description').trim().notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await WorkAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && assignment.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    assignment.workLogs.push({
      hours: req.body.hours,
      description: req.body.description,
      loggedBy: req.user._id
    });

    // Update actual hours
    assignment.actualHours = assignment.workLogs.reduce((sum, log) => sum + log.hours, 0);

    await assignment.save();

    const populated = await WorkAssignment.findById(assignment._id)
      .populate('assignedTo', 'name email designation')
      .populate('assignedBy', 'name email')
      .populate('workLogs.loggedBy', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/work-assignments/:id
// @desc    Update work assignment
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const assignment = await WorkAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check access - employees can only update their own assignments
    const assignedToId = assignment.assignedTo?._id?.toString() || assignment.assignedTo?.toString();
    const userId = req.user._id.toString();
    const isAssignee = assignedToId === userId;
    
    if (req.user.role !== 'admin' && !isAssignee) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update tasks assigned to you.',
        debug: {
          assignmentId: assignment._id.toString(),
          assignedToId: assignedToId,
          userId: userId,
          isAssignee: isAssignee
        }
      });
    }

    // Handle status update (if status is being updated)
    if (req.body.status) {
      const oldStatus = assignment.status;
      assignment.status = req.body.status;
      
      if (req.body.status === 'completed') {
        assignment.completedDate = new Date();
      }
      
      // Add update history for status change
      if (oldStatus !== req.body.status) {
        if (!assignment.updates) assignment.updates = [];
        assignment.updates.push({
          type: 'status',
          description: `Status changed from ${oldStatus} to ${req.body.status}`,
          changedBy: req.user._id,
          oldValue: oldStatus,
          newValue: req.body.status,
          changedAt: new Date()
        });
      }
    }

    // Update other fields (only if admin, or if employee is updating allowed fields)
    if (req.user.role === 'admin') {
      // Admin can update all fields except status (handled above)
      const { status, ...otherFields } = req.body;
      Object.assign(assignment, otherFields);
    } else {
      // Employees can only update: status (handled above), progress, actualHours, notes
      if (req.body.progress !== undefined) assignment.progress = req.body.progress;
      if (req.body.actualHours !== undefined) assignment.actualHours = req.body.actualHours;
      if (req.body.notes !== undefined) assignment.notes = req.body.notes;
    }
    
    // Add update history for progress
    if (req.body.progress !== undefined && assignment.progress !== req.body.progress) {
      if (!assignment.updates) assignment.updates = [];
      const oldProgress = assignment.progress || 0;
      assignment.updates.push({
        type: 'progress',
        description: `Progress updated to ${req.body.progress}%`,
        changedBy: req.user._id,
        oldValue: oldProgress.toString(),
        newValue: req.body.progress.toString(),
        changedAt: new Date()
      });
    }

    await assignment.save();

    const populated = await WorkAssignment.findById(assignment._id)
      .populate('assignedTo', 'name email designation')
      .populate('assignedBy', 'name email')
      .populate('caseId', 'caseNumber title')
      .populate('comments.addedBy', 'name email')
      .populate('updates.changedBy', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/work-assignments/:id/comment
// @desc    Add comment to work assignment
// @access  Private
router.post('/:id/comment', [
  auth,
  body('content').trim().notEmpty().withMessage('Comment content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await WorkAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && assignment.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    assignment.comments.push({
      content: req.body.content,
      addedBy: req.user._id
    });

    // Add update history
    assignment.updates.push({
      type: 'comment',
      description: 'Comment added',
      changedBy: req.user._id
    });

    await assignment.save();

    const populated = await WorkAssignment.findById(assignment._id)
      .populate('assignedTo', 'name email designation')
      .populate('assignedBy', 'name email')
      .populate('caseId', 'caseNumber title')
      .populate('comments.addedBy', 'name email')
      .populate('updates.changedBy', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

