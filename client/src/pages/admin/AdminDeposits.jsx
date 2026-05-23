import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service.js';
import { formatCurrency, formatDate } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

const STATUS_BADGE = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-danger/10 text-danger border-danger/20',
};

function RejectModal({ depositId, onClose }) {
  const [reason, setReason] = useState('');
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => adminService.rejectDeposit(depositId, { reason }),
    onSuccess: () => { toast.success('Deposit rejected'); qc.invalidateQueries({ queryKey: ['admin-deposits'] }); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm">
        <h3 className="font-semibold text-text-primary mb-4">Reject Deposit</h3>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input resize-none" rows={3} placeholder="Reason for rejection..." />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!reason || mutation.isPending} className="btn-primary flex-1 bg-danger hover:bg-danger/90 flex items-center justify-center gap-2">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDeposits() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deposits', statusFilter, page],
    queryFn: () => adminService.getDeposits({ status: statusFilter, page, limit: 20 }),
    select: (r) => r.data.data,
  });

  const approveMutation = useMutation({
    mutationFn: (id) => adminService.approveDeposit(id),
    onSuccess: () => { toast.success('Deposit approved'); qc.invalidateQueries({ queryKey: ['admin-deposits'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deposits = data?.deposits || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Deposits</h1>
        <p className="text-text-secondary mt-1">Review and approve wallet deposits</p>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize', statusFilter === s ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2')}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : deposits.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-sm">No deposits found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['User', 'Amount', 'Method', 'Proof', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deposits.map((d) => (
                  <tr key={d._id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{d.userId?.name}</p>
                      <p className="text-text-muted text-xs">{d.userId?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-success">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{d.method?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      {d.proofImageUrl ? (
                        <a href={d.proofImageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-xs">
                          View <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge border', STATUS_BADGE[d.status] || STATUS_BADGE.pending)}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3">
                      {d.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => approveMutation.mutate(d._id)}
                            disabled={approveMutation.isPending}
                            className="p-1.5 hover:bg-success/10 text-text-muted hover:text-success rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => setRejectId(d._id)}
                            className="p-1.5 hover:bg-danger/10 text-text-muted hover:text-danger rounded transition-colors"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
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
          <p className="text-text-muted text-sm">{data.total} deposits total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {rejectId && <RejectModal depositId={rejectId} onClose={() => setRejectId(null)} />}
    </div>
  );
}
