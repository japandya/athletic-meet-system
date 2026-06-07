const mongoose = require('mongoose');

const athleteSchema = new mongoose.Schema(
  {
    bib: {
      type: String,
      required: [true, 'Bib number is required'],
      trim: true,
      unique: true,
      sparse: true
    },
    name: {
      type: String,
      required: [true, 'Athlete name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters']
    },
    age: {
      type: Number,
      min: [1, 'Age must be at least 1'],
      max: [120, 'Age cannot exceed 120']
    },
    gender: {
      type: String,
      enum: ['Boys', 'Girls', 'Open'],
      default: 'Open'
    },
    team: {
      type: String,
      required: [true, 'Team is required'],
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    dob: Date,
    district: String,
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    mobile: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be 10 digits']
    },
    coachName: String,
    coachPhone: String,
    photo: String,
    afiUid: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    accessCode: {
      type: String,
      unique: true,
      sparse: true
    },
    meetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meet',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index for performance
athleteSchema.index({ meetId: 1, bib: 1 });
athleteSchema.index({ meetId: 1, team: 1 });

module.exports = mongoose.model('Athlete', athleteSchema);
