import { reviewService } from '../services/reviewService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const reviewController = {
  async createReview(req, res, next) {
    try {
      const review = await reviewService.createReview(
        req.user.id,
        req.params.id,
        req.body
      );
      return sendSuccess(res, 'Review posted successfully', { review }, 201);
    } catch (err) {
      next(err);
    }
  },

  async getEventReviews(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const data = await reviewService.getEventReviews(req.params.id, page, limit);
      return sendSuccess(res, 'Reviews retrieved', data.reviews, 200, {
        ...data.stats,
        ...data.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteReview(req, res, next) {
    try {
      await reviewService.deleteReview(req.user.id, req.params.id, req.user.role);
      return sendSuccess(res, 'Review deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};
