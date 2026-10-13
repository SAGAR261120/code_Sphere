'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/context/marketplace-context';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { formatCoins, formatDate, formatCurrencyINR } from '@/lib/utils';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  FileText,
  Filter,
  Download,
  Search,
  RefreshCw,
  Coins,
  Lock,
  Clock,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface LedgerItem {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string;
  referenceId: string | null;
  referenceType: string | null;
  idempotencyKey: string;
  createdAt: string;
}

interface WalletData {
  id: string;
  availableBalance: number;
  lockedBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
  version: number;
}

interface ReconciliationStatus {
  isConsistent: boolean;
  ledgerSum: number;
  discrepancy: number;
  transactionCount: number;
}

export default function WalletPage() {
  const { user, openDepositModal, addToast } = useMarketplace();

  // State
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationStatus | null>(null);
  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [selectedTx, setSelectedTx] = useState<LedgerItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [txDetails, setTxDetails] = useState<any>(null);

  // Statement export
  const [exporting, setExporting] = useState(false);

  const fetchWalletData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (directionFilter !== 'ALL') params.set('direction', directionFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/v1/wallet?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setWallet(data.data.wallet);
        setReconciliation(data.data.reconciliation);
        setTransactions(data.data.transactions);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.total);
        }
      } else {
        addToast('Failed to Load Wallet', data.error?.message || 'Please log in to view your live wallet.', 'error');
      }
    } catch (err: any) {
      addToast('Network Error', 'Unable to reach wallet service', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, typeFilter, directionFilter, search, addToast]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleDownloadStatement = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format: 'csv' });
      if (typeFilter !== 'ALL') params.set('type', typeFilter);

      const res = await fetch(`/api/v1/wallet/statement?${params.toString()}`);
      if (!res.ok) throw new Error('Statement download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cpc_wallet_statement_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast('Statement Downloaded', 'Your verified CSV statement has been saved.', 'success');
    } catch (err: any) {
      addToast('Download Failed', err.message || 'Unable to download statement', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleOpenDetail = async (tx: LedgerItem) => {
    setSelectedTx(tx);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/v1/wallet/transactions/${tx.id}`);
      const data = await res.json();
      if (data.success) {
        setTxDetails(data.data);
      } else {
        setTxDetails(tx);
      }
    } catch {
      setTxDetails(tx);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReconcileNow = async () => {
    try {
      const res = await fetch('/api/v1/wallet/reconcile');
      const data = await res.json();
      if (data.success) {
        setReconciliation(data.data);
        if (data.data.isConsistent) {
          addToast('Ledger Verified', 'All append-only transactions match your balance exactly (100% ACID compliant).', 'success');
        } else {
          addToast('Discrepancy Detected', `Ledger variance: ${data.data.discrepancy} coins. Please notify administrators.`, 'warning');
        }
      }
    } catch (err: any) {
      addToast('Audit Failed', 'Could not run ledger reconciliation', 'error');
    }
  };

  const available = wallet?.availableBalance ?? 0;
  const locked = wallet?.lockedBalance ?? 0;
  const pending = wallet?.pendingBalance ?? 0;
  const earned = wallet?.totalEarned ?? 0;
  const spent = wallet?.totalSpent ?? 0;

  return (
    <div className="space-y-8 w-full pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              CPC Coin Wallet & Ledger
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck size={13} />
              <span>ACID Double-Entry</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time balance, append-only transaction ledger, and verified audit accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchWalletData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-sky-500' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadStatement}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={14} className={exporting ? 'animate-bounce text-sky-500' : ''} />
            <span>{exporting ? 'Exporting...' : 'Export Statement (CSV)'}</span>
          </button>

          <button
            type="button"
            onClick={openDepositModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle size={15} />
            <span>Deposit Funds</span>
          </button>
        </div>
      </div>

      {/* 2. Balances & Financial Position Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Available Balance (Hero) */}
        <div className="md:col-span-3 lg:col-span-2 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
            <span>Available Balance</span>
            <Coins size={20} className="text-amber-500 animate-coin" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCoins(available)}
            </span>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              CPC Coins
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            Spendable purchasing power: <strong className="text-slate-800 dark:text-slate-200">{formatCurrencyINR(available)} INR</strong> (1 Coin ≈ ₹1.00 reference)
          </p>
        </div>

        {/* Held / Locked Balance */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>Held / Escrow</span>
            <Lock size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCoins(locked)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Committed in active orders
          </span>
        </div>

        {/* Pending Deposit Credits */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>Pending Deposits</span>
            <Clock size={16} className="text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCoins(pending)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Awaiting payment confirmation
          </span>
        </div>

        {/* Lifetime Stats */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Lifetime Accounting
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
              +{formatCoins(earned)} Earned
            </div>
            <div className="text-xs text-rose-600 dark:text-rose-400 font-bold tabular-nums mt-0.5">
              -{formatCoins(spent)} Spent
            </div>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
            Wallet Version v{wallet?.version ?? 1}
          </div>
        </div>
      </div>

      {/* 3. ACID Ledger Consistency & Integrity Card */}
      {reconciliation && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          reconciliation.isConsistent
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {reconciliation.isConsistent ? (
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-amber-500 shrink-0" />
            )}
            <div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>{reconciliation.isConsistent ? 'Append-Only Ledger Verified Consistent' : 'Ledger Variance Detected'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-800/60 font-medium">
                  {reconciliation.transactionCount} immutable entries
                </span>
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                {reconciliation.isConsistent
                  ? `Cached wallet available balance (${reconciliation.ledgerSum} Coins) strictly matches the mathematical sum of all completed ledger transactions.`
                  : `Discrepancy of ${reconciliation.discrepancy} Coins between wallet snapshot and ledger records.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReconcileNow}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            Audit Balance
          </button>
        </div>
      )}

      {/* 4. Ledger Filters & Transaction History */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mr-2">
              <Filter size={14} className="text-sky-500" />
              <span>Filter:</span>
            </span>

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border-none font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="TASK_REWARD">Task Rewards</option>
              <option value="PURCHASE_DEBIT">Purchases</option>
              <option value="DEPOSIT_CREDIT">Deposits</option>
              <option value="ADMIN_CREDIT">Admin Credits</option>
              <option value="ADMIN_DEBIT">Admin Debits</option>
              <option value="REFUND_CREDIT">Refunds</option>
              <option value="PROMO_BONUS">Promotions & Bonuses</option>
            </select>

            {/* Direction toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
              {(['ALL', 'CREDIT', 'DEBIT'] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => {
                    setDirectionFilter(dir);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    directionFilter === dir
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {dir === 'ALL' ? 'All' : dir === 'CREDIT' ? 'Credits (+)' : 'Debits (-)'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description or reference..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-mono border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Reference Pointer</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance After</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-sky-500" />
                    <span>Loading ledger records from database...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText size={24} className="mx-auto mb-2 opacity-50" />
                    <span>No ledger transactions match the active criteria.</span>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isCredit = tx.amount > 0;
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold ${
                            isCredit
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {tx.referenceType ? (
                          <span>{tx.referenceType}: {tx.referenceId ? `${tx.referenceId.slice(0, 8)}...` : 'N/A'}</span>
                        ) : (
                          <span className="text-slate-400">Direct Ledger</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold">
                        <span className={isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isCredit ? `+${formatCoins(tx.amount)}` : formatCoins(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                        {formatCoins(tx.balanceAfter)} Coins
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(tx)}
                          className="px-2 py-1 rounded-md text-[11px] font-mono text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
                        >
                          CPC-TX-{tx.id.slice(0, 6).toUpperCase()}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Showing {transactions.length} of {totalCount} records</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer text-xs"
              >
                Previous
              </button>
              <span className="px-2 text-xs font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer text-xs"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
                  {txDetails?.receiptNumber || `CPC-TX-${selectedTx.id.slice(0, 8).toUpperCase()}`}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Transaction Receipt Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTx(null);
                  setTxDetails(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-8 text-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-sky-500" />
                <span>Retrieving verified transaction metadata...</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-medium">
                      Net Amount
                    </span>
                    <span
                      className={`text-2xl font-black tabular-nums ${
                        selectedTx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {selectedTx.amount > 0 ? `+${formatCoins(selectedTx.amount)}` : formatCoins(selectedTx.amount)}{' '}
                      CPC Coins
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-medium">
                      Balance After
                    </span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatCoins(selectedTx.balanceAfter)} Coins
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Transaction Type</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {selectedTx.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Timestamp (UTC)</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {new Date(selectedTx.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Description</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedTx.description}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 font-mono text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-400">UUID: </span>
                    <span className="text-slate-700 dark:text-slate-300">{selectedTx.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Idempotency Key: </span>
                    <span className="text-slate-700 dark:text-slate-300">{selectedTx.idempotencyKey}</span>
                  </div>
                  {selectedTx.referenceType && (
                    <div>
                      <span className="text-slate-400">Reference: </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {selectedTx.referenceType} ({selectedTx.referenceId || 'N/A'})
                      </span>
                    </div>
                  )}
                </div>

                {txDetails?.referenceDetails && (
                  <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 text-[11px]">
                    <span className="font-semibold text-sky-600 dark:text-sky-400 block mb-1">
                      Linked Reference Info:
                    </span>
                    <pre className="text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto">
                      {JSON.stringify(txDetails.referenceDetails, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedTx(null);
                  setTxDetails(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
