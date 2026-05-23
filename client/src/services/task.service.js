import api from '../lib/axios.js';

export const taskService = {
  getTasks: () => api.get('/tasks'),
  getTask: (id) => api.get(`/tasks/${id}`),
  startTask: (id) => api.post(`/tasks/${id}/start`),
  verifyTask: (id, data) => api.post(`/tasks/${id}/verify`, data),
  getHistory: (page = 1) => api.get('/tasks/my/history', { params: { page } }),
  // Admin
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.patch(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getSessions: (params) => api.get('/tasks/admin/sessions', { params }),
};
