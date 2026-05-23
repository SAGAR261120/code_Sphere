import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service.js';
import { formatCurrency, formatDate } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(0.01),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxUsageCount: z.coerce.number().int().min(1).default(100),
  maxUsagePerUser: z.coerce.number().int().min(1).default(1),
  expiresAt: z.string().optional(),
  isActive: z.boolean().default(true),
});

function CouponModal({ onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: { discountType: 'percentage', maxUsageCount: 100, maxUsagePerUser: 1, isActive: true },
  });

  const mutation = useMutation({
    mutationFn: (data) => adminService.createCoupon(data),
    onSuccess: () => { toast.success('Coupon created'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-md my-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary">New Coupon</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-2 rounded"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Code *</label>
            <input {...register('code')} className="input uppercase" placeholder="SAVE20" />
            {errors.code && <p className="text-danger text-xs mt-1">{errors.code.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Discount Type *</label>
              <select {...register('discountType')} className="input">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Value *</label>
              <input type="number" step="0.01" {...register('discountValue')} className="input" />
              {errors.discountValue && <p className="text-danger text-xs mt-1">{errors.discountValue.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Min Order (₹)</label>
              <input type="number" step="0.01" {...register('minOrderAmount')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Max Total Uses</label>
              <input type="number" {...register('maxUsageCount')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Max Uses/User</label>
              <input type="number" {...register('maxUsagePerUser')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Expires At</label>
              <input type="date" {...register('expiresAt')} className="input" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
            <span className="text-sm text-text-secondary">Active</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCoupons() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminService.listCoupons(),
    select: (r) => r.data.data,
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => adminService.toggleCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteCoupon(id),
    onSuccess: () => { toast.success('Coupon deleted'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const coupons = data?.coupons || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Coupons</h1>
          <p className="text-text-secondary mt-1">Manage discount codes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> New Coupon
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center">
            <Tag size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted text-sm">No coupons yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Code', 'Discount', 'Min Order', 'Usage', 'Expires', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-text-primary">{c.code}</td>
                    <td className="px-4 py-3 text-text-primary">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{c.minOrderAmount > 0 ? formatCurrency(c.minOrderAmount) : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.usageCount}/{c.maxUsageCount}</td>
                    <td className="px-4 py-3 text-text-muted">{c.expiresAt ? formatDate(c.expiresAt) : 'Never'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge border', c.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-surface-2 text-text-muted border-border')}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleMutation.mutate(c._id)}
                          className="p-1.5 hover:bg-surface-2 text-text-muted hover:text-text-primary rounded transition-colors"
                          title={c.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {c.isActive ? <ToggleRight size={16} className="text-success" /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete coupon "${c.code}"?`)) deleteMutation.mutate(c._id); }}
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

      {showModal && <CouponModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
