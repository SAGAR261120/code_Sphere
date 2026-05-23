import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { formatCurrency, formatDate } from '../../lib/utils.js';

function SimpleBarChart({ data, valueKey, labelKey, color = 'bg-primary', formatValue = (v) => v }) {
  if (!data?.length) return <p className="text-text-muted text-sm">No data available</p>;
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-text-muted w-16 shrink-0 text-right">{item[labelKey]}</span>
          <div className="flex-1 bg-surface-2 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all`}
              style={{ width: max > 0 ? `${(item[valueKey] / max) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-xs text-text-primary w-20 shrink-0">{formatValue(item[valueKey])}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30d');

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['admin-revenue', period],
    queryFn: () => adminService.getRevenueChart({ period }),
    select: (r) => r.data.data,
  });

  const { data: userGrowth, isLoading: ugLoading } = useQuery({
    queryKey: ['admin-user-growth', period],
    queryFn: () => adminService.getUserGrowthChart({ period }),
    select: (r) => r.data.data,
  });

  const { data: topProducts } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: () => adminService.getTopProducts(),
    select: (r) => r.data.data,
  });

  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminService.getOverviewStats(),
    select: (r) => r.data.data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-text-secondary mt-1">Platform performance metrics</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Revenue', value: formatCurrency(overview?.totalRevenue || 0), icon: DollarSign, color: 'text-success' },
          { title: 'Total Users', value: (overview?.totalUsers || 0).toLocaleString(), icon: Users, color: 'text-primary' },
          { title: 'Total Orders', value: (overview?.totalOrders || 0).toLocaleString(), icon: ShoppingBag, color: 'text-warning' },
          { title: 'Avg. Order Value', value: formatCurrency(overview?.totalOrders > 0 ? (overview.totalRevenue / overview.totalOrders) : 0), icon: TrendingUp, color: 'text-purple-400' },
        ].map(({ title, value, icon: Icon, color }) => (
          <div key={title} className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-sm">{title}</p>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Revenue ({period})</h3>
          {revLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin text-primary" /></div>
          ) : (
            <SimpleBarChart
              data={revenue}
              valueKey="revenue"
              labelKey="label"
              color="bg-success"
              formatValue={formatCurrency}
            />
          )}
        </div>

        {/* User growth chart */}
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">New Users ({period})</h3>
          {ugLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin text-primary" /></div>
          ) : (
            <SimpleBarChart
              data={userGrowth}
              valueKey="count"
              labelKey="label"
              color="bg-primary"
            />
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="card">
        <h3 className="font-semibold text-text-primary mb-4">Top Products by Revenue</h3>
        {!topProducts?.length ? (
          <p className="text-text-muted text-sm">No data available</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p._id} className="flex items-center gap-4">
                <span className="w-6 text-text-muted text-sm font-medium">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-text-muted">{p.totalSales} sales</span>
                    <div className="flex-1 bg-surface-2 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: topProducts[0]?.revenue > 0 ? `${(p.revenue / topProducts[0].revenue) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-success shrink-0">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
