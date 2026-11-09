import api from './api.js';

export const bookingService = {
  async createBooking(data, idempotencyKey = null) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return await api.post('/bookings', data, { headers });
  },

  async getMyBookings() {
    return await api.get('/bookings/my');
  },

  async getBookingById(id) {
    return await api.get(`/bookings/${id}`);
  },

  async cancelBooking(id) {
    return await api.post(`/bookings/${id}/cancel`);
  },
};
