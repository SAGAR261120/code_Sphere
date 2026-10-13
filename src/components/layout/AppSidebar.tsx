'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Home,
  Zap,
  Wallet,
  ShoppingBag,
  User,
  ShieldAlert,
  ChevronRight,
  Coins,
  Globe,
  Smartphone,
  Rocket,
  Layout,
  Code,
} from 'lucide-react';
import { useMarketplace } from '@/context/marketplace-context';
import { formatCoins } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [optimisticPath, setOptimisticPath] = useState(pathname);
  const { coinBalance, setSelectedCategory, role } = useMarketplace();

  // Keep optimistic path in sync when pathname changes externally
  useEffect(() => {
    setOptimisticPath(pathname);
  }, [pathname]);

  const mainNavLinks = [
    { name: 'Marketplace Home', href: '/', icon: Home },
    { name: 'Explore All Apps', href: '/explore', icon: Compass },
    { name: 'Earn Coins / Tasks', href: '/earn', icon: Zap, badge: 'Daily' },
    { name: 'CPC Coin Wallet', href: '/wallet', icon: Wallet },
    { name: 'My Purchases', href: '/purchases', icon: ShoppingBag },
    { name: 'User Profile', href: '/profile', icon: User },
    ...(role === 'ADMIN' || role === 'SUPER_ADMIN'
      ? [{ name: 'Admin Dashboard', href: '/admin', icon: ShieldAlert, badge: 'Staff' }]
      : []),
  ];

  const quickCategories = [
    { name: 'Web Applications', slug: 'web-apps', icon: Globe },
    { name: 'Mobile Apps', slug: 'mobile-apps', icon: Smartphone },
    { name: 'SaaS Starters', slug: 'saas-starter', icon: Rocket },
    { name: 'Website Templates', slug: 'website-templates', icon: Layout },
    { name: 'Python Scripts', slug: 'python-scripts', icon: Code },
  ];

  const currentPath = optimisticPath || pathname;

  return (
    <aside
      className={cn(
        'w-64 shrink-0 hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm p-4 transition-all h-[calc(100vh-4rem)] sticky top-16',
        className
      )}
    >
      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Marketplace
          </div>
          {mainNavLinks.map((item) => {
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
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ease-out group cursor-pointer',
                  isActive
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/25 shadow-xs shadow-sky-500/5 translate-x-0.5'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all duration-200',
                      isActive ? 'bg-sky-500 dark:bg-sky-400 scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'
                    )}
                    aria-hidden="true"
                  />
                  <Icon
                    size={17}
                    className={cn(
                      'transition-colors duration-200',
                      isActive
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Category Filters */}
        <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/70">
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Categories
          </div>
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/explore?category=${cat.slug}`}
                onClick={() => {
                  setOptimisticPath('/explore');
                  setSelectedCategory(cat.slug);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Icon size={15} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                  <span>{cat.name}</span>
                </div>
                <ChevronRight size={13} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Mini Wallet Card */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="p-3 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Wallet Balance
            </span>
            <Coins size={15} className="text-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-300 tabular-nums">
            {formatCoins(coinBalance)} Coins
          </div>
          <Link
            href="/earn"
            className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Earn more coins today</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
