const { validate, schemas } = require('../utils/validation');
const { EventService } = require('../services');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class EventController {
  static async createEvent(req, res, next) {
    try {
      const validation = validate(schemas.event.create, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid event data', validation.errors);
      }

      const { meetId } = req.params;
      const event = await EventService.createEvent(validation.data, meetId);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventById(req, res, next) {
    try {
      const { eventId } = req.params;
      const event = await EventService.getEventById(eventId);

      res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventsByMeet(req, res, next) {
    try {
      const { meetId } = req.params;
      const filter = req.query.status ? { status: req.query.status } : {};
      const events = await EventService.getEventsByMeet(meetId, filter);

      res.status(200).json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req, res, next) {
    try {
      const validation = validate(schemas.event.update, req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid event data', validation.errors);
      }

      const { eventId } = req.params;
      const event = await EventService.updateEvent(eventId, validation.data);

      res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const event = await EventService.deleteEvent(eventId);

      res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventStats(req, res, next) {
    try {
      const { eventId } = req.params;
      const stats = await EventService.getEventStats(eventId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EventController;
