const express = require('express');
const router = express.Router();
const OfficeLocation = require('../models/OfficeLocation');
const { auth, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/office-locations
// @desc    Create a new office location
// @access  Private/Admin
router.post('/', [
  auth,
  adminOnly,
  body('name').trim().notEmpty().withMessage('Office name is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('radiusMeters').optional().isInt({ min: 50, max: 1000 }).withMessage('Radius must be between 50 and 1000 meters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const officeLocation = new OfficeLocation({
      ...req.body,
      createdBy: req.user._id
    });

    await officeLocation.save();

    res.status(201).json(officeLocation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/office-locations
// @desc    Get all office locations
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.query.active !== undefined) {
      query.isActive = req.query.active === 'true';
    }

    const locations = await OfficeLocation.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/office-locations/active
// @desc    Get all active office locations (for employees)
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const locations = await OfficeLocation.find({ isActive: true })
      .select('name address latitude longitude radiusMeters description')
      .sort({ name: 1 });

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/office-locations/:id
// @desc    Get single office location
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const location = await OfficeLocation.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!location) {
      return res.status(404).json({ message: 'Office location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/office-locations/:id
// @desc    Update office location
// @access  Private/Admin
router.put('/:id', [
  auth,
  adminOnly,
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('radiusMeters').optional().isInt({ min: 50, max: 1000 }).withMessage('Radius must be between 50 and 1000 meters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const location = await OfficeLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Office location not found' });
    }

    Object.assign(location, req.body);
    await location.save();

    res.json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/office-locations/:id
// @desc    Delete office location (soft delete - set inactive)
// @access  Private/Admin
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const location = await OfficeLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Office location not found' });
    }

    // Soft delete - set inactive instead of deleting
    location.isActive = false;
    await location.save();

    res.json({ message: 'Office location deactivated successfully', location });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

