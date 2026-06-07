const { validate, schemas } = require('../utils/validation');
const { MeetService } = require('../services');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class MeetController {
  static async createMeet(req, res, next) {
    try {
      const validation = validate(schemas.meet.create, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid meet data', validation.errors);
      }

      const organizerId = req.organizerId;
      const meet = await MeetService.createMeet(validation.data, organizerId);

      res.status(201).json({
        success: true,
        message: 'Meet created successfully',
        data: meet
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMeetById(req, res, next) {
    try {
      const { meetId } = req.params;
      const meet = await MeetService.getMeetById(meetId);

      res.status(200).json({
        success: true,
        data: meet
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMeet(req, res, next) {
    try {
      const validation = validate(schemas.meet.update, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid meet data', validation.errors);
      }

      const { meetId } = req.params;
      const meet = await MeetService.updateMeet(meetId, validation.data);

      res.status(200).json({
        success: true,
        message: 'Meet updated successfully',
        data: meet
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllMeets(req, res, next) {
    try {
      const meets = await MeetService.getAllMeets();

      res.status(200).json({
        success: true,
        data: meets
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req, res, next) {
    try {
      const { meetId } = req.params;
      const dashboard = await MeetService.getDashboard(meetId);

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaderboard(req, res, next) {
    try {
      const { meetId } = req.params;
      const leaderboard = await MeetService.buildLeaderboard(meetId);

      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MeetController;
