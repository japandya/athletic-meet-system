const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [200, 'Event name cannot exceed 200 characters']
    },
    category: {
      type: String,
      enum: ['Boys', 'Girls', 'Open'],
      default: 'Open'
    },
    type: {
      type: String,
      enum: ['track', 'field', 'combined'],
      required: [true, 'Event type is required']
    },
    unit: {
      type: String,
      enum: ['seconds', 'meters', 'points'],
      default: 'seconds'
    },
    lowerIsBetter: {
      type: Boolean,
      default: true // true for times (seconds), false for distances/heights
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    scheduledTime: Date,
    venue: String,
    description: String,
    meetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meet',
      required: true
    },
    maxParticipants: {
      type: Number,
      min: 1
    },
    notes: String
  },
  { timestamps: true }
);

// Index for performance
eventSchema.index({ meetId: 1, status: 1 });
eventSchema.index({ meetId: 1, category: 1 });

module.exports = mongoose.model('Event', eventSchema);
