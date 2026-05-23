import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service.js';
import { useNotificationStore } from '../stores/notificationStore.js';
import { useAuthStore } from '../stores/authStore.js';

export function useNotifications(page = 1) {
  const { setNotifications } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['notifications', page],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await notificationService.getNotifications(page);
      if (page === 1) setNotifications(data.data.notifications);
      return data.data;
    },
  });
}

export function useUnreadCount() {
  const { setUnreadCount } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['notifications-count'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await notificationService.getUnreadCount();
      setUnreadCount(data.data.count);
      return data.data.count;
    },
    refetchInterval: 60000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  const { markRead } = useNotificationStore();
  return useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: (_, id) => {
      markRead(id);
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  const { markAllRead } = useNotificationStore();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      markAllRead();
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });
}
