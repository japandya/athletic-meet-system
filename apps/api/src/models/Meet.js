const mongoose = require('mongoose');

const meetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Meet name is required'],
      trim: true,
      maxlength: [200, 'Meet name cannot exceed 200 characters']
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters']
    },
    date: {
      type: Date,
      required: [true, 'Meet date is required']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizer',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meet', meetSchema);
