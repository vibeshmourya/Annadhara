import api from './axios';

// Authentication
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// User Profile (Phase 1 /api/users/me)
export const userApi = {
  getMyProfile: () => api.get('/users/me'),
  updateMyProfile: (profileData) => api.patch('/users/me', profileData),
};

// Organizations
export const organizationApi = {
  getAll: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  getMyOrg: () => api.get('/organizations/me'),
  create: (data) => api.post('/organizations', data),
  updateMyOrg: (data) => api.patch('/organizations/me', data),
  verify: (id, data) => api.patch(`/organizations/${id}/verify`, data),
};

// Donations
export const donationApi = {
  getAll: (params) => api.get('/donations', { params }),
  getById: (id) => api.get(`/donations/${id}`),
  getMyDonations: () => api.get('/donations/my-donations'),
  create: (donationData) => api.post('/donations', donationData),
  update: (id, donationData) => api.put(`/donations/${id}`, donationData),
  cancel: (id) => api.delete(`/donations/${id}`),
  report: (id, reportData) => api.post(`/donations/${id}/report`, reportData),
};

// Reservations
export const reservationApi = {
  getAll: (params) => api.get('/reservations', { params }),
  getById: (id) => api.get(`/reservations/${id}`),
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
  getOrganizations: (params) => api.get('/admin/organizations', { params }),
  verifyOrganization: (id, data) => api.patch(`/admin/organizations/${id}/verification`, data),
  getReportedDonations: () => api.get('/admin/reported-donations'),
  resolveDonationReport: (id, data) => api.patch(`/admin/donations/${id}/resolve-report`, data),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};
