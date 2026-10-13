'use client';

import React from 'react';
import Link from 'next/link';
import { Coins, PlusCircle, Zap, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import { useMarketplace } from '@/context/marketplace-context';
import { formatCoins, formatCurrencyINR } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function CPCBalanceCard({ className }: { className?: string }) {
  const { coinBalance, user, openDepositModal } = useMarketplace();

  const totalEarned = user?.totalEarnedCoins || 865;
  const totalSpent = user?.totalSpentCoins || 180;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-amber-500/5 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-500/10 p-6 sm:p-8 shadow-sm',
        className
      )}
    >
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        {/* Left: Balance info */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Available CPC Coin Balance
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
              Live Ledger
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <div className="flex items-center gap-2.5">
              <Coins size={32} className="text-amber-500 animate-coin shrink-0" />
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
                {formatCoins(coinBalance)}
              </span>
            </div>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              CPC Coins
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Estimated marketplace purchasing power: {formatCurrencyINR(coinBalance)} INR (1 Coin ≈ ₹1.00)
          </p>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={openDepositModal}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <PlusCircle size={16} />
            <span>Deposit Funds</span>
          </button>

          <Link
            href="/earn"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
          >
            <Zap size={16} className="text-amber-500" />
            <span>Earn Coins</span>
          </Link>
        </div>
      </div>

      {/* Stats footer row */}
      <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ArrowDownRight size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Lifetime Earned
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              +{formatCoins(totalEarned)} Coins
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Lifetime Spent
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              -{formatCoins(totalSpent)} Coins
            </div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-end">
          <Link
            href="/wallet"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            <History size={14} />
            <span>View Ledger History</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
