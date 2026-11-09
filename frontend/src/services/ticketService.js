import api from './api.js';

export const ticketService = {
  async getMyTickets() {
    return await api.get('/tickets/my');
  },

  async getTicketById(id) {
    return await api.get(`/tickets/${id}`);
  },

  async checkInTicket(data) {
    return await api.post('/tickets/check-in', data);
  },

  async getEventCheckInStats(eventId) {
    return await api.get(`/tickets/events/${eventId}/stats`);
  },
};
