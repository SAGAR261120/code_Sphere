"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Coins,
  Package,
  CreditCard,
  Zap,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  SlidersHorizontal,
  FileText,
  IndianRupee,
  Activity,
  UserCheck,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { formatCoins, formatDate } from "@/lib/utils";

interface AdminOverviewTabProps {
  onNavigateTab: (tab: any) => void;
  addToast: (title: string, message: string, type: "success" | "error" | "info" | "warning") => void;
}

export function AdminOverviewTab({ onNavigateTab, addToast }: AdminOverviewTabProps) {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch("/api/v1/admin/dashboard");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load dashboard metrics");
      setMetrics(json.data);
      if (isManual) {
        addToast("Dashboard Updated", "Live database metrics synchronized.", "success");
      }
    } catch (err: any) {
      addToast("Failed to Load Dashboard", err.message, "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <RefreshCw className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Loading Executive Dashboard...
        </h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating real-time database ledger and metrics</p>
      </div>
    );
  }

  const { overview, recentActivity } = metrics || { overview: {}, recentActivity: {} };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Live Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-amber-500/10 border border-sky-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Production Database
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Strict Dual-Currency Segregation</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            Executive Marketplace Health & Governance
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMetrics(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-500" : ""}`} />
            <span>Sync Real-Time Metrics</span>
          </button>
        </div>
      </div>

      {/* 2. Dual-Currency Financial Balance Sheet Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: Fiat Revenue (Real Currency) */}
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-transparent dark:from-emerald-950/20 dark:via-emerald-900/10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Fiat Capital & Deposits
                </span>
                <p className="text-[11px] text-slate-500">Official Indian Rupee (INR) Rails</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("DEPOSITS")}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Inspect Deposits</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {overview?.fiatRevenue?.formattedRupees || "₹0.00"}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative fiat processed across confirmed bank & gateway transactions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-emerald-500/20 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Pending Gateway Settlements</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 text-sm">
                {overview?.fiatRevenue?.pendingDepositsCount || 0} orders
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Failed / Expired Payments</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
                {overview?.fiatRevenue?.failedDepositsCount || 0} failed
              </span>
            </div>
          </div>
        </div>

        {/* Card B: CPC Coin Economy (Internal Tokens) */}
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-transparent dark:from-amber-950/20 dark:via-amber-900/10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  CPC Coin Economy
                </span>
                <p className="text-[11px] text-slate-500">Internal Marketplace Credits</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("ECONOMY")}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Ledger Health</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
              {formatCoins(overview?.coinEconomy?.circulatingSupply || 0)}
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Circulating Balance</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-amber-500/20 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Issued</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +{formatCoins(overview?.coinEconomy?.issued || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Redeemed</span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                -{formatCoins(overview?.coinEconomy?.redeemed || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Task Rewards</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {formatCoins(overview?.coinEconomy?.rewardCostsCoins || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Operational Metrics Grid (6 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Users */}
        <div
          onClick={() => onNavigateTab("USERS")}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Users</span>
            <Users className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {overview?.users?.total || 0}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <UserCheck className="w-3 h-3" />
            <span>{overview?.users?.active || 0} Active</span>
          </div>
        </div>

        {/* Metric 2: Products */}
        <div
          onClick={() => onNavigateTab("PRODUCTS")}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Catalog</span>
            <Package className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {overview?.products?.published || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            <span>{overview?.products?.total || 0} packages total</span>
          </div>
        </div>

        {/* Metric 3: Orders Completed */}
        <div
          onClick={() => onNavigateTab("ORDERS")}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Orders</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {overview?.orders?.completedCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            <span>{overview?.orders?.refundedCount || 0} refunded</span>
          </div>
        </div>

        {/* Metric 4: Tasks Completed */}
        <div
          onClick={() => onNavigateTab("TASKS")}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tasks Completed</span>
            <Zap className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {overview?.tasks?.completionsCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            <span>{overview?.tasks?.pendingVerificationCount || 0} pending review</span>
          </div>
        </div>

        {/* Metric 5: Downloads */}
        <div
          onClick={() => onNavigateTab("ORDERS")}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Downloads</span>
            <Download className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {overview?.operations?.downloadsCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            <span>Signed package links</span>
          </div>
        </div>

        {/* Metric 6: Security & Failures */}
        <div
          onClick={() => onNavigateTab("SHORTLINKS")}
          className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 hover:border-rose-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-xs font-semibold">Fraud / Rejections</span>
            <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {overview?.operations?.failedCallbackEventsCount || 0}
          </div>
          <div className="text-[11px] text-rose-500 mt-1 font-medium">
            <span>Rejected postbacks</span>
          </div>
        </div>
      </div>

      {/* 4. Quick Governance Action Shortcuts */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Governance Operations & Module Fast-Jumps
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <button
            onClick={() => onNavigateTab("ORDERS")}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Manage Orders</span>
          </button>
          <button
            onClick={() => onNavigateTab("REVIEWS")}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>Moderate Reviews</span>
          </button>
          <button
            onClick={() => onNavigateTab("SETTINGS")}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" />
            <span>Platform Policies</span>
          </button>
          <button
            onClick={() => onNavigateTab("ECONOMY")}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Ledger Scanner</span>
          </button>
          <button
            onClick={() => onNavigateTab("DEPOSITS")}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            <span>Gateway Rails</span>
          </button>
          <button
            onClick={() => onNavigateTab("SHORTLINKS")}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
            <span>Shortlink Postbacks</span>
          </button>
        </div>
      </div>

      {/* 5. Live Activity Feed Sections (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Orders & Recent Deposits */}
        <div className="space-y-6">
          {/* Recent Orders */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Recent Orders & Entitlements
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("ORDERS")}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                View All
              </button>
            </div>

            {recentActivity?.orders?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent purchases recorded</p>
            ) : (
              <div className="space-y-2.5">
                {recentActivity?.orders?.map((ord: any) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {ord.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {ord.items[0]?.product?.title || "Digital Package"} • {ord.user?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block">
                        {ord.totalCoins > 0 ? `${formatCoins(ord.totalCoins)} Coins` : "FREE"}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(ord.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Deposits */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Recent Fiat Deposits
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("DEPOSITS")}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                View All
              </button>
            </div>

            {recentActivity?.deposits?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No deposit transactions logged</p>
            ) : (
              <div className="space-y-2.5">
                {recentActivity?.deposits?.map((dep: any) => (
                  <div
                    key={dep.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          ₹{(dep.amountFiatPaise / 100).toFixed(2)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            dep.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : dep.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {dep.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{dep.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                        +{formatCoins(dep.coinsToCredit)} Coins
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(dep.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Task Completions & System Audit Trail */}
        <div className="space-y-6">
          {/* Recent Task Completions */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Recent Verified Task Completions
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("TASKS")}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                View Tasks
              </button>
            </div>

            {recentActivity?.taskCompletions?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No task completions recorded yet</p>
            ) : (
              <div className="space-y-2.5">
                {recentActivity?.taskCompletions?.map((tc: any) => (
                  <div
                    key={tc.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {tc.task?.title || "Daily Reward Task"}
                      </span>
                      <p className="text-slate-500 text-[11px] mt-0.5">{tc.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block">
                        +{formatCoins(tc.rewardCoins)} Coins
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(tc.completedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Audit Log Snapshot */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Privileged Operations Audit Log
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("SETTINGS")}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Full Audit Trail
              </button>
            </div>

            {recentActivity?.auditLogs?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No audit logs recorded</p>
            ) : (
              <div className="space-y-2.5">
                {recentActivity?.auditLogs?.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      {log.reason || "Administrative operation"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Operator: {log.admin?.email || "System Super Administrator"} • Target: {log.targetType}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
