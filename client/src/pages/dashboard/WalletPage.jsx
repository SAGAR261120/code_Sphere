import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Coins, Plus, X, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useWalletData, useWalletTransactions, useCoinTransactions, useInitiateDeposit, useVerifyDeposit } from '../../hooks/useWallet.js';
import { formatCurrency, formatCoins, formatDate, cn } from '../../lib/utils.js';
import { PageLoader } from '../../components/shared/PageLoader.jsx';

const TX_COLORS = {
  deposit: 'text-success', purchase: 'text-danger', refund: 'text-primary',
  admin_credit: 'text-success', admin_debit: 'text-danger', referral_bonus: 'text-warning',
};

const COIN_COLORS = {
  task_reward: 'text-success', purchase_spend: 'text-danger', referral_bonus: 'text-warning',
  admin_credit: 'text-success', admin_debit: 'text-danger', refund_credit: 'text-primary',
};

function DepositModal({ onClose }) {
  const [amount, setAmount] = useState('');
  const { mutate: initiate, isPending } = useInitiateDeposit();
  const { mutate: verify } = useVerifyDeposit();

  const handleDeposit = () => {
    const paise = Math.round(parseFloat(amount) * 100);
    if (isNaN(paise) || paise < 100) return;

    initiate({ amount: paise, method: 'razorpay' }, {
      onSuccess: (data) => {
        if (window.Razorpay) {
          const rzp = new window.Razorpay({
            key: data.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: data.amount,
            currency: data.currency || 'INR',
            name: 'CodeMarket',
            description: 'Wallet Top-up',
            order_id: data.gatewayOrderId,
            handler: (response) => {
              verify({
                depositId: data.depositId,
                gatewayOrderId: data.gatewayOrderId,
                gatewayPaymentId: response.razorpay_payment_id,
                gatewaySignature: response.razorpay_signature,
              });
              onClose();
            },
          });
          rzp.open();
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
        <button onClick={onClose} className="absolute top-4 right-4"><X size={18} className="text-text-muted" /></button>
        <h3 className="text-lg font-bold mb-4">Add Funds</h3>
        <div className="mb-4">
          <label className="block text-sm text-text-secondary mb-1.5">Amount (₹)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="input"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[100, 500, 1000, 2000].map((v) => (
            <button key={v} onClick={() => setAmount(v.toString())} className="badge bg-surface-2 text-text-secondary hover:bg-primary/10 hover:text-primary border border-border cursor-pointer text-sm px-3 py-1">
              ₹{v}
            </button>
          ))}
        </div>
        <button onClick={handleDeposit} disabled={isPending || !amount} className="btn-primary w-full flex items-center justify-center gap-2">
          {isPending && <Loader2 size={16} className="animate-spin" />}
          Proceed to Pay
        </button>
      </motion.div>
    </div>
  );
}

export default function WalletPage() {
  const [tab, setTab] = useState('wallet');
  const [depositOpen, setDepositOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: walletData, isLoading } = useWalletData();
  const { data: walletTx } = useWalletTransactions(page);
  const { data: coinTx } = useCoinTransactions(page);

  if (isLoading) return <PageLoader />;

  const txData = tab === 'wallet' ? walletTx : coinTx;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Wallet & Coins</h1>
        <p className="text-text-secondary mt-1">Manage your balances and transaction history</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-success"><Wallet size={18} /> <span className="font-medium">Wallet Balance</span></div>
            <button onClick={() => setDepositOpen(true)} className="flex items-center gap-1 text-primary text-sm font-medium hover:underline">
              <Plus size={14} /> Add Funds
            </button>
          </div>
          <p className="text-3xl font-bold text-text-primary">{formatCurrency(walletData?.wallet?.walletBalance)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-warning mb-2"><Coins size={18} /> <span className="font-medium">Coin Balance</span></div>
          <p className="text-3xl font-bold text-text-primary">{formatCoins(walletData?.wallet?.coinBalance)} <span className="text-warning text-xl">🪙</span></p>
          <p className="text-text-muted text-xs mt-1">Total earned: {formatCoins(walletData?.wallet?.totalEarnedCoins)} coins</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        {[['wallet', 'Wallet Transactions'], ['coins', 'Coin Transactions']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="card">
        {!txData?.transactions?.length ? (
          <p className="text-text-muted text-center py-8">No transactions yet</p>
        ) : (
          <div className="divide-y divide-border">
            {txData.transactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', tx.amount > 0 ? 'bg-success/10' : 'bg-danger/10')}>
                    {tx.amount > 0 ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-danger" />}
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium capitalize">{tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-text-muted text-xs">{tx.description || ''} · {formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('font-semibold text-sm', tab === 'wallet' ? TX_COLORS[tx.type] : COIN_COLORS[tx.type])}>
                    {tx.amount > 0 ? '+' : ''}{tab === 'wallet' ? formatCurrency(tx.amount) : `${tx.amount} 🪙`}
                  </p>
                  <p className="text-text-muted text-xs">
                    Balance: {tab === 'wallet' ? formatCurrency(tx.balanceAfter) : `${tx.balanceAfter} 🪙`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {txData?.pagination?.pages > 1 && (
          <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-border">
            {Array.from({ length: txData.pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm ${page === p ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} />}
    </div>
  );
}
