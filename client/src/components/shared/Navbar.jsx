import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Menu, X, Bell, Coins, Wallet, ChevronDown, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore.js';
import { useLogout } from '../../hooks/useAuth.js';
import { useUnreadCount } from '../../hooks/useNotifications.js';
import { useNotificationStore } from '../../stores/notificationStore.js';
import { formatCurrency, formatCoins, getInitials } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

export function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { unreadCount } = useNotificationStore();

  useUnreadCount();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="text-text-primary">Code<span className="text-primary">Market</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/marketplace" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Marketplace</Link>
            <Link to="/dashboard/tasks" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Earn Coins</Link>
            <Link to="/faq" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">FAQ</Link>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Balances */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm">
                    <Coins size={14} className="text-warning" />
                    <span className="font-medium text-text-primary">{formatCoins(user.coinBalance)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm">
                    <Wallet size={14} className="text-success" />
                    <span className="font-medium text-text-primary">{formatCurrency(user.walletBalance)}</span>
                  </div>
                </div>

                {/* Notifications */}
                <Link to="/dashboard/notifications" className="relative p-2 hover:bg-surface rounded-lg transition-colors">
                  <Bell size={18} className="text-text-secondary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-surface rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.avatar ? <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" /> : getInitials(user.name)}
                    </div>
                    <ChevronDown size={14} className="text-text-secondary" />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="font-semibold text-text-primary text-sm truncate">{user.name}</p>
                          <p className="text-text-muted text-xs truncate">{user.email}</p>
                        </div>
                        <div className="p-1">
                          <DropLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setDropdownOpen(false)} />
                          <DropLink to="/dashboard/settings" icon={Settings} label="Settings" onClick={() => setDropdownOpen(false)} />
                          {(user.role === 'admin' || user.role === 'super_admin') && (
                            <DropLink to="/admin" icon={LayoutDashboard} label="Admin Panel" onClick={() => setDropdownOpen(false)} />
                          )}
                          <button
                            onClick={() => { logout(); setDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-danger hover:bg-danger/10 rounded-lg text-sm transition-colors"
                          >
                            <LogOut size={14} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border bg-surface overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              <Link to="/marketplace" className="sidebar-link" onClick={() => setMobileOpen(false)}>Marketplace</Link>
              <Link to="/dashboard/tasks" className="sidebar-link" onClick={() => setMobileOpen(false)}>Earn Coins</Link>
              <Link to="/faq" className="sidebar-link" onClick={() => setMobileOpen(false)}>FAQ</Link>
              {!isAuthenticated ? (
                <div className="flex gap-2 mt-2">
                  <Link to="/login" className="btn-secondary flex-1 text-center text-sm" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link to="/register" className="btn-primary flex-1 text-center text-sm" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </div>
              ) : (
                <>
                  <Link to="/dashboard" className="sidebar-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <button onClick={() => logout()} className="sidebar-link text-danger">Logout</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function DropLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg text-sm transition-colors">
      <Icon size={14} /> {label}
    </Link>
  );
}
