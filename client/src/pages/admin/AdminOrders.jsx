import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service.js';
import { formatCurrency, formatCoins, formatDate } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

const STATUS_BADGE = {
  completed: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  failed: 'bg-danger/10 text-danger border-danger/20',
  refunded: 'bg-surface-2 text-text-muted border-border',
};

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter, page],
    queryFn: () => adminService.getAllOrders({ search, status: statusFilter, page, limit: 20 }),
    select: (r) => r.data.data,
  });

  const refundMutation = useMutation({
    mutationFn: (id) => adminService.refundOrder(id),
    onSuccess: () => { toast.success('Refund processed'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Refund failed'),
  });

  const orders = data?.orders || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Orders</h1>
        <p className="text-text-secondary mt-1">All platform orders</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by order number..." className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Order', 'User', 'Product', 'Money', 'Coins', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-text-muted">{o.orderNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-text-primary">{o.userId?.name}</p>
                      <p className="text-text-muted text-xs">{o.userId?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-text-primary max-w-[180px] truncate">{o.productId?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {o.pricing?.moneyPaid > 0 ? formatCurrency(o.pricing.moneyPaid) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-warning">
                      {o.pricing?.coinsPaid > 0 ? formatCoins(o.pricing.coinsPaid) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge border', STATUS_BADGE[o.status] || STATUS_BADGE.pending)}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      {o.status === 'completed' && (
                        <button
                          onClick={() => { if (confirm('Refund this order?')) refundMutation.mutate(o._id); }}
                          disabled={refundMutation.isPending}
                          className="p-1.5 hover:bg-warning/10 text-text-muted hover:text-warning rounded transition-colors"
                          title="Refund"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-text-muted text-sm">{data.total} orders total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
