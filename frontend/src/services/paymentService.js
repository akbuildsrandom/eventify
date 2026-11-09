import api from './api.js';

export const paymentService = {
  async createPaymentOrder(bookingId) {
    return await api.post('/payments/create-order', { bookingId });
  },

  async verifyPayment(data) {
    return await api.post('/payments/verify', data);
  },
};
