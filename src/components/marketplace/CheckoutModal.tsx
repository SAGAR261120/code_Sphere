'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMarketplace } from '@/context/marketplace-context';
import { CoinBadge } from '../ui/CoinBadge';
import {
  Coins,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Download,
  Lock,
  Key,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { formatCoins } from '@/lib/utils';

export function CheckoutModal() {
  const router = useRouter();
  const {
    checkoutProduct,
    closeCheckout,
    coinBalance,
    openDepositModal,
    addToast,
    spendCoins,
  } = useMarketplace();

  const [isLoading, setIsLoading] = useState(false);
  const [licenseType, setLicenseType] = useState<'COMMERCIAL' | 'PERSONAL'>('COMMERCIAL');
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  if (!checkoutProduct) return null;

  const product = checkoutProduct;
  const isFree = product.pricing?.isFree ?? false;
  const coinCost = isFree ? 0 : product.pricing?.coinPrice ?? 0;
  const hasSufficientCoins = coinBalance >= coinCost;
  const balanceAfter = Math.max(0, coinBalance - coinCost);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/v1/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          paymentMethod: isFree ? 'FREE' : 'COINS',
          licenseType,
          idempotencyKey,
          acceptedTerms: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Checkout failed. Please check your balance.');
      }

      const orderData = json.data;
      setCompletedOrder(orderData);

      // Decrement client balance state if coins spent
      if (coinCost > 0) {
        spendCoins(coinCost, `Purchased: ${product.name}`);
      }

      addToast(
        'Order Completed!',
        `Your commercial license for ${product.name} is confirmed.`,
        'success'
      );
    } catch (err: any) {
      addToast('Order Error', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCompletedOrder(null);
    closeCheckout();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {completedOrder ? 'Purchase Confirmed!' : 'Confirm Digital Acquisition'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {completedOrder
                  ? `Order #${completedOrder.order?.orderNumber}`
                  : 'Authorized digital license entitlement'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* If completed, show confirmation card */}
        {completedOrder ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>License Key Successfully Issued!</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Your perpetual commercial rights for <strong>{product.name}</strong> have been recorded in the blockchain-style ledger.
              </p>
            </div>

            {/* License details */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">License Key:</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400 select-all">
                  {completedOrder.entitlement?.licenseKey || 'CPC-LIC-PERPETUAL'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {completedOrder.order?.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Amount Charged:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {isFree ? 'Free ($0)' : `${formatCoins(coinCost)} Coins`}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  router.push('/purchases');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>Go to My Purchases & Downloads</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Normal checkout review card */
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {product.shortDescription}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Version {product.version}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {licenseType === 'COMMERCIAL' ? 'Commercial License' : 'Personal License'}
                  </span>
                </div>
              </div>
            </div>

            {/* License Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                License Option:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLicenseType('COMMERCIAL')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    licenseType === 'COMMERCIAL'
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold">Commercial License</div>
                  <div className="text-[10px] text-slate-400">Business & client projects</div>
                </button>

                <button
                  type="button"
                  onClick={() => setLicenseType('PERSONAL')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    licenseType === 'PERSONAL'
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold">Personal License</div>
                  <div className="text-[10px] text-slate-400">Individual hobby & learning</div>
                </button>
              </div>
            </div>

            {/* Balance breakdown */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Item Price:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {isFree ? 'Free (0 Coins)' : `${formatCoins(coinCost)} CPC Coins`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Your Available Balance:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatCoins(coinBalance)} Coins
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between font-semibold">
                <span className="text-slate-900 dark:text-slate-100">Balance After Order:</span>
                <span
                  className={`tabular-nums ${
                    hasSufficientCoins ? 'text-slate-900 dark:text-slate-100' : 'text-rose-500'
                  }`}
                >
                  {hasSufficientCoins ? `${formatCoins(balanceAfter)} Coins` : 'Insufficient Funds'}
                </span>
              </div>
            </div>

            {/* Insufficient balance warning & Top-Up / Earn CTAs */}
            {!hasSufficientCoins && (
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                <div className="text-xs space-y-2 flex-1">
                  <div>
                    <p className="font-semibold">Insufficient CPC Coin Balance</p>
                    <p className="mt-0.5 text-rose-600/90 dark:text-rose-300/90">
                      You need {formatCoins(coinCost - coinBalance)} more coins to acquire this software package.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        closeCheckout();
                        openDepositModal();
                      }}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Coins size={13} />
                      <span>Deposit Coins →</span>
                    </button>
                    <Link
                      href="/earn"
                      onClick={closeCheckout}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles size={13} />
                      <span>Earn Coins via Tasks →</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Lock size={12} className="text-emerald-500 shrink-0" />
              <span>Grants perpetual download rights, verified updates, and documentation access.</span>
            </div>

            {/* Footer actions */}
            <div className="p-5 -mx-5 -mb-5 mt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeCheckout}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!hasSufficientCoins || isLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {isLoading
                  ? 'Confirming Order...'
                  : isFree
                  ? 'Acquire Free License'
                  : `Confirm & Pay ${formatCoins(coinCost)} Coins`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
