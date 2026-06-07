const { validate, schemas } = require('../utils/validation');
const { AuthService } = require('../services');
const { ValidationError, AppError } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthController {
  static async registerOrganizer(req, res, next) {
    try {
      const validation = validate(schemas.organizer.register, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid registration data', validation.errors);
      }

      const { username, password, email, name } = validation.data;
      const organizer = await AuthService.registerOrganizer(username, password, email, name);

      res.status(201).json({
        success: true,
        message: 'Organizer registered successfully',
        data: organizer
      });
    } catch (error) {
      next(error);
    }
  }

  static async loginOrganizer(req, res, next) {
    try {
      const validation = validate(schemas.organizer.login, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid login data', validation.errors);
      }

      const { username, password } = validation.data;
      const organizer = await AuthService.loginOrganizer(username, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: organizer
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const organizerId = req.organizerId;
      const organizer = await AuthService.getOrganizerById(organizerId);

      res.status(200).json({
        success: true,
        data: organizer
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
