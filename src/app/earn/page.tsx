'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/context/marketplace-context';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCoins } from '@/lib/utils';
import {
  Zap,
  Clock,
  CheckCircle2,
  Lock,
  Flame,
  Award,
  AlertCircle,
  ExternalLink,
  CalendarCheck,
  Eye,
  PlayCircle,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface TaskMediaItem {
  id: string;
  mediaType: string;
  url: string;
  caption?: string | null;
}

interface TaskItem {
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
  isEligible: boolean;
  cooldownRemainingSeconds: number;
  nextEligibleAt?: string | null;
  remainingDailyAttempts: number;
  userCompletedToday: boolean;
  ineligibilityReason?: string | null;
  activeAttempt?: {
    attemptId: string;
    sessionToken: string;
    createdAt: string;
    requiredDurationSeconds: number;
  } | null;
  media?: TaskMediaItem[];
}

interface UserStats {
  currentBalance: number;
  earnedToday: number;
  pendingRewards: number;
  availableTodayCoins: number;
  activeStreakDays: number;
  completedCountToday: number;
}

interface HistoryItem {
  id: string;
  taskId: string;
  taskTitle: string;
  taskType: string;
  rewardCoins: number;
  completedAt: string;
  verificationReference?: string | null;
}

export default function EarnPage() {
  const { coinBalance } = useMarketplace();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    currentBalance: 0,
    earnedToday: 0,
    pendingRewards: 0,
    availableTodayCoins: 0,
    activeStreakDays: 0,
    completedCountToday: 0,
  });
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchTasksData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/tasks', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTasks(json.data.tasks || []);
          if (json.data.userStats) setUserStats(json.data.userStats);
          if (json.data.recentHistory) setRecentHistory(json.data.recentHistory);
        }
      }
    } catch (err) {
      console.error('Failed to load earn tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  // Filter tasks based on selected tab
  const filteredTasks = tasks.filter((task) => {
    if (filterType === 'AVAILABLE') return task.isEligible;
    if (filterType === 'COOLDOWN') return !task.isEligible && task.cooldownRemainingSeconds > 0;
    if (filterType === 'COMPLETED') return task.userCompletedToday;
    return true;
  });

  const featuredTask = tasks.find((t) => t.isEligible && t.rewardCoins >= 50) || tasks[0];

  const formatSeconds = (sec: number) => {
    if (sec <= 0) return 'Available Now';
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="rounded-3xl border border-amber-200 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white dark:from-amber-500/10 dark:via-slate-900/60 dark:to-slate-900 p-6 sm:p-8 relative overflow-hidden transition-colors shadow-xs">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-500 border border-amber-500/30 font-bold flex items-center gap-1">
              <Zap size={11} /> CPC Reward Economy
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Refreshes every 24 hours UTC</span>
            <button
              onClick={fetchTasksData}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors ml-auto cursor-pointer"
              title="Refresh task statuses"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Earn CPC Coins Through Verified Developer Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Support creators, test product releases, review software architectures, and participate in developer surveys to earn coins. Use your coins to acquire and download source code across the marketplace.
          </p>
        </div>

        {/* 2. Top Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-white/10 relative z-10">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Your Coin Balance</span>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
              {formatCoins(userStats.currentBalance || coinBalance)} Coins
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Earned Today</span>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              +{userStats.earnedToday} Coins
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Daily Active Streak</span>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-300 mt-0.5 flex items-center gap-1.5">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              {userStats.activeStreakDays} {userStats.activeStreakDays === 1 ? 'Day' : 'Days'}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Available to Earn</span>
            <div className="text-xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5 tabular-nums">
              +{userStats.availableTodayCoins} Coins
            </div>
          </div>
        </div>
      </div>

      {/* 3. Featured Task Spotlight (if available) */}
      {featuredTask && (
        <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 p-6 relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                  <Sparkles size={11} /> Featured Daily Opportunity
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {featuredTask.category} • {featuredTask.difficulty}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {featuredTask.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {featuredTask.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-slate-400" /> {featuredTask.requiredDurationSeconds}s Required Duration
                </span>
                <span className="flex items-center gap-1">
                  <RefreshCw size={13} className="text-slate-400" /> Cooldown: {featuredTask.cooldownHours}h
                </span>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
              <div className="text-left md:text-right">
                <span className="text-[11px] text-slate-400 block">Completion Reward</span>
                <span className="text-2xl font-black text-amber-400 tabular-nums">
                  +{featuredTask.rewardCoins} CPC Coins
                </span>
              </div>
              <Link
                href={`/earn/${featuredTask.slug}`}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-lg shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                {featuredTask.activeAttempt ? 'Continue Task' : 'Start Task'} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'All Tasks', count: tasks.length },
            { id: 'AVAILABLE', label: 'Available', count: tasks.filter((t) => t.isEligible).length },
            { id: 'COOLDOWN', label: 'In Cooldown', count: tasks.filter((t) => !t.isEligible && t.cooldownRemainingSeconds > 0).length },
            { id: 'COMPLETED', label: 'Completed Today', count: tasks.filter((t) => t.userCompletedToday).length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === tab.id
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterType === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <ShieldCheck size={14} className="text-emerald-500" />
          Anti-Fraud Protected • Server-Verified
        </div>
      </div>

      {/* 5. Tasks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Tasks in this Filter"
          description={
            filterType === 'AVAILABLE'
              ? 'You have completed all currently available tasks! Check back when cooldowns expire.'
              : 'No tasks match the selected filter.'
          }
          actionText="View All Tasks"
          onAction={() => setFilterType('ALL')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const isCompleted = task.userCompletedToday;
            const inCooldown = !task.isEligible && task.cooldownRemainingSeconds > 0;
            const hasActiveAttempt = !!task.activeAttempt;

            return (
              <div
                key={task.id}
                className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  hasActiveAttempt
                    ? 'border-sky-500/60 bg-sky-500/5 dark:bg-sky-950/20 shadow-md'
                    : inCooldown
                    ? 'border-amber-500/30 bg-amber-500/5 dark:bg-slate-900/60'
                    : isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-slate-900/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-sky-500/40 hover:shadow-lg'
                }`}
              >
                <div className="space-y-3">
                  {/* Category & Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {task.category}
                    </span>

                    {hasActiveAttempt ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center gap-1 animate-pulse">
                        <PlayCircle size={12} /> In Progress
                      </span>
                    ) : inCooldown ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                        <Clock size={12} /> Next: {formatSeconds(task.cooldownRemainingSeconds)}
                      </span>
                    ) : isCompleted ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Completed Today
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-sky-400 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Requirements chips */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" /> {task.requiredDurationSeconds}s Required
                    </span>
                    <span className="flex items-center gap-1">
                      <RefreshCw size={12} className="text-slate-400" /> Cooldown: {task.cooldownHours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={12} className="text-slate-400" /> {task.difficulty}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Reward & Action */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold text-amber-500 tabular-nums">
                      +{task.rewardCoins}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Coins
                    </span>
                  </div>

                  <Link
                    href={`/earn/${task.slug}`}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      hasActiveAttempt
                        ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30'
                        : task.isEligible
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-sky-600 dark:hover:bg-sky-500 dark:hover:text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {hasActiveAttempt ? (
                      <>Continue Task <ArrowRight size={13} /></>
                    ) : task.isEligible ? (
                      <>Start Task <ArrowRight size={13} /></>
                    ) : (
                      <>View Details <ExternalLink size={13} /></>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Recent Earnings History */}
      {recentHistory.length > 0 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Task Earnings History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified rewards credited directly into your CPC Coin ledger
              </p>
            </div>
            <Link
              href="/wallet"
              className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition-colors flex items-center gap-1"
            >
              View Full Wallet Ledger <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                      {item.taskTitle}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.completedAt).toLocaleString()} • Ref: {item.verificationReference?.slice(0, 16)}...
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-500 text-sm">
                    +{item.rewardCoins} Coins
                  </span>
                  <span className="text-[10px] text-slate-400 block">Verified & Settled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Anti-Fraud & Guidelines Notice */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
        <AlertCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            CPC Marketplace Task Verification Policy
          </p>
          <p className="leading-relaxed">
            All tasks are protected by cryptographic attempt tracking and duration verification. Exiting instructional sessions prematurely, utilizing automated headless agents, or replaying callbacks will flag attempts as fraudulent and disqualify rewards.
          </p>
        </div>
      </div>
    </div>
  );
}
