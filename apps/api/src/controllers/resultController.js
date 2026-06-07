const { validate, schemas } = require('../utils/validation');
const { ResultService } = require('../services');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class ResultController {
  static async createResult(req, res, next) {
    try {
      const validation = validate(schemas.result.create, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid result data', validation.errors);
      }

      const { meetId } = req.params;
      const organizerId = req.organizerId;
      const result = await ResultService.createResult(validation.data, meetId, organizerId);

      res.status(201).json({
        success: true,
        message: 'Result created successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getResultById(req, res, next) {
    try {
      const { resultId } = req.params;
      const result = await ResultService.getResultById(resultId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getResultsByEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const results = await ResultService.getResultsByEvent(eventId);

      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateResult(req, res, next) {
    try {
      const validation = validate(schemas.result.update, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid result data', validation.errors);
      }

      const { resultId } = req.params;
      const organizerId = req.organizerId;
      const result = await ResultService.updateResult(resultId, validation.data, organizerId);

      res.status(200).json({
        success: true,
        message: 'Result updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteResult(req, res, next) {
    try {
      const { resultId } = req.params;
      const result = await ResultService.deleteResult(resultId);

      res.status(200).json({
        success: true,
        message: 'Result deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ResultController;
