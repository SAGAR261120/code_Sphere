import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Edit, Trash2, X, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service.js';
import { formatCoins, formatDate } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

const taskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  type: z.enum(['watch_ad', 'visit_url', 'survey', 'social_share']),
  coinReward: z.coerce.number().int().min(1),
  requiredDuration: z.coerce.number().int().min(5).max(300),
  url: z.string().url(),
  maxCompletionsPerUser: z.coerce.number().int().min(1).default(1),
  totalBudgetCoins: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

function TaskModal({ task, onClose }) {
  const qc = useQueryClient();
  const isEdit = Boolean(task?._id);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: task || { type: 'visit_url', coinReward: 10, requiredDuration: 30, maxCompletionsPerUser: 1, isActive: true },
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? adminService.updateTask(task._id, data) : adminService.createTask(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Task updated' : 'Task created');
      qc.invalidateQueries({ queryKey: ['admin-tasks'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-lg my-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary">{isEdit ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-2 rounded"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Title *</label>
            <input {...register('title')} className="input" />
            {errors.title && <p className="text-danger text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description *</label>
            <textarea {...register('description')} rows={3} className="input resize-none" />
            {errors.description && <p className="text-danger text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Type *</label>
              <select {...register('type')} className="input">
                <option value="visit_url">Visit URL</option>
                <option value="watch_ad">Watch Ad</option>
                <option value="survey">Survey</option>
                <option value="social_share">Social Share</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Coin Reward *</label>
              <input type="number" {...register('coinReward')} className="input" />
              {errors.coinReward && <p className="text-danger text-xs mt-1">{errors.coinReward.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Required Duration (s) *</label>
              <input type="number" {...register('requiredDuration')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Max Completions/User</label>
              <input type="number" {...register('maxCompletionsPerUser')} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">URL *</label>
            <input {...register('url')} className="input" placeholder="https://..." />
            {errors.url && <p className="text-danger text-xs mt-1">{errors.url.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Total Budget (coins, 0 = unlimited)</label>
            <input type="number" {...register('totalBudgetCoins')} className="input" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
            <span className="text-sm text-text-secondary">Active</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminTasks() {
  const [modal, setModal] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: () => adminService.listTasks(),
    select: (r) => r.data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteTask(id),
    onSuccess: () => { toast.success('Task deleted'); qc.invalidateQueries({ queryKey: ['admin-tasks'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const tasks = data?.tasks || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-text-secondary mt-1">Manage coin-earning tasks</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> New Task
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Task', 'Type', 'Reward', 'Duration', 'Completions', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((t) => (
                  <tr key={t._id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary max-w-xs truncate">{t.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-surface-2 text-text-secondary border-border">{t.type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-warning">
                        <Coins size={13} /> {formatCoins(t.coinReward)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{t.requiredDuration}s</td>
                    <td className="px-4 py-3 text-text-secondary">{t.totalCompletions ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge border', t.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-surface-2 text-text-muted border-border')}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal(t)} className="p-1.5 hover:bg-surface-2 text-text-muted hover:text-text-primary rounded transition-colors">
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${t.title}"?`)) deleteMutation.mutate(t._id); }}
                          className="p-1.5 hover:bg-danger/10 text-text-muted hover:text-danger rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && <TaskModal task={modal._id ? modal : null} onClose={() => setModal(null)} />}
    </div>
  );
}
