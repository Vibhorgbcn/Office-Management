const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date
  },
  punchInLat: {
    type: Number,
    required: true
  },
  punchInLng: {
    type: Number,
    required: true
  },
  punchInAccuracy: {
    type: Number // in meters
  },
  punchOutLat: {
    type: Number
  },
  punchOutLng: {
    type: Number
  },
  punchOutAccuracy: {
    type: Number // in meters
  },
  officeLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfficeLocation'
  },
  workHours: {
    type: Number, // in hours
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late'],
    default: 'present'
  },
  biometricVerified: {
    type: Boolean,
    default: false
  },
  deviceInfo: {
    deviceId: String,
    deviceType: String, // 'gps', 'manual'
    ipAddress: String,
    userAgent: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

