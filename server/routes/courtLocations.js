const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const CourtLocation = require('../models/CourtLocation');

// @route   GET /api/court-locations
// @desc    Get all court locations
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { courtType, city, state } = req.query;
    const query = { isActive: true };

    if (courtType) query.courtType = courtType;
    if (city) query.city = city;
    if (state) query.state = state;

    const locations = await CourtLocation.find(query)
      .populate('createdBy', 'name')
      .sort({ courtName: 1 });

    res.json(locations);
  } catch (error) {
    console.error('Error fetching court locations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/court-locations
// @desc    Create court location (Admin only)
// @access  Private/Admin
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      courtName,
      address,
      latitude,
      longitude,
      courtType,
      city,
      state,
      description
    } = req.body;

    const location = new CourtLocation({
      courtName,
      address,
      latitude,
      longitude,
      courtType,
      city,
      state,
      description,
      createdBy: req.user._id
    });

    await location.save();
    const populated = await CourtLocation.findById(location._id)
      .populate('createdBy', 'name');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating court location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/court-locations/:id
// @desc    Update court location (Admin only)
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const location = await CourtLocation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({ message: 'Court location not found' });
    }

    const populated = await CourtLocation.findById(location._id)
      .populate('createdBy', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error updating court location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/court-locations/:id
// @desc    Delete court location (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const location = await CourtLocation.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({ message: 'Court location not found' });
    }

    res.json({ message: 'Court location deactivated successfully' });
  } catch (error) {
    console.error('Error deleting court location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


