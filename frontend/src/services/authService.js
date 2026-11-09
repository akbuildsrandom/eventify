import api from './api.js';

export const authService = {
  async register(data) {
    return await api.post('/auth/register', data);
  },

  async login(credentials) {
    return await api.post('/auth/login', credentials);
  },

  async logout() {
    return await api.post('/auth/logout');
  },

  async getMe() {
    return await api.get('/auth/me');
  },

  async updateProfile(data) {
    return await api.put('/auth/profile', data);
  },

  async changePassword(data) {
    return await api.put('/auth/change-password', data);
  },

  async forgotPassword(email) {
    return await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(data) {
    return await api.post('/auth/reset-password', data);
  },

  async verifyEmail(token) {
    return await api.post('/auth/verify-email', { token });
  },
};
