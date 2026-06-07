const { validate, schemas } = require('../utils/validation');
const { RegistrationService } = require('../services');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class RegistrationController {
  static async createRegistration(req, res, next) {
    try {
      const validation = validate(schemas.registration.create, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid registration data', validation.errors);
      }

      const { meetId } = req.params;
      const registration = await RegistrationService.createRegistration(validation.data, meetId);

      res.status(201).json({
        success: true,
        message: 'Registration created successfully',
        data: registration
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRegistrationById(req, res, next) {
    try {
      const { registrationId } = req.params;
      const registration = await RegistrationService.getRegistrationById(registrationId);

      res.status(200).json({
        success: true,
        data: registration
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRegistrationsByEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const registrations = await RegistrationService.getRegistrationsByEvent(eventId);

      res.status(200).json({
        success: true,
        data: registrations
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRegistration(req, res, next) {
    try {
      const validation = validate(schemas.registration.update, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid registration data', validation.errors);
      }

      const { registrationId } = req.params;
      const registration = await RegistrationService.updateRegistration(registrationId, validation.data);

      res.status(200).json({
        success: true,
        message: 'Registration updated successfully',
        data: registration
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRegistration(req, res, next) {
    try {
      const { registrationId } = req.params;
      const registration = await RegistrationService.deleteRegistration(registrationId);

      res.status(200).json({
        success: true,
        message: 'Registration deleted successfully',
        data: registration
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RegistrationController;
