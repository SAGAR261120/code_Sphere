import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Package, CheckSquare, ShoppingBag,
  Wallet, BarChart2, Ticket, AlertTriangle, Settings, Menu, Code2,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore.js';
import { cn, getInitials } from '../lib/utils.js';

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/deposits', icon: Wallet, label: 'Deposits' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/admin/coupons', icon: Ticket, label: 'Coupons' },
];

export function AdminLayout() {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-7 h-7 bg-danger rounded-lg flex items-center justify-center">
            <Code2 size={15} className="text-white" />
          </div>
          <span className="text-danger">Admin</span>
          <span>Panel</span>
        </Link>
      </div>
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-danger/20 rounded-full flex items-center justify-center text-danger text-xs font-bold">
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium">{user?.name}</p>
            <span className="badge bg-danger/10 text-danger text-[10px]">{user?.role}</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border space-y-0.5">
        <Link to="/dashboard" className="sidebar-link text-sm"><Users size={14} /> User View</Link>
        <Link to="/" className="sidebar-link text-sm"><Code2 size={14} /> Front End</Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-60 bg-surface border-r border-border lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-surface-2 rounded-lg">
            <Menu size={18} />
          </button>
          <span className="font-bold text-sm text-danger">Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
