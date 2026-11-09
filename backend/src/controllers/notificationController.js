import { notificationService } from '../services/notificationService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const notificationController = {
  async getMyNotifications(req, res, next) {
    try {
      const data = await notificationService.getUserNotifications(req.user.id);
      return sendSuccess(res, 'Notifications retrieved', data);
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.user.id, req.params.id);
      return sendSuccess(res, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      return sendSuccess(res, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  },
};
