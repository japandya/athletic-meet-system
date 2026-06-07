const { z } = require('zod');

// Common schemas
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Meet schemas
const meetCreateSchema = z.object({
  name: z.string().min(1, 'Meet name is required').max(200),
  venue: z.string().min(1, 'Venue is required').max(200),
  date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  description: z.string().max(1000).optional(),
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).default('scheduled')
});

const meetUpdateSchema = meetCreateSchema.partial();

// Athlete schemas
const athleteCreateSchema = z.object({
  bib: z.string().min(1, 'Bib number is required'),
  name: z.string().min(1, 'Athlete name is required').max(200),
  age: z.number().min(1).max(120).optional(),
  gender: z.enum(['Boys', 'Girls', 'Open']).default('Open'),
  team: z.string().min(1, 'Team is required'),
  category: z.string().optional(),
  dob: z.string().optional(),
  district: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be 10 digits').optional(),
  coachName: z.string().optional(),
  coachPhone: z.string().optional(),
  photo: z.string().optional(),
  afiUid: z.string().optional()
});

const athleteUpdateSchema = athleteCreateSchema.partial();

// Event schemas
const eventCreateSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200),
  category: z.enum(['Boys', 'Girls', 'Open']).default('Open'),
  type: z.enum(['track', 'field', 'combined']),
  unit: z.enum(['seconds', 'meters', 'points']).default('seconds'),
  lowerIsBetter: z.boolean().default(true),
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).default('scheduled'),
  scheduledTime: z.string().optional(),
  venue: z.string().optional(),
  description: z.string().optional(),
  maxParticipants: z.number().min(1).optional(),
  notes: z.string().optional()
});

const eventUpdateSchema = eventCreateSchema.partial();

// Registration schemas
const registrationCreateSchema = z.object({
  athleteId: objectId,
  eventId: objectId,
  status: z.enum(['registered', 'withdrawn', 'disqualified']).default('registered'),
  bib: z.string().optional(),
  heat: z.number().optional(),
  lane: z.number().optional(),
  notes: z.string().optional()
});

const registrationUpdateSchema = registrationCreateSchema.partial();

// Result schemas
const resultCreateSchema = z.object({
  athleteId: objectId,
  eventId: objectId,
  mark: z.number().min(0, 'Mark must be positive'),
  rank: z.number().min(1).optional(),
  points: z.number().min(0).optional(),
  medal: z.enum(['Gold', 'Silver', 'Bronze']).optional(),
  note: z.string().max(500).optional(),
  recordType: z.enum(['meet_record', 'personal_best', 'none']).default('none'),
  status: z.enum(['valid', 'pending_review', 'disqualified']).default('valid')
});

const resultUpdateSchema = resultCreateSchema.partial();

// Organizer schemas
const organizerRegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email format').optional(),
  name: z.string().optional()
});

const organizerLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const validate = (schema, data) => {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};

module.exports = {
  schemas: {
    meet: { create: meetCreateSchema, update: meetUpdateSchema },
    athlete: { create: athleteCreateSchema, update: athleteUpdateSchema },
    event: { create: eventCreateSchema, update: eventUpdateSchema },
    registration: { create: registrationCreateSchema, update: registrationUpdateSchema },
    result: { create: resultCreateSchema, update: resultUpdateSchema },
    organizer: { register: organizerRegisterSchema, login: organizerLoginSchema }
  },
  validate,
  objectId
};
