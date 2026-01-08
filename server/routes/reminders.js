const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Reminder = require('../models/Reminder');

// @route   GET /api/reminders
// @desc    Get reminders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, reminderType, dueDate } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (reminderType) query.reminderType = reminderType;
    if (dueDate) {
      query.dueDate = {
        $gte: new Date(dueDate),
        $lte: new Date(new Date(dueDate).setHours(23, 59, 59))
      };
    }

    const reminders = await Reminder.find(query)
      .sort({ dueDate: 1, priority: -1 });

    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reminders
// @desc    Create reminder
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      reminderType,
      title,
      description,
      dueDate,
      relatedType,
      relatedId,
      priority,
      metadata
    } = req.body;

    const reminder = new Reminder({
      reminderType,
      title,
      description,
      dueDate,
      relatedType,
      relatedId,
      userId: req.user._id,
      priority: priority || 'medium',
      metadata: metadata || {}
    });

    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reminders/:id
// @desc    Update reminder
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(reminder, req.body);
    await reminder.save();

    res.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reminders/:id/complete
// @desc    Mark reminder as completed
// @access  Private
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    reminder.status = 'completed';
    reminder.completedAt = new Date();
    await reminder.save();

    res.json(reminder);
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reminders/:id/snooze
// @desc    Snooze reminder
// @access  Private
router.post('/:id/snooze', auth, async (req, res) => {
  try {
    const { snoozedUntil } = req.body;
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    reminder.status = 'snoozed';
    reminder.snoozedUntil = new Date(snoozedUntil);
    await reminder.save();

    res.json(reminder);
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


