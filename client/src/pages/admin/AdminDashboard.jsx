import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, ShoppingBag, DollarSign, Coins, AlertTriangle } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { formatCurrency, formatCoins, formatDate } from '../../lib/utils.js';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminService.getOverviewStats(),
    select: (r) => r.data.data,
  });

  const { data: activity, isLoading: actLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => adminService.getRecentActivity(),
    select: (r) => r.data.data,
  });

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-text-secondary mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-xl text-primary bg-primary/10"><Users size={22} /></div>
          <div><p className="text-text-secondary text-sm font-medium">Total Users</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{data?.totalUsers?.toLocaleString()}</p>
            {data?.newUsersToday > 0 && <p className="text-xs text-success mt-1">+{data.newUsersToday} today</p>}
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-xl text-warning bg-warning/10"><ShoppingBag size={22} /></div>
          <div><p className="text-text-secondary text-sm font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{data?.totalOrders?.toLocaleString()}</p>
            {data?.ordersToday > 0 && <p className="text-xs text-success mt-1">+{data.ordersToday} today</p>}
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-xl text-success bg-success/10"><DollarSign size={22} /></div>
          <div><p className="text-text-secondary text-sm font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{formatCurrency(data?.totalRevenue || 0)}</p>
            {data?.revenueToday > 0 && <p className="text-xs text-success mt-1">+{formatCurrency(data.revenueToday)} today</p>}
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-xl text-warning bg-warning/10"><Coins size={22} /></div>
          <div><p className="text-text-secondary text-sm font-medium">Coins Awarded</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{formatCoins(data?.totalCoinsAwarded || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Top Products</h3>
          {data?.topProducts?.length === 0 ? (
            <p className="text-text-secondary text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {(data?.topProducts || []).map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="w-6 text-text-muted text-sm font-medium">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                    <p className="text-xs text-text-muted">{p.totalSales} sales</p>
                  </div>
                  <span className="text-sm font-semibold text-success">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Recent Activity</h3>
          {actLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {(activity || []).map((item) => (
                <div key={item._id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{item.description}</p>
                    <p className="text-xs text-text-muted mt-0.5">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending deposits */}
      {data?.pendingDeposits > 0 && (
        <div className="card border-warning/30 bg-warning/5 flex items-center gap-3">
          <AlertTriangle size={18} className="text-warning shrink-0" />
          <p className="text-sm text-text-primary">
            <span className="font-semibold">{data.pendingDeposits}</span> deposit{data.pendingDeposits !== 1 ? 's' : ''} pending approval
          </p>
          <a href="/admin/deposits" className="ml-auto text-sm text-primary hover:underline">Review</a>
        </div>
      )}
    </div>
  );
}
