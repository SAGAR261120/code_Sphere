import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Clock, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useStartTask } from '../../hooks/useTasks.js';
import { formatCoins, cn } from '../../lib/utils.js';
import { TaskTimer } from './TaskTimer.jsx';

const TYPE_ICONS = { visit: '🌐', signup: '📝', watch: '▶️', download: '⬇️', social: '📱' };

export function TaskCard({ task }) {
  const [sessionData, setSessionData] = useState(null);
  const { mutate: startTask, isPending } = useStartTask();

  const handleStart = () => {
    startTask(task._id, {
      onSuccess: (data) => {
        setSessionData(data);
        window.open(data.redirectUrl, '_blank', 'noopener,noreferrer');
      },
    });
  };

  if (sessionData) {
    return (
      <TaskTimer
        task={task}
        sessionToken={sessionData.sessionToken}
        requiredDuration={sessionData.requiredDuration}
        onComplete={() => setSessionData(null)}
      />
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'card relative overflow-hidden',
        task.isCompleted && 'opacity-70'
      )}
    >
      {task.isCompleted && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-success text-xs font-medium">
          <CheckCircle2 size={14} /> Completed
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className="text-2xl">{TYPE_ICONS[task.taskType] || '🔗'}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate pr-16">{task.title}</h3>
          {task.description && (
            <p className="text-text-secondary text-sm mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-warning font-semibold">
          <Coins size={16} />
          <span>+{formatCoins(task.rewardCoins)} coins</span>
        </div>
        <div className="flex items-center gap-1 text-text-muted text-sm">
          <Clock size={12} />
          <span>{task.requiredDuration}s required</span>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={isPending || task.isCompleted}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all',
          task.isCompleted
            ? 'bg-surface-2 text-text-muted cursor-not-allowed'
            : 'btn-primary'
        )}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : task.isCompleted ? (
          <><CheckCircle2 size={14} /> Done</>
        ) : (
          <><ExternalLink size={14} /> Start Task</>
        )}
      </button>
    </motion.div>
  );
}
