import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, ShoppingBag, CheckSquare, Download,
  Users, Settings, Bell, Menu, X, Code2, Coins, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore.js';
import { formatCurrency, formatCoins, getInitials, cn } from '../lib/utils.js';
import { useNotificationStore } from '../stores/notificationStore.js';
import { useUnreadCount } from '../hooks/useNotifications.js';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/dashboard/tasks', icon: CheckSquare, label: 'Task Center' },
  { to: '/dashboard/downloads', icon: Download, label: 'Downloads' },
  { to: '/dashboard/referrals', icon: Users, label: 'Referrals' },
  { to: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function UserLayout() {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotificationStore();
  useUnreadCount();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Code2 size={15} className="text-white" />
          </div>
          <span>Code<span className="text-primary">Market</span></span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.avatar ? <img src={user.avatar} className="w-9 h-9 rounded-full object-cover" /> : getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary text-sm truncate">{user?.name}</p>
            <p className="text-text-muted text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-background rounded-lg p-2 text-center">
            <p className="text-[10px] text-text-muted">Wallet</p>
            <p className="text-success font-semibold text-xs">{formatCurrency(user?.walletBalance)}</p>
          </div>
          <div className="bg-background rounded-lg p-2 text-center">
            <p className="text-[10px] text-text-muted">Coins</p>
            <p className="text-warning font-semibold text-xs">{formatCoins(user?.coinBalance)} 🪙</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={16} />
            <span>{label}</span>
            {label === 'Notifications' && unreadCount > 0 && (
              <span className="ml-auto badge bg-danger text-white text-[10px]">{unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Link to="/marketplace" className="sidebar-link text-sm">
          <ChevronRight size={14} /> Browse Marketplace
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-surface border-r border-border lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-surface-2 rounded-lg">
            <Menu size={18} />
          </button>
          <Link to="/" className="font-bold text-sm">Code<span className="text-primary">Market</span></Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserLayout;
