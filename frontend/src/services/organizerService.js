import api from './api.js';

export const organizerService = {
  async getDashboard() {
    return await api.get('/organizer/dashboard');
  },

  async getMyEvents() {
    return await api.get('/organizer/events');
  },

  async getAttendees(params = {}) {
    return await api.get('/organizer/attendees', { params });
  },

  async getAnalytics() {
    return await api.get('/organizer/analytics');
  },
};
