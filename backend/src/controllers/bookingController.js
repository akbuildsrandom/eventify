import { bookingService } from '../services/bookingService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const bookingController = {
  async createBooking(req, res, next) {
    try {
      const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
      const booking = await bookingService.createReservation(req.user.id, {
        ...req.body,
        idempotencyKey,
      });

      return sendSuccess(
        res,
        'Tickets reserved successfully. Please complete payment within 10 minutes.',
        { booking },
        201
      );
    } catch (err) {
      next(err);
    }
  },

  async getMyBookings(req, res, next) {
    try {
      const bookings = await bookingService.getUserBookings(req.user.id);
      return sendSuccess(res, 'User bookings retrieved', { bookings });
    } catch (err) {
      next(err);
    }
  },

  async getBookingById(req, res, next) {
    try {
      const booking = await bookingService.getBookingById(
        req.params.id,
        req.user.id,
        req.user.role
      );
      return sendSuccess(res, 'Booking retrieved successfully', { booking });
    } catch (err) {
      next(err);
    }
  },

  async cancelBooking(req, res, next) {
    try {
      await bookingService.cancelBooking(req.user.id, req.params.id);
      return sendSuccess(res, 'Booking cancelled and reserved tickets released successfully');
    } catch (err) {
      next(err);
    }
  },
};
