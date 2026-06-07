const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
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
    mark: {
      type: Number,
      required: [true, 'Result mark is required']
    },
    rank: {
      type: Number,
      min: 1
    },
    points: {
      type: Number,
      default: 0,
      min: 0
    },
    medal: {
      type: String,
      enum: ['Gold', 'Silver', 'Bronze', null],
      default: null
    },
    note: {
      type: String,
      maxlength: 500
    },
    recordType: {
      type: String,
      enum: ['meet_record', 'personal_best', 'none'],
      default: 'none'
    },
    status: {
      type: String,
      enum: ['valid', 'pending_review', 'disqualified'],
      default: 'valid'
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizer'
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for performance
resultSchema.index({ meetId: 1, eventId: 1 });
resultSchema.index({ athleteId: 1, meetId: 1 });
resultSchema.index({ eventId: 1, rank: 1 });

module.exports = mongoose.model('Result', resultSchema);
