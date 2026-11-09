import { venueService } from '../services/venueService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const venueController = {
  async getAllVenues(req, res, next) {
    try {
      const venues = await venueService.getAllVenues();
      return sendSuccess(res, 'Venues retrieved successfully', { venues });
    } catch (err) {
      next(err);
    }
  },

  async createVenue(req, res, next) {
    try {
      const venue = await venueService.createVenue(req.body);
      return sendSuccess(res, 'Venue created successfully', { venue }, 201);
    } catch (err) {
      next(err);
    }
  },
};
