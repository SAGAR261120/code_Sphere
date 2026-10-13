'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Coins,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface AttemptStatusResponse {
  attemptId: string;
  status: string;
  isVerified: boolean;
  isPending: boolean;
  coinsAwarded: number;
  taskTitle: string;
  taskSlug: string;
  providerName: string;
  providerSlug: string | null;
  requiresManualReview: boolean;
  timeSpentSeconds: number | null;
  createdAt: string;
  completedAt: string | null;
}

function TaskReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams.get('attemptId');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttemptStatusResponse | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const MAX_POLLS = 15; // 15 polls * 3s = 45 seconds max polling window

  const checkStatus = async () => {
    if (!attemptId) {
      setErrorMsg('No task attempt identifier provided.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/tasks/attempts/${attemptId}/status`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error?.message || 'Unable to retrieve attempt verification state');
        setLoading(false);
        return;
      }

      const statusData: AttemptStatusResponse = json.data;
      setData(statusData);

      // If verified or rejected, stop loading
      if (statusData.isVerified || statusData.status === 'REJECTED' || statusData.status === 'FLAGGED_FRAUD') {
        setLoading(false);
        return;
      }

      // If provider requires manual review (e.g. GPLinks), stop immediately and display transparent notice
      if (statusData.requiresManualReview) {
        setLoading(false);
        return;
      }

      // Continue polling if still in STARTED or PENDING_VERIFICATION
      setPollCount((prev) => {
        const next = prev + 1;
        if (next >= MAX_POLLS) {
          setIsTimedOut(true);
          setLoading(false);
        }
        return next;
      });
    } catch {
      setErrorMsg('Network error while checking verification status');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [attemptId]);

  useEffect(() => {
    if (!loading || isTimedOut || data?.isVerified || data?.requiresManualReview) return;

    const timer = setTimeout(() => {
      checkStatus();
    }, 3000);

    return () => clearTimeout(timer);
  }, [pollCount, loading, isTimedOut, data]);

  if (!attemptId) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-lg">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Invalid Return Request</h2>
          <p className="text-sm text-muted-foreground mb-6">
            No valid task attempt ID was passed. Browser redirects cannot be verified without an active server attempt reference.
          </p>
          <Link
            href="/earn"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Return to Earn Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-card border border-border rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* STATE 1: POLLING / PROCESSING */}
        {loading && !isTimedOut && !errorMsg && (
          <div className="space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Loader2 className="w-8 h-8 text-primary animate-pulse" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
                <Clock className="w-3.5 h-3.5" />
                Awaiting Provider Callback
              </span>
              <h2 className="text-2xl font-bold tracking-tight">
                Verifying Short-Link Completion
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Listening for genuine server-to-server confirmation from{' '}
                <span className="font-semibold text-foreground">
                  {data?.providerName || 'link provider'}
                </span>
                . Please keep this window open.
              </p>
            </div>

            <div className="bg-muted/40 rounded-2xl p-4 text-xs space-y-2 border border-border/50 text-left">
              <div className="flex justify-between text-muted-foreground">
                <span>Attempt Reference:</span>
                <span className="font-mono text-foreground font-medium">
                  {attemptId.slice(0, 8)}...{attemptId.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Verification Method:</span>
                <span className="font-medium text-foreground">
                  Signed Server Callback
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Status Check:</span>
                <span className="text-primary font-medium">
                  Polling attempt {pollCount} of {MAX_POLLS}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/80">
              Rule 6 Enforced: Rewards are issued only upon cryptographically verified server callbacks. Client parameters do not trigger credits.
            </p>
          </div>
        )}

        {/* STATE 2: VERIFIED SUCCESS */}
        {!loading && data?.isVerified && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border-2 border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 mb-2">
                Verified & Credited
              </span>
              <h2 className="text-2xl font-bold tracking-tight">
                Reward Successfully Claimed!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Completed {data.taskTitle} via {data.providerName}.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6">
              <div className="text-xs uppercase tracking-wider font-semibold text-amber-500 mb-1">
                CPC Coins Credited
              </div>
              <div className="flex items-center justify-center gap-2 text-3xl font-black text-amber-500">
                <Coins className="w-8 h-8 fill-amber-500/20" />
                +{data.coinsAwarded}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Credited directly to your wallet with an append-only double-entry ledger receipt.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/earn"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                Back to Earn
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/wallet"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card font-semibold hover:bg-muted/50 transition-colors"
              >
                View Wallet
              </Link>
            </div>
          </div>
        )}

        {/* STATE 3: MANUAL REVIEW / GPLINKS TRANSPARENCY NOTICE */}
        {!loading && data?.requiresManualReview && !data.isVerified && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border-2 border-blue-500/20">
              <Clock className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 mb-2">
                Logged & Pending Verification
              </span>
              <h2 className="text-2xl font-bold tracking-tight">
                Engagement Attempt Recorded
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your session through <span className="font-semibold text-foreground">{data.providerName}</span> has been logged into the compliance ledger.
              </p>
            </div>

            <div className="bg-muted/40 border border-border rounded-2xl p-5 text-left text-xs space-y-3">
              <div className="flex items-start gap-2.5 text-foreground font-medium">
                <ShieldAlert className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Why is my reward in a pending state?</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                As per our strict financial integrity rules, {data.providerName} does not provide real-time signed postback webhooks. To protect against automated redirect forgery, this provider requires manual administrative confirmation before issuing CPC Coins.
              </p>
              <div className="pt-2 border-t border-border/50 flex justify-between text-muted-foreground">
                <span>Task:</span>
                <span className="font-medium text-foreground">{data.taskTitle}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Attempt ID:</span>
                <span className="font-mono text-foreground">{data.attemptId.slice(0, 12)}...</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/earn"
                className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Return to Earn Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* STATE 4: TIMED OUT (NO CALLBACK DELIVERED YET) */}
        {!loading && isTimedOut && !data?.isVerified && !data?.requiresManualReview && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border-2 border-amber-500/20">
              <Clock className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 mb-2">
                Callback Still Pending
              </span>
              <h2 className="text-2xl font-bold tracking-tight">
                Awaiting Provider Postback
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                We haven&apos;t received a signed completion event from {data?.providerName || 'the provider'} yet.
              </p>
            </div>

            <div className="bg-muted/40 border border-border rounded-2xl p-4 text-left text-xs space-y-2 text-muted-foreground">
              <p>
                Some shortlink networks delay webhooks by 1–5 minutes. If you completed all required steps, your reward will automatically be credited once the signed event reaches our server.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setPollCount(0);
                  setIsTimedOut(false);
                  setLoading(true);
                  checkStatus();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card font-semibold hover:bg-muted/50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Check Again
              </button>
              <Link
                href="/earn"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Earn Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* STATE 5: ERROR OR REJECTED */}
        {errorMsg && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border-2 border-rose-500/20">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 mb-2">
                Verification Failed
              </span>
              <h2 className="text-2xl font-bold tracking-tight">
                Unable to Verify Attempt
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {errorMsg}
              </p>
            </div>

            <Link
              href="/earn"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Return to Earn Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <TaskReturnContent />
    </Suspense>
  );
}
