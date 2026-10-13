'use client';

import React, { useState, useEffect } from 'react';
import { useMarketplace } from '@/context/marketplace-context';
import { CoinBadge } from '../ui/CoinBadge';
import { Zap, X, CheckCircle2, Clock, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { formatCoins } from '@/lib/utils';

export function TaskModal() {
  const { activeTask, closeTaskModal, addCoins } = useMarketplace();

  const [hasStarted, setHasStarted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (activeTask) {
      setHasStarted(false);
      setIsCompleted(false);
      setSecondsRemaining(activeTask.requiredDurationSeconds);
    }
  }, [activeTask]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasStarted && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, secondsRemaining]);

  if (!activeTask) return null;

  const handleStart = () => {
    setHasStarted(true);
    // Optionally open link in new tab
    if (activeTask.linkUrl) {
      window.open(activeTask.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClaim = () => {
    addCoins(activeTask.rewardCoins, `Completed task: ${activeTask.title}`);
    setIsCompleted(true);
    setTimeout(() => {
      closeTaskModal();
    }, 1200);
  };

  const progressPercent = Math.min(
    100,
    Math.round(
      ((activeTask.requiredDurationSeconds - secondsRemaining) /
        activeTask.requiredDurationSeconds) *
        100
    )
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Daily Reward Task
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Category: {activeTask.category}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeTaskModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Reward banner */}
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-amber-500/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">
                Completion Reward
              </span>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-300 tabular-nums">
                +{formatCoins(activeTask.rewardCoins)} Coins
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                {activeTask.difficulty}
              </div>
              <div>{activeTask.requiredDurationSeconds}s Required</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {activeTask.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {activeTask.description}
            </p>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Step-by-Step Instructions:
            </h5>
            <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {activeTask.instructions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Timer & Verification Status */}
          {hasStarted && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Clock size={14} className="text-sky-500" />
                  Engagement Timer:
                </span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {secondsRemaining > 0 ? `${secondsRemaining}s remaining` : 'Verified & Ready!'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <div>
                <p className="text-xs font-bold">Reward Successfully Claimed!</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  +{activeTask.rewardCoins} CPC Coins added to your wallet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Verification: {activeTask.verificationMethod}
          </span>

          <div className="flex items-center gap-2">
            {!hasStarted ? (
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <span>Launch & Start Timer</span>
                <ExternalLink size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClaim}
                disabled={secondsRemaining > 0 || isCompleted}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Claim {activeTask.rewardCoins} Coins</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
