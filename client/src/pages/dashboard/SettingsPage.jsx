import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, User, Lock, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import { useAuthStore } from '../../stores/authStore.js';
import { cn } from '../../lib/utils.js';

const profileSchema = z.object({ name: z.string().min(2).max(100) });
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const TABS = [['profile', User, 'Profile'], ['security', Lock, 'Security'], ['notifications', Bell, 'Notifications']];

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name || '' } });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const profileMutation = useMutation({
    mutationFn: (data) => api.patch('/users/profile', data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      toast.success('Profile updated');
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => api.patch('/users/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      passwordForm.reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Password change failed'),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Tab nav */}
        <aside className="hidden sm:block w-48 shrink-0">
          <div className="card p-2 space-y-0.5">
            {TABS.map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn('sidebar-link w-full', tab === id && 'active')}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {tab === 'profile' && (
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Profile Information</h3>
              <form onSubmit={profileForm.handleSubmit(profileMutation.mutate)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
                  <input {...profileForm.register('name')} className="input" />
                  {profileForm.formState.errors.name && (
                    <p className="text-danger text-xs mt-1">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
                  <input value={user?.email || ''} disabled className="input opacity-60 cursor-not-allowed" />
                  <p className="text-text-muted text-xs mt-1">Email cannot be changed</p>
                </div>
                <button type="submit" disabled={profileMutation.isPending} className="btn-primary flex items-center gap-2">
                  {profileMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {tab === 'security' && (
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Change Password</h3>
              <form onSubmit={passwordForm.handleSubmit(passwordMutation.mutate)} className="space-y-4">
                {[
                  ['currentPassword', 'Current Password'],
                  ['newPassword', 'New Password'],
                  ['confirmPassword', 'Confirm New Password'],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
                    <input {...passwordForm.register(field)} type="password" placeholder="••••••••" className="input" />
                    {passwordForm.formState.errors[field] && (
                      <p className="text-danger text-xs mt-1">{passwordForm.formState.errors[field].message}</p>
                    )}
                  </div>
                ))}
                <button type="submit" disabled={passwordMutation.isPending} className="btn-primary flex items-center gap-2">
                  {passwordMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Update Password
                </button>
              </form>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Notification Preferences</h3>
              <p className="text-text-secondary text-sm">Notification preferences coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
