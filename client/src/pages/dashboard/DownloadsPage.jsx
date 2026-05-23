import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService } from '../../services/order.service.js';
import { PageLoader } from '../../components/shared/PageLoader.jsx';
import { EmptyState } from '../../components/shared/EmptyState.jsx';
import { formatDate } from '../../lib/utils.js';

export default function DownloadsPage() {
  const [downloadingId, setDownloadingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['downloads'],
    queryFn: () => orderService.getMyOrders(1).then((r) =>
      r.data.data.orders?.filter((o) => o.status === 'completed')
    ),
  });

  const handleDownload = async (orderId) => {
    setDownloadingId(orderId);
    try {
      const { data: res } = await orderService.getDownloadToken(orderId);
      window.open(`/api/v1/downloads/${res.data.downloadToken}`, '_blank');
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
        <h1 className="text-2xl font-bold text-text-primary">My Downloads</h1>
        <p className="text-text-secondary mt-1">Access all your purchased products</p>
      </div>

      {!data?.length ? (
        <EmptyState
          icon={Package}
          title="No downloads yet"
          description="Purchase a product to access it here."
          action={<a href="/marketplace" className="btn-primary">Browse Marketplace</a>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((order) => (
            <div key={order._id} className="card hover:border-primary/30 transition-all">
              <img
                src={order.productId?.thumbnail || 'https://placehold.co/300x160/1A1D27/6366F1?text=CodeMarket'}
                alt=""
                className="w-full h-36 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold text-text-primary mb-1 truncate">{order.productId?.name}</h3>
              <p className="text-text-muted text-xs mb-3">Purchased {formatDate(order.createdAt)}</p>

              <div className="flex items-center justify-between mb-3">
                <span className="badge bg-surface-2 text-text-muted border border-border">
                  {order.downloadCount}/{order.maxDownloads} downloads used
                </span>
                <span className="badge bg-surface-2 text-text-muted">v{order.productId?.version || '1.0.0'}</span>
              </div>

              <button
                onClick={() => handleDownload(order._id)}
                disabled={downloadingId === order._id || order.downloadCount >= order.maxDownloads}
                className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloadingId === order._id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {order.downloadCount >= order.maxDownloads ? 'Limit Reached' : 'Download'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
