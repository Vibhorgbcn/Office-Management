const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const OfficeLocation = require('../models/OfficeLocation');
const { auth } = require('../middleware/auth');
const { validateAttendanceLocation } = require('../utils/geofencing');
const { body, validationResult } = require('express-validator');

// @route   POST /api/attendance/checkin
// @desc    Check in with GPS geofencing validation
// @access  Private
router.post('/checkin', [
  auth,
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('accuracy').isFloat({ min: 0 }).withMessage('GPS accuracy required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      userId: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    // Get GPS coordinates
    const { latitude, longitude, accuracy } = req.body;

    // Get all active office locations
    const officeLocations = await OfficeLocation.find({ isActive: true });

    if (officeLocations.length === 0) {
      return res.status(400).json({ 
        message: 'No office locations configured. Please contact administrator.' 
      });
    }

    // Validate GPS location against office geofences
    const validation = validateAttendanceLocation(
      latitude,
      longitude,
      accuracy,
      officeLocations
    );

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.error,
        details: {
          accuracyRequired: validation.accuracyRequired,
          nearestOffice: validation.nearestOffice,
          distance: validation.distance,
          allowedRadius: validation.allowedRadius,
          officeCoordinates: validation.officeCoordinates,
          yourCoordinates: validation.yourCoordinates
        }
      });
    }

    // Create attendance record
    // Use the normalized 'today' variable (already set to start of day above)
    const attendance = new Attendance({
      userId: req.user._id,
      date: today, // Already normalized to start of day
      checkIn: new Date(),
      punchInLat: latitude,
      punchInLng: longitude,
      punchInAccuracy: accuracy,
      officeLocationId: validation.officeLocation._id,
      status: 'present',
      biometricVerified: false,
      deviceInfo: {
        deviceType: 'gps',
        ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent']
      }
    });

    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('officeLocationId', 'name address latitude longitude');

    res.status(201).json({
      message: `Checked in successfully at ${validation.officeLocation.name}`,
      attendance: populated,
      location: {
        office: validation.officeLocation.name,
        distance: validation.distance
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/checkout
// @desc    Check out with GPS geofencing validation
// @access  Private
router.post('/checkout', [
  auth,
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('accuracy').isFloat({ min: 0 }).withMessage('GPS accuracy required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active attendance
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      checkOut: null
    }).populate('officeLocationId');

    if (!attendance) {
      return res.status(400).json({ message: 'No active check-in found' });
    }

    // Get GPS coordinates
    const { latitude, longitude, accuracy } = req.body;

    // Validate location (should be at same office location for checkout)
    // Don't block based on accuracy - only check geofence
    const officeLocations = await OfficeLocation.find({ isActive: true });
    const validation = validateAttendanceLocation(
      latitude,
      longitude,
      accuracy,
      officeLocations
    );

    // Allow checkout even if slightly outside, but log it
    if (!validation.valid && validation.distance > (validation.allowedRadius * 1.5)) {
      return res.status(400).json({
        message: validation.error
      });
    }

    // Update attendance
    const checkOutTime = new Date();
    attendance.checkOut = checkOutTime;
    attendance.punchOutLat = latitude;
    attendance.punchOutLng = longitude;
    attendance.punchOutAccuracy = accuracy;

    // Calculate work hours
    const diffTime = checkOutTime - attendance.checkIn;
    attendance.workHours = parseFloat((diffTime / (1000 * 60 * 60)).toFixed(2));

    // Determine status based on work hours
    if (attendance.workHours < 4) {
      attendance.status = 'half-day';
    } else {
      attendance.status = 'present';
    }

    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('officeLocationId', 'name address');

    res.json({
      message: 'Checked out successfully',
      attendance: populated,
      workHours: attendance.workHours
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/my-attendance
// @desc    Get my attendance records
// @access  Private
router.get('/my-attendance', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user._id };

    if (startDate && endDate) {
      // Normalize dates to start and end of day for proper range query
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(100);

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/all
// @desc    Get all attendance records (Admin only)
// @access  Private/Admin
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate, userId } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (startDate && endDate) {
      // Normalize dates to start and end of day for proper range query
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email employeeId designation')
      .populate('officeLocationId', 'name address latitude longitude')
      .sort({ date: -1 })
      .limit(500);

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

