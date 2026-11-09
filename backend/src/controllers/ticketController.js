import { ticketService } from '../services/ticketService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const ticketController = {
  async getMyTickets(req, res, next) {
    try {
      const tickets = await ticketService.getUserTickets(req.user.id);
      return sendSuccess(res, 'User tickets retrieved successfully', { tickets });
    } catch (err) {
      next(err);
    }
  },

  async getTicketById(req, res, next) {
    try {
      const ticket = await ticketService.getTicketById(
        req.params.id,
        req.user.id,
        req.user.role
      );
      return sendSuccess(res, 'Ticket details retrieved successfully', { ticket });
    } catch (err) {
      next(err);
    }
  },

  async verifyAndCheckInTicket(req, res, next) {
    try {
      const result = await ticketService.verifyAndCheckInTicket(
        req.user.id,
        req.body,
        req.user.role
      );
      const statusCode = result.valid ? 200 : 400;
      return res.status(statusCode).json({
        success: result.valid,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async getEventCheckInStats(req, res, next) {
    try {
      const stats = await ticketService.getEventCheckInStats(
        req.user.id,
        req.params.eventId,
        req.user.role
      );
      return sendSuccess(res, 'Check-in statistics retrieved successfully', { stats });
    } catch (err) {
      next(err);
    }
  },
};
