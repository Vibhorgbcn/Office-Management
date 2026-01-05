const mongoose = require('mongoose');

const officeLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  radiusMeters: {
    type: Number,
    required: true,
    default: 1000, // 1 km default radius
    min: 50,
    max: 1000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for geospatial queries
officeLocationSchema.index({ latitude: 1, longitude: 1 });
officeLocationSchema.index({ isActive: 1 });

module.exports = mongoose.model('OfficeLocation', officeLocationSchema);

