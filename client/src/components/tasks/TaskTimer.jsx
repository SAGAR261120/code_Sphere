import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Loader2, Coins } from 'lucide-react';
import { useVerifyTask } from '../../hooks/useTasks.js';
import { formatCoins, cn } from '../../lib/utils.js';

export function TaskTimer({ task, sessionToken, requiredDuration, onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const [verified, setVerified] = useState(false);
  const { mutate: verify, isPending } = useVerifyTask();

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const canVerify = elapsed >= requiredDuration;
  const progress = Math.min((elapsed / requiredDuration) * 100, 100);
  const remaining = Math.max(requiredDuration - elapsed, 0);

  const handleVerify = useCallback(() => {
    verify(
      { id: task._id, sessionToken, verificationData: {} },
      {
        onSuccess: () => {
          setVerified(true);
          setTimeout(onComplete, 2000);
        },
      }
    );
  }, [task._id, sessionToken, verify, onComplete]);

  if (verified) {
    return (
      <div className="card text-center py-8">
        <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={28} className="text-success" />
        </div>
        <p className="font-semibold text-text-primary">Coins Earned!</p>
        <p className="text-warning font-bold text-xl mt-1">+{formatCoins(task.rewardCoins)} 🪙</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-4">
        <Clock size={18} className="text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-text-primary">{task.title}</h3>
          <p className="text-text-secondary text-sm">Stay on the task page until the timer completes</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-2 rounded-full mb-3 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex items-center justify-between mb-4 text-sm">
        <span className={cn('font-medium', canVerify ? 'text-success' : 'text-text-secondary')}>
          {canVerify ? '✅ Ready to verify!' : `${remaining}s remaining`}
        </span>
        <span className="text-text-muted">{elapsed}s / {requiredDuration}s</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-warning font-semibold flex items-center gap-1">
          <Coins size={14} /> +{formatCoins(task.rewardCoins)} coins
        </span>
      </div>

      <button
        onClick={handleVerify}
        disabled={!canVerify || isPending}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all',
          canVerify ? 'btn-primary' : 'bg-surface-2 text-text-muted cursor-not-allowed'
        )}
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
        {isPending ? 'Verifying...' : canVerify ? 'Claim Coins' : 'Waiting...'}
      </button>
    </div>
  );
}
