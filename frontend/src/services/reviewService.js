import api from './api.js';

export const reviewService = {
  async getEventReviews(eventId, params = {}) {
    return await api.get(`/events/${eventId}/reviews`, { params });
  },

  async createReview(eventId, data) {
    return await api.post(`/events/${eventId}/reviews`, data);
  },

  async deleteReview(reviewId) {
    return await api.delete(`/reviews/${reviewId}`);
  },
};

export const notificationService = {
  async getNotifications() {
    return await api.get('/notifications');
  },

  async markAsRead(id) {
    return await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    return await api.patch('/notifications/read-all');
  },
};
