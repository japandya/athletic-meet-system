const { Organizer } = require('../models');
const { UnauthorizedError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');
const crypto = require('crypto');

const generateAccessCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

class AuthService {
  static async registerOrganizer(username, password, email = null, name = null) {
    try {
      // Check if organizer already exists
      const existingOrganizer = await Organizer.findOne({ username: username.toLowerCase() });
      if (existingOrganizer) {
        throw new ConflictError('Organizer username already exists');
      }

      // Create new organizer
      const organizer = new Organizer({
        username: username.toLowerCase(),
        passwordHash: password,
        email: email?.toLowerCase(),
        name,
        role: 'organizer'
      });

      await organizer.save();
      logger.info(`Organizer registered: ${username}`);

      return {
        id: organizer._id,
        username: organizer.username,
        email: organizer.email,
        name: organizer.name
      };
    } catch (error) {
      logger.error('Error registering organizer', { username, error: error.message });
      throw error;
    }
  }

  static async loginOrganizer(username, password) {
    try {
      const organizer = await Organizer.findOne({ username: username.toLowerCase() }).select('+passwordHash');
      
      if (!organizer || !organizer.isActive) {
        throw new UnauthorizedError('Invalid username or password');
      }

      const isPasswordValid = await organizer.comparePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid username or password');
      }

      logger.info(`Organizer logged in: ${username}`);

      return {
        id: organizer._id,
        username: organizer.username,
        email: organizer.email,
        name: organizer.name,
        role: organizer.role
      };
    } catch (error) {
      logger.error('Error logging in organizer', { username, error: error.message });
      throw error;
    }
  }

  static async getOrganizerById(organizerId) {
    try {
      const organizer = await Organizer.findById(organizerId).select('-passwordHash');
      if (!organizer) {
        throw new UnauthorizedError('Organizer not found');
      }
      return organizer;
    } catch (error) {
      logger.error('Error fetching organizer', { organizerId, error: error.message });
      throw error;
    }
  }
}

module.exports = AuthService;
