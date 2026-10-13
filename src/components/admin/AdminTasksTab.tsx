'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  RefreshCw,
  Award,
  ShieldAlert,
  BarChart3,
  Flame,
  X,
} from 'lucide-react';
import { formatCoins } from '@/lib/utils';

interface AdminTask {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructionsMarkdown: string;
  rewardCoins: number;
  taskType: string;
  verificationMethod: string;
  requiredDurationSeconds: number;
  cooldownHours: number;
  targetUrl?: string | null;
  category: string;
  difficulty: string;
  isActive: boolean;
  createdAt: string;
  budget?: {
    totalAllocatedCoins: number;
    totalSpentCoins: number;
    isExhausted: boolean;
  } | null;
  rules?: Array<{
    maxDailyCompletions: number;
  }>;
  media?: Array<{
    id: string;
    mediaType: string;
    url: string;
  }>;
  _count?: {
    attempts: number;
    completions: number;
  };
}

interface TaskAnalytics {
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  totalAttempts: number;
  completedAttempts: number;
  fraudAttempts: number;
  completionRate: number;
  fraudRate: number;
  totalCoinsPaid: number;
  totalAllocatedBudget: number;
  remainingBudget: number;
}

interface Props {
  addToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function AdminTasksTab({ addToast }: Props) {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    instructionsMarkdown: '',
    rewardCoins: 50,
    taskType: 'VISIT',
    verificationMethod: 'TIMER',
    requiredDurationSeconds: 30,
    cooldownHours: 24,
    maxDailyCompletions: 1,
    totalBudgetCoins: 10000,
    targetUrl: '',
    externalVideoUrl: '',
    mediaUrl: '',
    category: 'Developer Community',
    difficulty: 'Quick',
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, analyticsRes] = await Promise.all([
        fetch(`/api/v1/admin/tasks?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        fetch('/api/v1/admin/tasks/analytics'),
      ]);

      if (tasksRes.ok) {
        const json = await tasksRes.json();
        setTasks(json.data || []);
      }

      if (analyticsRes.ok) {
        const json = await analyticsRes.json();
        setAnalytics(json.data || null);
      }
    } catch (err: any) {
      addToast('Error', 'Failed to load task management data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      instructionsMarkdown: '1. Click Start Task to launch session.\n2. Review the technical instructions for at least 30 seconds.\n3. Return to claim your CPC Coins.',
      rewardCoins: 50,
      taskType: 'VISIT',
      verificationMethod: 'TIMER',
      requiredDurationSeconds: 30,
      cooldownHours: 24,
      maxDailyCompletions: 1,
      totalBudgetCoins: 10000,
      targetUrl: 'https://github.com',
      externalVideoUrl: '',
      mediaUrl: '',
      category: 'Developer Community',
      difficulty: 'Quick',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (task: AdminTask) => {
    setEditingTask(task);
    const video = task.media?.find((m) => m.mediaType === 'VIDEO');
    const image = task.media?.find((m) => m.mediaType === 'IMAGE');

    setFormData({
      title: task.title,
      slug: task.slug,
      description: task.description,
      instructionsMarkdown: task.instructionsMarkdown,
      rewardCoins: task.rewardCoins,
      taskType: task.taskType,
      verificationMethod: task.verificationMethod,
      requiredDurationSeconds: task.requiredDurationSeconds,
      cooldownHours: task.cooldownHours,
      maxDailyCompletions: task.rules?.[0]?.maxDailyCompletions || 1,
      totalBudgetCoins: task.budget?.totalAllocatedCoins || 10000,
      targetUrl: task.targetUrl || '',
      externalVideoUrl: video?.url || '',
      mediaUrl: image?.url || '',
      category: task.category,
      difficulty: task.difficulty,
      isActive: task.isActive,
    });
    setShowModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTask) {
        // Update
        const res = await fetch(`/api/v1/admin/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Failed to update task');

        addToast('Task Updated', `Task "${formData.title}" updated successfully.`, 'success');
      } else {
        // Create
        const res = await fetch('/api/v1/admin/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Failed to create task');

        addToast('Task Created', `Task "${formData.title}" created successfully.`, 'success');
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (task: AdminTask) => {
    try {
      const res = await fetch(`/api/v1/admin/tasks/${task.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !task.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to toggle status');

      addToast(
        'Status Changed',
        `Task "${task.title}" is now ${!task.isActive ? 'active' : 'paused'}.`,
        'success'
      );
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDuplicate = async (task: AdminTask) => {
    try {
      const res = await fetch(`/api/v1/admin/tasks/${task.id}/duplicate`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to duplicate task');

      addToast('Duplicated', `Duplicated as "${json.data.title}".`, 'success');
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (task: AdminTask) => {
    if (!confirm(`Are you sure you want to permanently delete task "${task.title}"? This action cannot be undone.`)) return;

    // Optimistically remove from list immediately
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== task.id));

    try {
      const res = await fetch(`/api/v1/admin/tasks/${task.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        setTasks(previousTasks);
        throw new Error(json.error?.message || 'Failed to delete task');
      }

      addToast('Task Deleted', `Task "${task.title}" was permanently deleted.`, 'success');
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Analytics KPI Strip */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
              Active / Total
            </span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {analytics.activeTasks} <span className="text-xs text-slate-400 font-normal">/ {analytics.totalTasks}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
              Total Starts
            </span>
            <div className="text-xl font-extrabold text-sky-500 mt-0.5 tabular-nums">
              {analytics.totalAttempts}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
              Completions
            </span>
            <div className="text-xl font-extrabold text-emerald-500 mt-0.5 tabular-nums">
              {analytics.completedAttempts}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
              Completion Rate
            </span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {analytics.completionRate}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
              Fraud Flagged
            </span>
            <div className="text-xl font-extrabold text-rose-500 mt-0.5 tabular-nums flex items-center gap-1">
              <ShieldAlert size={16} /> {analytics.fraudAttempts}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
              Coins Paid Out
            </span>
            <div className="text-xl font-extrabold text-amber-500 mt-0.5 tabular-nums">
              {formatCoins(analytics.totalCoinsPaid)}
            </div>
          </div>
        </div>
      )}

      {/* 2. Filter & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks by title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={14} /> Create Task
          </button>
        </div>
      </div>

      {/* 3. Tasks Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading reward tasks catalog...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No reward tasks found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase font-mono">
                  <th className="py-3 px-4">Task Details</th>
                  <th className="py-3 px-4">Reward</th>
                  <th className="py-3 px-4">Duration & Cooldown</th>
                  <th className="py-3 px-4">Completions & Budget</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((task) => {
                  const spent = task.budget?.totalSpentCoins || 0;
                  const allocated = task.budget?.totalAllocatedCoins || 10000;
                  const budgetPercent = Math.min(100, Math.round((spent / allocated) * 100));

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {task.title}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            /{task.slug} • {task.category}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-amber-500">
                        +{task.rewardCoins} Coins
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div>{task.requiredDurationSeconds}s Required</div>
                        <div className="text-[10px] text-slate-400">{task.cooldownHours}h Cooldown</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-700 dark:text-slate-300 font-semibold">
                          {task._count?.completions || 0} completions
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatCoins(spent)} / {formatCoins(allocated)} Coins ({budgetPercent}%)
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {task.budget?.isExhausted ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Budget Exhausted
                          </span>
                        ) : task.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
                            Paused
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={task.isActive ? 'Pause Task' : 'Resume Task'}
                          >
                            {task.isActive ? <PauseCircle size={15} /> : <PlayCircle size={15} className="text-emerald-500" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Task"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Duplicate Task"
                          >
                            <Copy size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Create / Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                {editingTask ? 'Edit Reward Task' : 'Create New Reward Task'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Inspect Microservices Architecture"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Slug (URL Identifier)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. inspect-microservices"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Short Description *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary displayed on task discovery cards..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Step-by-Step Markdown Instructions *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.instructionsMarkdown}
                  onChange={(e) => setFormData({ ...formData, instructionsMarkdown: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reward Coins *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={formData.rewardCoins}
                    onChange={(e) => setFormData({ ...formData, rewardCoins: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={3600}
                    value={formData.requiredDurationSeconds}
                    onChange={(e) => setFormData({ ...formData, requiredDurationSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cooldown (Hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.cooldownHours}
                    onChange={(e) => setFormData({ ...formData, cooldownHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Daily Limit / User
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.maxDailyCompletions}
                    onChange={(e) => setFormData({ ...formData, maxDailyCompletions: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Task Type
                  </label>
                  <select
                    value={formData.taskType}
                    onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="VISIT">VISIT (External Link)</option>
                    <option value="WATCH">WATCH (Video Walkthrough)</option>
                    <option value="SOCIAL">SOCIAL (Community Join)</option>
                    <option value="TUTORIAL">TUTORIAL (Developer Guide)</option>
                    <option value="SIGNUP">SIGNUP (Partner Portal)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Verification Method
                  </label>
                  <select
                    value={formData.verificationMethod}
                    onChange={(e) => setFormData({ ...formData, verificationMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="TIMER">TIMER (Duration Elapsed)</option>
                    <option value="CALLBACK">CALLBACK (Partner Token)</option>
                    <option value="MANUAL">MANUAL (Staff Approval)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Total Reward Budget
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={formData.totalBudgetCoins}
                    onChange={(e) => setFormData({ ...formData, totalBudgetCoins: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target URL
                  </label>
                  <input
                    type="url"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    External Video URL (YouTube / MP4)
                  </label>
                  <input
                    type="url"
                    value={formData.externalVideoUrl}
                    onChange={(e) => setFormData({ ...formData, externalVideoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white transition-all shadow-md shadow-sky-600/20"
                >
                  {isSubmitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
