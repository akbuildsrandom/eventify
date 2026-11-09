import api from './api.js';

export const adminService = {
  async getDashboard() {
    return await api.get('/admin/dashboard');
  },

  async getUsers(params = {}) {
    return await api.get('/admin/users', { params });
  },

  async updateUserRole(id, role) {
    return await api.patch(`/admin/users/${id}/role`, { role });
  },

  async getAllEvents(params = {}) {
    return await api.get('/admin/events', { params });
  },

  async updateEventStatus(id, status) {
    return await api.patch(`/admin/events/${id}/status`, { status });
  },

  async getAllBookings(params = {}) {
    return await api.get('/admin/bookings', { params });
  },

  async getAuditLogs(params = {}) {
    return await api.get('/admin/audit-logs', { params });
  },
};
