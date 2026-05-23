import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Wallet, CreditCard, Download, Loader2, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orderService } from '../../services/order.service.js';
import { useAuthStore } from '../../stores/authStore.js';
import { formatCurrency, formatCoins, cn } from '../../lib/utils.js';

export function CheckoutModal({ product, isOpen, onClose }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [method, setMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [downloadToken, setDownloadToken] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const p = product?.pricing;

  const methods = [
    p?.isFree && { id: 'free', label: 'Get for Free', icon: Download, desc: 'No payment required' },
    p?.moneyPrice > 0 && !p?.isFree && {
      id: 'wallet',
      label: 'Pay with Wallet',
      icon: Wallet,
      desc: `${formatCurrency(p.discountedMoneyPrice || p.moneyPrice)} · Balance: ${formatCurrency(user?.walletBalance || 0)}`,
      disabled: (user?.walletBalance || 0) < (p.discountedMoneyPrice || p.moneyPrice),
    },
    p?.coinPrice > 0 && !p?.isFree && {
      id: 'coins',
      label: 'Pay with Coins',
      icon: Coins,
      desc: `${formatCoins(p.coinPrice)} coins · You have: ${formatCoins(user?.coinBalance || 0)}`,
      disabled: (user?.coinBalance || 0) < p.coinPrice,
    },
    p?.hasMixedPricing && p?.mixedOptions?.length && {
      id: 'mixed',
      label: 'Pay with Money + Coins',
      icon: CreditCard,
      desc: `${formatCurrency(p.mixedOptions[0].moneyAmount)} + ${formatCoins(p.mixedOptions[0].coinAmount)} coins`,
    },
    p?.moneyPrice > 0 && !p?.isFree && {
      id: 'razorpay',
      label: 'Pay with Card / UPI',
      icon: CreditCard,
      desc: `${formatCurrency(p.discountedMoneyPrice || p.moneyPrice)} via Razorpay`,
    },
  ].filter(Boolean);

  // Set initial method
  if (!method && methods.length > 0) {
    setTimeout(() => setMethod(methods[0].id), 0);
  }

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: async () => {
      const paymentMethod = method === 'razorpay' ? 'money' : method;
      const res = await orderService.createOrder({ productId: product._id, paymentMethod, couponCode });
      const data = res.data.data;

      if (data.requiresPayment && method === 'razorpay') {
        return new Promise((resolve, reject) => {
          if (!window.Razorpay) return reject(new Error('Razorpay not loaded'));
          const rzp = new window.Razorpay({
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: p.discountedMoneyPrice || p.moneyPrice,
            currency: 'INR',
            name: 'CodeMarket',
            description: product.name,
            handler: async (response) => {
              try {
                const verifyRes = await orderService.verifyPayment({
                  orderId: data.order._id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                resolve(verifyRes.data.data);
              } catch (err) {
                reject(err);
              }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          });
          rzp.open();
        });
      }

      return data;
    },
    onSuccess: (data) => {
      setDownloadToken(data.downloadToken || null);
      setOrderId(data.order?._id || null);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Purchase successful!');
    },
    onError: (err) => toast.error(err.message || err.response?.data?.message || 'Order failed'),
  });

  const handleDownload = async () => {
    if (downloadToken) {
      window.open(`/api/v1/downloads/${downloadToken}`, '_blank');
      return;
    }
    if (orderId) {
      try {
        const res = await orderService.getDownloadToken(orderId);
        window.open(`/api/v1/downloads/${res.data.data.downloadToken}`, '_blank');
      } catch {
        toast.error('Could not get download link');
      }
    }
  };

  if (!isOpen || !product) return null;

  const purchased = downloadToken !== null || (orderId !== null && !isPending);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-surface-2 rounded-lg transition-colors">
            <X size={18} className="text-text-muted" />
          </button>

          {purchased ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-success" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Purchase Complete!</h3>
              <p className="text-text-secondary mb-6">{product.name} is now in your downloads.</p>
              <div className="flex flex-col gap-2">
                <button onClick={handleDownload} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Download size={16} /> Download Now
                </button>
                <button onClick={onClose} className="btn-secondary w-full">Close</button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-text-primary mb-1">Complete Purchase</h3>
              <p className="text-text-secondary text-sm mb-5 truncate">{product.name}</p>

              {/* Balances */}
              <div className="flex gap-3 mb-5">
                <div className="flex-1 bg-background rounded-lg p-3 border border-border">
                  <p className="text-xs text-text-muted mb-0.5">Wallet</p>
                  <p className="font-semibold text-success text-sm">{formatCurrency(user?.walletBalance || 0)}</p>
                </div>
                <div className="flex-1 bg-background rounded-lg p-3 border border-border">
                  <p className="text-xs text-text-muted mb-0.5">Coins</p>
                  <p className="font-semibold text-warning text-sm">{formatCoins(user?.coinBalance || 0)}</p>
                </div>
              </div>

              {/* Payment methods */}
              <div className="space-y-2 mb-4">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => !m.disabled && setMethod(m.id)}
                    disabled={m.disabled}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                      m.disabled ? 'opacity-40 cursor-not-allowed border-border' :
                        method === m.id
                          ? 'border-primary bg-primary/5 text-text-primary'
                          : 'border-border hover:border-primary/40 text-text-secondary'
                    )}
                  >
                    <m.icon size={18} className={method === m.id ? 'text-primary' : ''} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-text-muted truncate">{m.desc}</p>
                    </div>
                    <div className={cn('w-4 h-4 rounded-full border-2 transition-colors shrink-0', method === m.id ? 'border-primary bg-primary' : 'border-border')} />
                  </button>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-5">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code (optional)"
                  className="input text-sm flex-1"
                />
              </div>

              <button
                onClick={() => placeOrder()}
                disabled={isPending || !method}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                {isPending ? 'Processing...' : 'Complete Purchase'}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
