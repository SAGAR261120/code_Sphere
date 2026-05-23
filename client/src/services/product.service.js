import api from '../lib/axios.js';

export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (slug) => api.get(`/products/${slug}`),
  getFeatured: (limit = 6) => api.get('/products/featured', { params: { limit } }),
  getCategories: () => api.get('/products/categories'),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.patch(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  updateProductStatus: (id, status, rejectionReason) =>
    api.patch(`/products/${id}/status`, { status, rejectionReason }),
  uploadFile: (id, formData) =>
    api.post(`/products/${id}/file`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
