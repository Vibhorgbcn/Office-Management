const mongoose = require('mongoose');

const courtLocationSchema = new mongoose.Schema({
  courtName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
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
  courtType: {
    type: String,
    enum: ['Supreme Court', 'High Court', 'District Court', 'Special Court', 'Tribunal'],
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
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

courtLocationSchema.index({ latitude: 1, longitude: 1 });
courtLocationSchema.index({ courtType: 1 });
courtLocationSchema.index({ city: 1, state: 1 });

module.exports = mongoose.model('CourtLocation', courtLocationSchema);


