import { useState } from 'react';
import { useTasks, useTaskHistory } from '../../hooks/useTasks.js';
import { TaskCard } from '../../components/tasks/TaskCard.jsx';
import { PageLoader } from '../../components/shared/PageLoader.jsx';
import { EmptyState } from '../../components/shared/EmptyState.jsx';
import { CheckSquare, Clock, Coins } from 'lucide-react';
import { formatDate, formatCoins, cn } from '../../lib/utils.js';

const STATUS_COLORS = {
  completed: 'text-success bg-success/10',
  fraud: 'text-danger bg-danger/10',
  failed: 'text-danger bg-danger/10',
  pending: 'text-warning bg-warning/10',
};

export default function TasksPage() {
  const [tab, setTab] = useState('available');
  const [page, setPage] = useState(1);

  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { data: history, isLoading: loadingHistory } = useTaskHistory(page);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Task Center</h1>
        <p className="text-text-secondary mt-1">Complete tasks to earn coins</p>
      </div>

      <div className="flex border-b border-border mb-6">
        {[['available', 'Available Tasks'], ['history', 'My History']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'available' && (
        <>
          {loadingTasks ? <PageLoader /> : !tasks?.length ? (
            <EmptyState icon={CheckSquare} title="No tasks available" description="Check back later for new tasks." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => <TaskCard key={task._id} task={task} />)}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          {loadingHistory ? <PageLoader /> : !history?.sessions?.length ? (
            <EmptyState icon={Clock} title="No task history" description="Complete your first task to see it here." />
          ) : (
            <div className="card">
              <div className="divide-y divide-border">
                {history.sessions.map((s) => (
                  <div key={s._id} className="flex items-center gap-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary text-sm truncate">{s.taskId?.title || 'Unknown Task'}</p>
                      <p className="text-text-muted text-xs">{formatDate(s.createdAt)}</p>
                    </div>
                    <span className={cn('badge text-xs', STATUS_COLORS[s.status] || 'bg-surface-2 text-text-muted')}>
                      {s.status}
                    </span>
                    {s.coinsAwarded > 0 && (
                      <span className="flex items-center gap-1 text-warning text-sm font-semibold">
                        <Coins size={12} /> +{formatCoins(s.coinsAwarded)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {history.pagination?.pages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-border">
                  {Array.from({ length: history.pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm ${page === p ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
