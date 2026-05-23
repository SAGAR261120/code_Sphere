import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Shield, Ban, CheckCircle, Coins, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service.js';
import { formatCurrency, formatCoins, formatDate, getInitials } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

const STATUS_BADGE = {
  active: 'bg-success/10 text-success border-success/20',
  banned: 'bg-danger/10 text-danger border-danger/20',
  suspended: 'bg-warning/10 text-warning border-warning/20',
};

function AdjustModal({ user, type, onClose }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => type === 'coins' ? adminService.adjustUserCoins(user._id, data) : adminService.adjustUserWallet(user._id, data),
    onSuccess: () => { toast.success('Adjusted successfully'); qc.invalidateQueries({ queryKey: ['admin-users'] }); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm">
        <h3 className="font-semibold text-text-primary mb-4">Adjust {type === 'coins' ? 'Coins' : 'Wallet'} — {user.name}</h3>
        <div className="space-y-3">
          <input
            type="number"
            placeholder={`Amount (negative to deduct)`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => mutation.mutate({ amount: parseFloat(amount), reason })}
            disabled={mutation.isPending || !amount || !reason}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [adjustModal, setAdjustModal] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, statusFilter, page],
    queryFn: () => adminService.listUsers({ search, status: statusFilter, page, limit: 20 }),
    select: (r) => r.data.data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }) => adminService.updateUserStatus(id, { status, reason }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <p className="text-text-secondary mt-1">Manage user accounts</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="input pl-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
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
                  {['User', 'Status', 'Wallet', 'Coins', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{u.name}</p>
                          <p className="text-text-muted text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge border', STATUS_BADGE[u.status] || STATUS_BADGE.active)}>{u.status}</span>
                      {u.role !== 'user' && <span className="ml-1 badge bg-primary/10 text-primary border-primary/20">{u.role}</span>}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{formatCurrency(u.walletBalance)}</td>
                    <td className="px-4 py-3 text-text-primary">{formatCoins(u.coinBalance)}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAdjustModal({ user: u, type: 'coins' })}
                          className="p-1.5 hover:bg-warning/10 text-text-muted hover:text-warning rounded transition-colors"
                          title="Adjust coins"
                        >
                          <Coins size={14} />
                        </button>
                        <button
                          onClick={() => setAdjustModal({ user: u, type: 'wallet' })}
                          className="p-1.5 hover:bg-success/10 text-text-muted hover:text-success rounded transition-colors"
                          title="Adjust wallet"
                        >
                          <Wallet size={14} />
                        </button>
                        {u.status !== 'banned' ? (
                          <button
                            onClick={() => { if (confirm(`Ban ${u.name}?`)) statusMutation.mutate({ id: u._id, status: 'banned', reason: 'Admin action' }); }}
                            className="p-1.5 hover:bg-danger/10 text-text-muted hover:text-danger rounded transition-colors"
                            title="Ban user"
                          >
                            <Ban size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => statusMutation.mutate({ id: u._id, status: 'active', reason: 'Unbanned by admin' })}
                            className="p-1.5 hover:bg-success/10 text-text-muted hover:text-success rounded transition-colors"
                            title="Unban user"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-text-muted text-sm">{data.total} users total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {adjustModal && <AdjustModal user={adjustModal.user} type={adjustModal.type} onClose={() => setAdjustModal(null)} />}
    </div>
  );
}
