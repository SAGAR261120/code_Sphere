'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Zap,
  Wallet,
  ShoppingBag,
  User,
  ShieldAlert,
  X,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { useMarketplace } from '@/context/marketplace-context';
import { formatCoins } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const pathname = usePathname();
  const [optimisticPath, setOptimisticPath] = useState(pathname);
  const { coinBalance, user, role } = useMarketplace();

  useEffect(() => {
    setOptimisticPath(pathname);
  }, [pathname]);

  const currentPath = optimisticPath || pathname;

  const bottomNavItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Earn', href: '/earn', icon: Zap, badge: 'Daily' },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Purchases', href: '/purchases', icon: ShoppingBag },
  ];

  const drawerLinks = [
    { name: 'Marketplace Home', href: '/', icon: Home },
    { name: 'Explore All Apps', href: '/explore', icon: Compass },
    { name: 'Earn Coins / Tasks', href: '/earn', icon: Zap, badge: 'Daily' },
    { name: 'CPC Coin Wallet', href: '/wallet', icon: Wallet },
    { name: 'My Purchases & Downloads', href: '/purchases', icon: ShoppingBag },
    { name: 'User Profile & Settings', href: '/profile', icon: User },
    ...(role === 'ADMIN' || role === 'SUPER_ADMIN'
      ? [{ name: 'Admin Dashboard', href: '/admin', icon: ShieldAlert, badge: 'Staff' }]
      : []),
  ];

  return (
    <>
      {/* 1. Bottom Fixed Mobile Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg"
        aria-label="Mobile Navigation Bar"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? currentPath === '/'
              : currentPath === item.href || currentPath.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOptimisticPath(item.href)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all duration-200 relative cursor-pointer active:scale-95',
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <div className="relative">
                <Icon size={19} className={cn('transition-transform duration-200', isActive && 'scale-110')} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <span className="mt-0.5">{item.name}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-3 h-0.5 rounded-full bg-sky-500 dark:bg-sky-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 2. Slide-Over Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col p-5 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
                  CPC
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  CPC Market
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile Mini Banner */}
            <div className="py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                {role === 'GUEST' ? 'G' : user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {role === 'GUEST' ? 'Guest Visitor' : user?.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Coins size={12} className="text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                    {formatCoins(coinBalance)} Coins
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              {drawerLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? currentPath === '/'
                    : currentPath === item.href || currentPath.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setOptimisticPath(item.href);
                      onClose();
                    }}
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ease-out cursor-pointer',
                      isActive
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={17} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight size={13} className="text-slate-400" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
              CPC Marketplace &copy; 2026 AstraNova
            </div>
          </div>
        </div>
      )}
    </>
  );
}
