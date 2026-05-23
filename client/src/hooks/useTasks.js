import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { taskService } from '../services/task.service.js';
import { useAuthStore } from '../stores/authStore.js';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getTasks().then((r) => r.data.data),
  });
}

export function useStartTask() {
  return useMutation({
    mutationFn: (id) => taskService.startTask(id).then((r) => r.data.data),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to start task'),
  });
}

export function useVerifyTask() {
  const qc = useQueryClient();
  const { updateCoins } = useAuthStore();
  return useMutation({
    mutationFn: ({ id, sessionToken, verificationData }) =>
      taskService.verifyTask(id, { sessionToken, verificationData }).then((r) => r.data.data),
    onSuccess: (data) => {
      toast.success(`🪙 ${data.coinsAwarded} coins earned!`);
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Verification failed'),
  });
}

export function useTaskHistory(page = 1) {
  return useQuery({
    queryKey: ['task-history', page],
    queryFn: () => taskService.getHistory(page).then((r) => r.data.data),
  });
}
