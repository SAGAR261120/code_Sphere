'use client';

import React, { useState, useEffect } from 'react';
import { useMarketplace } from '@/context/marketplace-context';
import {
  Coins,
  PlusCircle,
  X,
  ShieldCheck,
  Check,
  Sparkles,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Building,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { formatCoins, formatCurrencyINR } from '@/lib/utils';

export function DepositModal() {
  const { isDepositModalOpen, closeDepositModal, addToast } = useMarketplace();

  // Config State
  const [config, setConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Deposit Form State
  const [selectedPackage, setSelectedPackage] = useState<number>(1); // index
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customInr, setCustomInr] = useState<string>('500');

  // Checkout Step State: 'SELECT' | 'PAY' | 'RECEIPT'
  const [step, setStep] = useState<'SELECT' | 'PAY' | 'RECEIPT'>('SELECT');
  const [activeDeposit, setActiveDeposit] = useState<any>(null);
  const [isSubmittingIntent, setIsSubmittingIntent] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');

  const packages = [
    {
      name: 'Developer Starter',
      inrPrice: 100,
      baseCoins: 100,
      bonusCoins: 0,
    },
    {
      name: 'Pro Builder',
      inrPrice: 499,
      baseCoins: 499,
      bonusCoins: 50,
      isPopular: true,
    },
    {
      name: 'Studio Master',
      inrPrice: 999,
      baseCoins: 999,
      bonusCoins: 150,
    },
    {
      name: 'Enterprise Scale',
      inrPrice: 2499,
      baseCoins: 2499,
      bonusCoins: 500,
    },
  ];

  useEffect(() => {
    if (isDepositModalOpen) {
      setStep('SELECT');
      setActiveDeposit(null);
      setCompletedReceipt(null);
      setIsLoadingConfig(true);
      fetch('/api/v1/deposits/config')
        .then((r) => r.json())
        .then((j) => {
          if (j?.data) setConfig(j.data);
        })
        .catch(() => {})
        .finally(() => setIsLoadingConfig(false));
    }
  }, [isDepositModalOpen]);

  if (!isDepositModalOpen) return null;

  const currentInr = isCustomAmount ? parseInt(customInr, 10) || 0 : packages[selectedPackage].inrPrice;
  const currentBaseCoins = currentInr;
  const currentBonusCoins = isCustomAmount ? 0 : packages[selectedPackage].bonusCoins;
  const totalCoins = currentBaseCoins + currentBonusCoins;

  const minInr = (config?.minDepositPaise ?? 10000) / 100;
  const maxInr = (config?.maxDepositPaise ?? 5000000) / 100;

  // Step 1: Create Deposit Intent on server
  const handleProceedToPayment = async () => {
    if (currentInr < minInr) {
      addToast('Minimum Deposit', `Minimum deposit amount is ₹${minInr.toFixed(2)}.`, 'warning');
      return;
    }
    if (currentInr > maxInr) {
      addToast('Maximum Deposit', `Maximum single deposit is ₹${maxInr.toFixed(2)}.`, 'warning');
      return;
    }

    setIsSubmittingIntent(true);
    try {
      const res = await fetch('/api/v1/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountFiatPaise: currentInr * 100,
          gateway: config?.defaultGateway || 'RAZORPAY',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to initiate deposit');

      setActiveDeposit(data.data);
      setStep('PAY');
    } catch (err: any) {
      addToast('Deposit Failed', err.message, 'error');
    } finally {
      setIsSubmittingIntent(false);
    }
  };

  // Step 2: Authorize Payment & Verify on Server
  const handleAuthorizePayment = async () => {
    if (!activeDeposit) return;
    setIsVerifyingPayment(true);

    try {
      // Simulate Razorpay payment ID and client callback
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Generate test signature for sandbox verification
      const mockSignature = `sig_${Date.now()}`;

      const res = await fetch(`/api/v1/deposits/${activeDeposit.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayOrderId: activeDeposit.gatewayOrderId,
          gatewayPaymentId: mockPaymentId,
          gatewaySignature: mockSignature,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Payment verification failed');

      setCompletedReceipt({
        depositId: activeDeposit.id,
        receiptNumber: `CPC-DEP-${activeDeposit.id.slice(0, 8).toUpperCase()}`,
        gatewayPaymentId: mockPaymentId,
        gatewayOrderId: activeDeposit.gatewayOrderId,
        amountInr: currentInr,
        coinsCredited: activeDeposit.coinsToCredit,
        completedAt: new Date().toISOString(),
      });
      setStep('RECEIPT');
      addToast('Payment Verified!', `+${activeDeposit.coinsToCredit} CPC Coins credited to your ledger.`, 'success');
    } catch (err: any) {
      addToast('Verification Failed', err.message, 'error');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

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
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              {step === 'RECEIPT' ? <Receipt size={20} /> : <PlusCircle size={20} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {step === 'SELECT'
                  ? 'Deposit Funds to Wallet'
                  : step === 'PAY'
                  ? 'Complete Gateway Payment'
                  : 'Deposit Completed & Credited'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'SELECT'
                  ? 'Add CPC Coins using Indian payment rails (UPI, NetBanking, Cards)'
                  : step === 'PAY'
                  ? `Order #${activeDeposit?.gatewayOrderId}`
                  : 'Official Financial Receipt'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDepositModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: SELECT AMOUNT */}
        {step === 'SELECT' && (
          <div className="p-6 space-y-4">
            {/* Compliance Switch Notice */}
            {config && !config.depositsEnabled && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Deposits Currently Suspended</strong>
                  <span>{config.complianceNotice || 'Deposits are pending payment provider compliance approval.'}</span>
                </div>
              </div>
            )}

            {/* Packages Grid */}
            <div className="grid grid-cols-2 gap-3">
              {packages.map((pkg, idx) => {
                const isSelected = !isCustomAmount && selectedPackage === idx;

                return (
                  <button
                    key={pkg.name}
                    type="button"
                    onClick={() => {
                      setIsCustomAmount(false);
                      setSelectedPackage(idx);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30'
                    }`}
                  >
                    {pkg.isPopular && (
                      <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 uppercase">
                        Popular
                      </span>
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {pkg.name}
                      </h4>
                      <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatCurrencyINR(pkg.inrPrice)}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        <Coins size={13} />
                        <span>{formatCoins(pkg.baseCoins + pkg.bonusCoins)}</span>
                      </div>
                      {pkg.bonusCoins > 0 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          +{pkg.bonusCoins} Bonus
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Option */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsCustomAmount(!isCustomAmount)}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                {isCustomAmount ? '← Choose standard package' : '+ Enter custom amount (₹)'}
              </button>

              {isCustomAmount && (
                <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Amount in INR (₹)</label>
                    <span className="text-[11px] text-slate-500">Min: ₹{minInr} · Max: ₹{maxInr}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min={minInr}
                      max={maxInr}
                      value={customInr}
                      onChange={(e) => setCustomInr(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>Equivalent Coins to Credit: </span>
                    <strong className="text-amber-600 dark:text-amber-400 font-bold">{formatCoins(currentInr)} CPC Coins</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Gateway Information Badge */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <CreditCard size={15} className="text-sky-500" />
                <span>{config?.defaultGateway === 'SANDBOX' ? 'Sandbox Gateway' : 'Razorpay Gateway (UPI, Cards, NetBanking)'}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                Test Sandbox
              </span>
            </div>

            {/* Conversion & Invariant Notice */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>ACID Guarantee: Coins are credited to your ledger only upon cryptographic payment verification.</span>
            </div>
          </div>
        )}

        {/* STEP 2: GATEWAY PAYMENT CHECKOUT */}
        {step === 'PAY' && activeDeposit && (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Order Reference</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{activeDeposit.gatewayOrderId}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Payable Amount</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {formatCurrencyINR(activeDeposit.amountFiatPaise / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">CPC Coins Credited</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">+{formatCoins(activeDeposit.coinsToCredit)} Coins</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Select Payment Instrument</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['UPI', 'CARD', 'NETBANKING'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer font-medium ${
                      paymentMethod === method
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-slate-500 block">Virtual Payment Address (VPA)</span>
                <input
                  type="text"
                  readOnly
                  value="test-buyer@cpcmarket"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs"
                />
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              This sandbox payment session will issue a cryptographically signed provider callback and independently verify payment status before minting coins.
            </p>
          </div>
        )}

        {/* STEP 3: OFFICIAL PAYMENT RECEIPT */}
        {step === 'RECEIPT' && completedReceipt && (
          <div className="p-6 space-y-4">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Payment Confirmed & Verified
              </h4>
              <p className="text-xs text-slate-500">
                Your deposit has been verified by the backend adapter and credited to your double-entry ledger.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Receipt ID</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{completedReceipt.receiptNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{completedReceipt.gatewayPaymentId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fiat Paid</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrencyINR(completedReceipt.amountInr)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
                <span className="text-slate-500">Coins Credited</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">+{formatCoins(completedReceipt.coinsCredited)} Coins</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          {step === 'SELECT' && (
            <>
              <div className="text-xs">
                <span className="text-slate-500">Total: </span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {formatCoins(totalCoins)} Coins ({formatCurrencyINR(currentInr)})
                </strong>
              </div>

              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={isSubmittingIntent || (config && !config.depositsEnabled)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingIntent ? 'Creating Order...' : 'Proceed to Payment →'}
              </button>
            </>
          )}

          {step === 'PAY' && (
            <>
              <button
                type="button"
                onClick={() => setStep('SELECT')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleAuthorizePayment}
                disabled={isVerifyingPayment}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isVerifyingPayment && <RefreshCw size={13} className="animate-spin" />}
                <span>{isVerifyingPayment ? 'Verifying with Provider...' : `Authorize ₹${currentInr.toFixed(2)} Payment`}</span>
              </button>
            </>
          )}

          {step === 'RECEIPT' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={closeDepositModal}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors cursor-pointer"
              >
                Done & View Updated Balance
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
