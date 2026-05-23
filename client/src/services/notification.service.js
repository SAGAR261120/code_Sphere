import api from '../lib/axios.js';

export const notificationService = {
  getNotifications: (page = 1) => api.get('/users/notifications', { params: { page } }),
  getUnreadCount: () => api.get('/users/notifications/unread-count'),
  markRead: (id) => api.patch(`/users/notifications/${id}/read`),
  markAllRead: () => api.patch('/users/notifications/read-all'),
};
