const mongoose = require('mongoose');

const clientInteractionSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  interactionType: {
    type: String,
    enum: ['meeting', 'call', 'email', 'whatsapp', 'document-exchange', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  contactPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientContact'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interactionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    trim: true
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  outcome: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

clientInteractionSchema.index({ clientId: 1, interactionDate: -1 });
clientInteractionSchema.index({ userId: 1 });
clientInteractionSchema.index({ interactionType: 1 });
clientInteractionSchema.index({ followUpRequired: 1, followUpDate: 1 });

module.exports = mongoose.model('ClientInteraction', clientInteractionSchema);


