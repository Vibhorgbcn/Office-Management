const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const OfficeLocation = require('../models/OfficeLocation');
const { auth } = require('../middleware/auth');
const { findNearestOffice } = require('../utils/geofencing');
const { reverseGeocode } = require('../utils/geocoding');
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

    // Validate coordinates exist (accuracy not restricted - check-in allowed from anywhere)
    if (!latitude || !longitude || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        message: 'Valid GPS coordinates (latitude and longitude) are required.'
      });
    }

    // Find nearest office location for reference (optional - just for display, doesn't block)
    let nearestOffice = null;
    const officeLocations = await OfficeLocation.find({ isActive: true });
    if (officeLocations.length > 0) {
      nearestOffice = findNearestOffice(latitude, longitude, officeLocations);
    }

    // Get full address from coordinates (reverse geocoding)
    // Always try to get address, even if accuracy is poor
    let checkInAddress = null;
    try {
      console.log(`[Check-In] Reverse geocoding for coordinates: ${latitude}, ${longitude}, accuracy: ${accuracy}m`);
      const addressData = await reverseGeocode(latitude, longitude);
      if (addressData.error) {
        // If geocoding failed, use coordinates with note
        checkInAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      } else {
        // Add accuracy note if accuracy is poor
        if (accuracy > 1000) {
          checkInAddress = `${addressData.fullAddress} (Approximate location, accuracy: ±${(accuracy / 1000).toFixed(1)}km)`;
        } else {
          checkInAddress = addressData.fullAddress;
        }
      }
      console.log(`[Check-In] Geocoded address: ${checkInAddress}`);
    } catch (error) {
      console.error('Error getting address for check-in:', error);
      // Fallback to coordinates if reverse geocoding fails
      checkInAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    // Create attendance record - allow check-in from anywhere
    // Location is captured but geofence restriction is removed
    const attendance = new Attendance({
      userId: req.user._id,
      date: today, // Already normalized to start of day
      checkIn: new Date(),
      punchInLat: latitude,
      punchInLng: longitude,
      punchInAccuracy: accuracy,
      punchInAddress: checkInAddress, // Store full address
      officeLocationId: nearestOffice?._id || null, // Optional - just for reference
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

    // Format location message
    const locationMsg = nearestOffice 
      ? `from ${nearestOffice.distance ? `${Math.round(nearestOffice.distance)}m away from ${nearestOffice.name}` : nearestOffice.name}`
      : `from location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;

    res.status(201).json({
      message: `Checked in successfully ${locationMsg}`,
      attendance: populated,
      location: {
        coordinates: { latitude, longitude },
        nearestOffice: nearestOffice ? {
          name: nearestOffice.name,
          distance: nearestOffice.distance ? Math.round(nearestOffice.distance) : null
        } : null
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

    // Validate coordinates exist (accuracy not restricted - check-in allowed from anywhere)
    if (!latitude || !longitude || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        message: 'Valid GPS coordinates (latitude and longitude) are required.'
      });
    }

    // Find nearest office location for reference (optional - just for display, doesn't block)
    let nearestOffice = null;
    const officeLocations = await OfficeLocation.find({ isActive: true });
    if (officeLocations.length > 0) {
      nearestOffice = findNearestOffice(latitude, longitude, officeLocations);
    }

    // Get full address from coordinates (reverse geocoding)
    // Always try to get address, even if accuracy is poor
    let checkOutAddress = null;
    try {
      console.log(`[Check-Out] Reverse geocoding for coordinates: ${latitude}, ${longitude}, accuracy: ${accuracy}m`);
      const addressData = await reverseGeocode(latitude, longitude);
      if (addressData.error) {
        // If geocoding failed, use coordinates with note
        checkOutAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      } else {
        // Add accuracy note if accuracy is poor
        if (accuracy > 1000) {
          checkOutAddress = `${addressData.fullAddress} (Approximate location, accuracy: ±${(accuracy / 1000).toFixed(1)}km)`;
        } else {
          checkOutAddress = addressData.fullAddress;
        }
      }
      console.log(`[Check-Out] Geocoded address: ${checkOutAddress}`);
    } catch (error) {
      console.error('Error getting address for check-out:', error);
      // Fallback to coordinates if reverse geocoding fails
      checkOutAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    // Update attendance - allow checkout from anywhere
    // Location is captured but geofence restriction is removed
    const checkOutTime = new Date();
    attendance.checkOut = checkOutTime;
    attendance.punchOutLat = latitude;
    attendance.punchOutLng = longitude;
    attendance.punchOutAccuracy = accuracy;
    attendance.punchOutAddress = checkOutAddress; // Store full address

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
      .populate('officeLocationId', 'name address latitude longitude');

    // Format location message
    const locationMsg = nearestOffice 
      ? `from ${nearestOffice.distance ? `${Math.round(nearestOffice.distance)}m away from ${nearestOffice.name}` : nearestOffice.name}`
      : `from location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;

    res.json({
      message: `Checked out successfully ${locationMsg}`,
      attendance: populated,
      workHours: attendance.workHours,
      location: {
        coordinates: { latitude, longitude },
        nearestOffice: nearestOffice ? {
          name: nearestOffice.name,
          distance: nearestOffice.distance ? Math.round(nearestOffice.distance) : null
        } : null
      }
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

