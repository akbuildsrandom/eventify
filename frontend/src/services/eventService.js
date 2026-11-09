import api from './api.js';

export const eventService = {
  async getEvents(params = {}) {
    return await api.get('/events', { params });
  },

  async getEventById(idOrSlug) {
    return await api.get(`/events/${idOrSlug}`);
  },

  async createEvent(data) {
    return await api.post('/events', data);
  },

  async updateEvent(id, data) {
    return await api.put(`/events/${id}`, data);
  },

  async publishEvent(id) {
    return await api.patch(`/events/${id}/publish`);
  },

  async cancelEvent(id) {
    return await api.patch(`/events/${id}/cancel`);
  },

  async deleteDraftEvent(id) {
    return await api.delete(`/events/${id}`);
  },

  async uploadBanner(file) {
    const formData = new FormData();
    formData.append('banner', file);
    return await api.post('/events/upload-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getVenues() {
    return await api.get('/venues');
  },

  async createVenue(data) {
    return await api.post('/venues', data);
  },
};
