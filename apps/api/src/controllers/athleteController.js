const { validate, schemas } = require('../utils/validation');
const { AthleteService } = require('../services');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class AthleteController {
  static async createAthlete(req, res, next) {
    try {
      const validation = validate(schemas.athlete.create, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid athlete data', validation.errors);
      }

      const { meetId } = req.params;
      const athlete = await AthleteService.createAthlete(validation.data, meetId);

      res.status(201).json({
        success: true,
        message: 'Athlete created successfully',
        data: athlete
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAthleteById(req, res, next) {
    try {
      const { athleteId } = req.params;
      const athlete = await AthleteService.getAthleteById(athleteId);

      res.status(200).json({
        success: true,
        data: athlete
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAthletesByMeet(req, res, next) {
    try {
      const { meetId } = req.params;
      const filter = req.query.team ? { team: req.query.team } : {};
      const athletes = await AthleteService.getAthletesByMeet(meetId, filter);

      res.status(200).json({
        success: true,
        data: athletes
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAthlete(req, res, next) {
    try {
      const validation = validate(schemas.athlete.update, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid athlete data', validation.errors);
      }

      const { athleteId } = req.params;
      const athlete = await AthleteService.updateAthlete(athleteId, validation.data);

      res.status(200).json({
        success: true,
        message: 'Athlete updated successfully',
        data: athlete
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAthlete(req, res, next) {
    try {
      const { athleteId } = req.params;
      const athlete = await AthleteService.deleteAthlete(athleteId);

      res.status(200).json({
        success: true,
        message: 'Athlete deleted successfully',
        data: athlete
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateAccessCodes(req, res, next) {
    try {
      const { meetId } = req.params;
      const result = await AthleteService.generateAccessCodes(meetId);

      res.status(200).json({
        success: true,
        message: 'Access codes generated',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async authenticateAthlete(req, res, next) {
    try {
      const { meetId } = req.params;
      const { loginId, accessCode } = req.body;

      if (!loginId || !accessCode) {
        throw new ValidationError('Login ID and access code are required');
      }

      const athlete = await AthleteService.authenticateAthlete(meetId, loginId, accessCode);

      res.status(200).json({
        success: true,
        message: 'Athlete authenticated',
        data: athlete
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AthleteController;
