import api from '../lib/axios.js';

export const adminService = {
  // Analytics
  getOverviewStats: () => api.get('/admin/analytics/overview'),
  getRevenueChart: (params) => api.get('/admin/analytics/revenue', { params }),
  getUserGrowthChart: (params) => api.get('/admin/analytics/user-growth', { params }),
  getTopProducts: (params) => api.get('/admin/analytics/top-products', { params }),
  getRecentActivity: () => api.get('/admin/analytics/recent-activity'),

  // Users
  listUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  adjustUserCoins: (id, data) => api.post(`/admin/users/${id}/coins`, data),
  adjustUserWallet: (id, data) => api.post(`/admin/users/${id}/wallet`, data),

  // Products
  listProducts: (params) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.patch(`/products/${id}`, data),
  uploadProductThumbnail: (id, formData) => api.post(`/products/${id}/thumbnail`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadProductFile: (id, formData) => api.post(`/products/${id}/file`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  changeProductStatus: (id, data) => api.patch(`/products/${id}/status`, data),

  // Tasks
  listTasks: (params) => api.get('/admin/tasks', { params }),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.patch(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),

  // Orders
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  refundOrder: (id) => api.post(`/admin/orders/${id}/refund`),

  // Deposits
  getDeposits: (params) => api.get('/admin/deposits', { params }),
  approveDeposit: (id) => api.patch(`/admin/deposits/${id}/approve`),
  rejectDeposit: (id, data) => api.patch(`/admin/deposits/${id}/reject`, data),

  // Coupons
  listCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  toggleCoupon: (id) => api.patch(`/admin/coupons/${id}/toggle`),
};
