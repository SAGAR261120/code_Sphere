import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, Loader2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService } from '../../services/order.service.js';
import { PageLoader } from '../../components/shared/PageLoader.jsx';
import { EmptyState } from '../../components/shared/EmptyState.jsx';
import { formatDate, formatCurrency, formatCoins, cn } from '../../lib/utils.js';

const STATUS_COLORS = {
  completed: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  refunded: 'bg-primary/10 text-primary',
  cancelled: 'bg-danger/10 text-danger',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => orderService.getMyOrders(page).then((r) => r.data.data),
  });

  const handleDownload = async (orderId) => {
    setDownloadingId(orderId);
    try {
      const { data: res } = await orderService.getDownloadToken(orderId);
      const token = res.data.downloadToken;
      window.open(`/api/v1/downloads/${token}`, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">My Orders</h1>
        <p className="text-text-secondary mt-1">Your purchase history</p>
      </div>

      {!data?.orders?.length ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Browse the marketplace and make your first purchase."
          action={<a href="/marketplace" className="btn-primary">Browse Marketplace</a>}
        />
      ) : (
        <div className="card">
          <div className="divide-y divide-border">
            {data.orders.map((order) => (
              <div key={order._id} className="flex items-center gap-4 py-4">
                <img
                  src={order.productId?.thumbnail || 'https://placehold.co/48x48/1A1D27/6366F1?text=C'}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{order.productId?.name || 'Unknown Product'}</p>
                  <p className="text-text-muted text-xs mt-0.5">
                    {order.orderNumber} · {formatDate(order.createdAt)}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    {order.pricing.moneyPaid > 0 && <span>{formatCurrency(order.pricing.moneyPaid)}</span>}
                    {order.pricing.coinsPaid > 0 && <span>{formatCoins(order.pricing.coinsPaid)} 🪙</span>}
                    {order.pricing.moneyPaid === 0 && order.pricing.coinsPaid === 0 && <span>Free</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('badge text-xs', STATUS_COLORS[order.status])}>{order.status}</span>
                  {order.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(order._id)}
                      disabled={downloadingId === order._id}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      {downloadingId === order._id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Download size={12} />}
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.pagination?.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-border">
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((p) => (
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
      )}
    </div>
  );
}
