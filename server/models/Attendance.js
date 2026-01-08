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
  punchInAddress: {
    type: String, // Full address from reverse geocoding
    default: null
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
  punchOutAddress: {
    type: String, // Full address from reverse geocoding
    default: null
  },
  officeLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfficeLocation'
  },
  courtLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourtLocation'
  },
  clientLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  locationType: {
    type: String,
    enum: ['office', 'court', 'client', 'remote', 'field'],
    default: 'office'
  },
  workHours: {
    type: Number, // in hours
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  lateArrivalMinutes: {
    type: Number,
    default: 0
  },
  earlyExitMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'on-leave'],
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

