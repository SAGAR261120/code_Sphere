import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications.js';
import { EmptyState } from '../../components/shared/EmptyState.jsx';
import { formatDate } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

const TYPE_COLORS = {
  task_reward: 'bg-warning/10 text-warning border-warning/20',
  purchase: 'bg-success/10 text-success border-success/20',
  deposit_approved: 'bg-success/10 text-success border-success/20',
  deposit_rejected: 'bg-danger/10 text-danger border-danger/20',
  referral_reward: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  system: 'bg-primary/10 text-primary border-primary/20',
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.notifications || [];
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-text-secondary mt-1">Stay updated on your activity</p>
        </div>
        <button
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || notifications.every((n) => n.isRead)}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          {markAllRead.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
          Mark all read
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize', filter === f ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2')}
          >
            {f}
            {f === 'unread' && notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="ml-1.5 bg-danger text-white text-xs px-1.5 rounded-full">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description={filter === 'unread' ? "You're all caught up!" : "No notifications yet."} />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n._id}
              className={cn('card p-4 flex gap-4 transition-colors', !n.isRead && 'border-primary/30 bg-primary/5')}
            >
              <div className={cn('shrink-0 w-2 h-2 rounded-full mt-2', n.isRead ? 'bg-transparent' : 'bg-primary')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-text-primary text-sm">{n.title}</p>
                    <p className="text-text-secondary text-sm mt-0.5">{n.message}</p>
                  </div>
                  <span className={cn('badge border shrink-0', TYPE_COLORS[n.type] || TYPE_COLORS.system)}>
                    {n.type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-text-muted text-xs">{formatDate(n.createdAt)}</p>
                  {!n.isRead && (
                    <button
                      onClick={() => markRead.mutate(n._id)}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <Check size={12} /> Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
