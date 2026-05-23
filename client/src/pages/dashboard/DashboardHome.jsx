import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Coins, ShoppingBag, CheckSquare, Download, ArrowRight } from 'lucide-react';
import api from '../../lib/axios.js';
import { StatCard } from '../../components/shared/StatCard.jsx';
import { PageLoader } from '../../components/shared/PageLoader.jsx';
import { formatCurrency, formatCoins, formatDate } from '../../lib/utils.js';
import { useAuthStore } from '../../stores/authStore.js';

export default function DashboardHome() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/users/dashboard-summary').then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-text-secondary mt-1">Here's your account overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Wallet} title="Wallet Balance" value={formatCurrency(data?.wallet?.balance)} color="success" />
        <StatCard icon={Coins} title="Coin Balance" value={`${formatCoins(data?.wallet?.coins)} 🪙`} color="warning" />
        <StatCard icon={ShoppingBag} title="Total Purchases" value={data?.stats?.totalPurchases || 0} color="primary" />
        <StatCard icon={CheckSquare} title="Tasks Completed" value={data?.stats?.tasksCompleted || 0} color="primary" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { to: '/marketplace', icon: ShoppingBag, label: 'Browse Products', desc: 'Find your next project', color: 'primary' },
          { to: '/dashboard/tasks', icon: Coins, label: 'Earn Coins', desc: 'Complete tasks for rewards', color: 'warning' },
          { to: '/dashboard/wallet', icon: Wallet, label: 'Add Funds', desc: 'Top up your wallet', color: 'success' },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="card hover:border-primary/40 transition-all group">
            <Icon size={20} className="text-primary mb-3" />
            <p className="font-semibold text-text-primary group-hover:text-primary transition-colors">{label}</p>
            <p className="text-text-secondary text-sm mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      {data?.recentOrders?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Recent Purchases</h3>
            <Link to="/dashboard/orders" className="text-primary text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order._id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <img
                  src={order.productId?.thumbnail || 'https://placehold.co/40x40/1A1D27/6366F1?text=C'}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{order.productId?.name}</p>
                  <p className="text-text-muted text-xs">{formatDate(order.createdAt)}</p>
                </div>
                <Link
                  to="/dashboard/downloads"
                  className="badge bg-success/10 text-success border border-success/20 shrink-0"
                >
                  <Download size={10} /> Download
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
