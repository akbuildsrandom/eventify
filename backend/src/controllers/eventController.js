import { eventService } from '../services/eventService.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const eventController = {
  async getEvents(req, res, next) {
    try {
      const data = await eventService.getEvents(req.query);
      return sendSuccess(res, 'Events retrieved successfully', data.events, 200, data.pagination);
    } catch (err) {
      next(err);
    }
  },

  async getEventByIdOrSlug(req, res, next) {
    try {
      const event = await eventService.getEventByIdOrSlug(req.params.id);
      return sendSuccess(res, 'Event details retrieved successfully', { event });
    } catch (err) {
      next(err);
    }
  },

  async createEvent(req, res, next) {
    try {
      const event = await eventService.createEvent(req.user.id, req.body);
      return sendSuccess(res, 'Event created successfully', { event }, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateEvent(req, res, next) {
    try {
      const updated = await eventService.updateEvent(
        req.user.id,
        req.params.id,
        req.body,
        req.user.role
      );
      return sendSuccess(res, 'Event updated successfully', { event: updated });
    } catch (err) {
      next(err);
    }
  },

  async publishEvent(req, res, next) {
    try {
      const published = await eventService.publishEvent(
        req.user.id,
        req.params.id,
        req.user.role
      );
      return sendSuccess(res, 'Event published successfully', { event: published });
    } catch (err) {
      next(err);
    }
  },

  async cancelEvent(req, res, next) {
    try {
      const result = await eventService.cancelEvent(
        req.user.id,
        req.params.id,
        req.user.role
      );
      return sendSuccess(res, 'Event cancelled successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async deleteDraftEvent(req, res, next) {
    try {
      await eventService.deleteDraftEvent(
        req.user.id,
        req.params.id,
        req.user.role
      );
      return sendSuccess(res, 'Draft event deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  async uploadBanner(req, res, next) {
    try {
      if (!req.file) {
        return sendError(res, 'No image file uploaded', [], 400);
      }
      const result = await uploadToCloudinary(req.file.buffer, 'eventify/banners');
      return sendSuccess(res, 'Image uploaded successfully', result);
    } catch (err) {
      next(err);
    }
  },
};
