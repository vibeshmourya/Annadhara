import api from './axios';

// Authentication & Profile
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Organizations
export const organizationApi = {
  getAll: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  verify: (id, data) => api.patch(`/organizations/${id}/verify`, data),
};

// Donations
export const donationApi = {
  getAll: (params) => api.get('/donations', { params }),
  getById: (id) => api.get(`/donations/${id}`),
  getMyDonations: () => api.get('/donations/my-donations'),
  create: (donationData) => api.post('/donations', donationData),
  update: (id, donationData) => api.put(`/donations/${id}`, donationData),
  report: (id, reportData) => api.post(`/donations/${id}/report`, reportData),
};

// Reservations
export const reservationApi = {
  getAll: (params) => api.get('/reservations', { params }),
  create: (reservationData) => api.post('/reservations', reservationData),
  updateStatus: (id, statusData) => api.patch(`/reservations/${id}/status`, statusData),
  cancel: (id, cancelData) => api.post(`/reservations/${id}/cancel`, cancelData),
};

// Pickups
export const pickupApi = {
  getAll: (params) => api.get('/pickups', { params }),
  getById: (id) => api.get(`/pickups/${id}`),
  claim: (id) => api.post(`/pickups/${id}/claim`),
  updateStatus: (id, statusData) => api.patch(`/pickups/${id}/status`, statusData),
};

// Handover
export const handoverApi = {
  confirm: (handoverData) => api.post('/handover/confirm', handoverData),
  getByReservation: (reservationId) => api.get(`/handover/reservation/${reservationId}`),
};

// Notifications
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// Admin
export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/status`),
  getReportedDonations: () => api.get('/admin/reported-donations'),
  resolveDonationReport: (id, data) => api.patch(`/admin/donations/${id}/resolve-report`, data),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};

