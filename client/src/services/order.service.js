import api from '../lib/axios.js';

export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (page = 1) => api.get('/orders/my', { params: { page } }),
  getOrder: (id) => api.get(`/orders/my/${id}`),
  getDownloadToken: (id) => api.get(`/orders/my/${id}/download-token`),
  verifyPayment: (data) => api.post('/payments/razorpay/verify', data),
};
