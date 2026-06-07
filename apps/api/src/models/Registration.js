const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Athlete',
      required: [true, 'Athlete ID is required']
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    meetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meet',
      required: true
    },
    status: {
      type: String,
      enum: ['registered', 'withdrawn', 'disqualified'],
      default: 'registered'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    bib: String,
    heat: Number,
    lane: Number,
    notes: String
  },
  { timestamps: true }
);

// Ensure unique registration per athlete per event per meet
registrationSchema.index({ athleteId: 1, eventId: 1, meetId: 1 }, { unique: true });
registrationSchema.index({ meetId: 1, eventId: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
