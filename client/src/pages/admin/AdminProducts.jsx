import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, Search, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service.js';
import { formatCurrency, formatCoins, formatDate } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

const STATUS_BADGE = {
  active: 'bg-success/10 text-success border-success/20',
  draft: 'bg-surface-2 text-text-muted border-border',
  pending: 'bg-warning/10 text-warning border-warning/20',
  rejected: 'bg-danger/10 text-danger border-danger/20',
  archived: 'bg-surface-2 text-text-muted border-border',
};

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, statusFilter, page],
    queryFn: () => adminService.listProducts({ search, status: statusFilter, page, limit: 15 }),
    select: (r) => r.data.data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminService.changeProductStatus(id, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteProduct(id),
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const products = data?.products || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Products</h1>
          <p className="text-text-secondary mt-1">Manage marketplace listings</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Add Product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending Review</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
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
                  {['Product', 'Price', 'Sales', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-2 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-text-primary max-w-xs truncate">{p.name}</p>
                          <p className="text-text-muted text-xs">{p.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.pricing?.isFree ? (
                        <span className="text-success">Free</span>
                      ) : (
                        <div>
                          {p.pricing?.moneyPrice > 0 && <p className="text-text-primary">{formatCurrency(p.pricing.moneyPrice)}</p>}
                          {p.pricing?.coinPrice > 0 && <p className="text-warning text-xs">{formatCoins(p.pricing.coinPrice)} coins</p>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{p.totalSales || 0}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge border', STATUS_BADGE[p.status] || STATUS_BADGE.draft)}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/admin/products/${p._id}/edit`} className="p-1.5 hover:bg-surface-2 text-text-muted hover:text-text-primary rounded transition-colors">
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => statusMutation.mutate({ id: p._id, status: p.status === 'active' ? 'draft' : 'active' })}
                          className="p-1.5 hover:bg-surface-2 text-text-muted hover:text-text-primary rounded transition-colors"
                          title={p.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {p.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p._id); }}
                          className="p-1.5 hover:bg-danger/10 text-text-muted hover:text-danger rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
          <p className="text-text-muted text-sm">{data.total} products total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
