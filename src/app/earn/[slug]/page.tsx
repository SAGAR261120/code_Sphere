'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMarketplace } from '@/context/marketplace-context';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { formatCoins } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  Lock,
  Flame,
  Award,
  AlertCircle,
  ExternalLink,
  PlayCircle,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Zap,
  Info,
  Check,
  Video,
  FileText,
} from 'lucide-react';

interface TaskMediaItem {
  id: string;
  mediaType: string;
  url: string;
  caption?: string | null;
}

interface TaskDetail {
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
  ineligibilityReason?: string | null;
  activeAttempt?: {
    attemptId: string;
    sessionToken: string;
    createdAt: string;
    requiredDurationSeconds: number;
  } | null;
  providerId?: string | null;
  provider?: any;
  media: TaskMediaItem[];
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, addCoins } = useMarketplace();
  const isAuthenticated = !!user;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active attempt state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isCompletedSuccess, setIsCompletedSuccess] = useState<boolean>(false);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);
  const [callbackInput, setCallbackInput] = useState<string>('');

  const fetchTask = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/v1/tasks/${slug}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Task not found or unavailable');
      }
      const json = await res.json();
      if (json.success && json.data) {
        const t: TaskDetail = json.data;
        setTask(t);

        // Resume active attempt if present
        if (t.activeAttempt) {
          setAttemptId(t.activeAttempt.attemptId);
          setSessionToken(t.activeAttempt.sessionToken);

          const elapsed = Math.floor(
            (Date.now() - new Date(t.activeAttempt.createdAt).getTime()) / 1000
          );
          const remaining = Math.max(0, t.requiredDurationSeconds - elapsed);
          setSecondsRemaining(remaining);
          setIsTimerRunning(remaining > 0);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load task');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [slug]);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, secondsRemaining]);

  const handleStartTask = async () => {
    if (!task) return;
    setErrorMsg(null);

    if (!isAuthenticated) {
      router.push(`/login?redirect=/earn/${task.slug}`);
      return;
    }

    try {
      const isShortlinkTask = task.verificationMethod === 'CALLBACK' || !!task.providerId;
      const endpoint = isShortlinkTask
        ? `/api/v1/tasks/${task.id}/start-link`
        : '/api/v1/tasks';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to start task');
      }

      const data = json.data;
      setAttemptId(data.attemptId);
      setSessionToken(data.sessionToken);
      setSecondsRemaining(data.requiredDurationSeconds);
      setIsTimerRunning(true);

      // Automatically open target/short-link URL in a new tab if provided
      const destinationUrl = data.shortUrl || data.targetUrl;
      if (destinationUrl) {
        window.open(destinationUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error starting task');
    }
  };

  const handleVerifyCompletion = async () => {
    if (!task || !attemptId || !sessionToken) return;
    setErrorMsg(null);
    setIsVerifying(true);

    try {
      const res = await fetch(`/api/v1/tasks/${task.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          sessionToken,
          callbackCode: callbackInput || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to verify task completion');
      }

      setIsCompletedSuccess(true);
      const coins = json.data.rewardCoins || task.rewardCoins;
      setEarnedCoins(coins);
      if (addCoins) addCoins(coins, `Task Completed: ${task.title}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (errorMsg && !task) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Task Unavailable</h2>
        <p className="text-sm text-slate-500">{errorMsg}</p>
        <Link
          href="/earn"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Earn Dashboard
        </Link>
      </div>
    );
  }

  if (!task) return null;

  const videoMedia = task.media?.find((m) => m.mediaType === 'VIDEO');
  const imageMedia = task.media?.find((m) => m.mediaType === 'IMAGE');

  const totalRequired = task.requiredDurationSeconds;
  const progressPercent = totalRequired > 0 ? Math.min(100, Math.round(((totalRequired - secondsRemaining) / totalRequired) * 100)) : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* 1. Navigation header */}
      <div className="flex items-center justify-between">
        <Link
          href="/earn"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to Earn CPC Coins
        </Link>

        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Task ID: {task.id.slice(0, 8)}...
        </span>
      </div>

      {/* 2. Success Banner if completed */}
      {isCompletedSuccess && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30 p-6 text-center space-y-3 animate-fade-in shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            +{earnedCoins} CPC Coins Credited!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Your task verification has been confirmed and settled into your double-entry ledger wallet.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/wallet"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-sky-600 transition-colors"
            >
              View Wallet Ledger
            </Link>
            <Link
              href="/earn"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              Explore More Tasks
            </Link>
          </div>
        </div>
      )}

      {/* 3. Main Task Overview Hero */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20 font-bold">
                {task.category}
              </span>
              <span className="text-xs text-slate-400">• {task.difficulty}</span>
              <span className="text-xs text-slate-400">• {task.taskType}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {task.title}
            </h1>
          </div>

          <div className="text-left md:text-right shrink-0">
            <span className="text-[11px] text-slate-400 block">Reward Amount</span>
            <span className="text-3xl font-black text-amber-500 tabular-nums">
              +{task.rewardCoins} CPC Coins
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {task.description}
        </p>

        {/* Task specifications strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Required Duration</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <Clock size={14} className="text-sky-500" /> {task.requiredDurationSeconds}s Required
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Cooldown Period</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <RefreshCw size={14} className="text-amber-500" /> {task.cooldownHours}h Interval
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Verification Method</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" /> {task.verificationMethod}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block">Remaining Attempts</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {task.remainingDailyAttempts} Available Today
            </span>
          </div>
        </div>
      </div>

      {/* 4. Embedded Video Player or Media Showcase (if present) */}
      {(videoMedia || task.targetUrl?.includes('youtube') || imageMedia) && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video size={18} className="text-sky-500" /> Instructional Walkthrough & Preview
          </h3>

          {videoMedia?.url?.includes('youtube.com') || videoMedia?.url?.includes('youtu.be') ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
              <iframe
                src={videoMedia.url.replace('watch?v=', 'embed/')}
                title="Instructional Walkthrough"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          ) : imageMedia?.url ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
              <img
                src={imageMedia.url}
                alt={task.title}
                className="object-cover w-full h-full max-h-96"
              />
            </div>
          ) : null}
        </div>
      )}

      {/* 5. Instructions Step-by-Step */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText size={18} className="text-sky-500" /> Step-by-Step Instructions
        </h3>
        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
          {task.instructionsMarkdown}
        </div>
      </div>

      {/* 6. Interactive Task Action Runner */}
      <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-500/5 to-transparent dark:from-sky-950/20 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap size={20} className="text-amber-500" /> Task Session Runner
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Session must be verified after meeting the minimum required duration.
            </p>
          </div>

          {attemptId && (
            <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Session: {attemptId.slice(0, 8)}...
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {!attemptId ? (
          /* State 1: Ready to Start */
          <div className="space-y-4">
            {!task.isEligible ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2.5">
                <Lock size={16} />
                <span>
                  {task.ineligibilityReason || 'This task is currently in cooldown or limit reached.'}
                </span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleStartTask}
                disabled={!task.isEligible}
                className="px-6 py-3 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <PlayCircle size={16} /> Start Task & Launch Session
              </button>

              {task.targetUrl && (
                <a
                  href={task.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink size={14} /> Open External Target
                </a>
              )}
            </div>
          </div>
        ) : (
          /* State 2: In Progress / Verification */
          <div className="space-y-6">
            {/* Progress Bar & Countdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-sky-500 animate-spin" />
                  {secondsRemaining > 0 ? (
                    <>Required Engagement Countdown: <strong className="text-sky-400">{secondsRemaining}s remaining</strong></>
                  ) : (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Engagement Requirement Satisfied!
                    </span>
                  )}
                </span>
                <span className="font-mono text-slate-400">{progressPercent}%</span>
              </div>

              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    secondsRemaining === 0 ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* External Link CTA */}
            {task.targetUrl && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Instructions Target URL</span>
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-sm block">
                    {task.targetUrl}
                  </span>
                </div>
                <a
                  href={task.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 shrink-0"
                >
                  Open Link <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Verification Button */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleVerifyCompletion}
                disabled={secondsRemaining > 0 || isVerifying || isCompletedSuccess}
                className={`px-6 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  secondsRemaining === 0 && !isCompletedSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 animate-bounce'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Verifying Session with Ledger...
                  </>
                ) : isCompletedSuccess ? (
                  <>
                    <Check size={14} /> Claimed & Verified!
                  </>
                ) : secondsRemaining > 0 ? (
                  <>
                    <Clock size={14} /> Wait {secondsRemaining}s to Unlock Claim
                  </>
                ) : (
                  <>
                    <Award size={16} /> Verify & Claim +{task.rewardCoins} CPC Coins
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttemptId(null);
                  setSessionToken(null);
                  setIsTimerRunning(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer px-3 py-2"
              >
                Reset Session
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. Anti-Fraud Rules Notice */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
        <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Rule 6 Compliance: The server validates attempt timing independently. Automated headless scripts, tab throttling manipulation, or tampered session tokens are logged to the security audit table and will permanently void reward eligibility.
        </p>
      </div>
    </div>
  );
}
