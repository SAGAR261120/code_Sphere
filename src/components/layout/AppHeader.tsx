'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  Coins,
  PlusCircle,
  Menu,
  ShieldCheck,
  User,
  ShoppingBag,
  Sliders,
  LogOut,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useMarketplace } from '@/context/marketplace-context';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { CoinBadge } from '../ui/CoinBadge';
import { formatCoins } from '@/lib/utils';
import { NotificationBell } from '../notifications/NotificationBell';

export function AppHeader({ onToggleMobileNav }: { onToggleMobileNav: () => void }) {
  const router = useRouter();
  const {
    user,
    role,
    logout,
    coinBalance,
    openDepositModal,
  } = useMarketplace();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-amber-500 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-black text-sm">
                CPC
              </div>
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  CPC Market
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Digital Code & Apps
              </span>
            </div>
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <SearchBar />
        </div>

        {/* Right Actions: Coins, Deposit, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Earn CTA */}
          <button
            type="button"
            onClick={() => router.push('/earn')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
          >
            <Zap size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
            <span>Earn Coins</span>
          </button>

          {/* Coin Balance Pill with click to Wallet */}
          <button
            type="button"
            onClick={() => router.push('/wallet')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-200 active:scale-95 cursor-pointer group shadow-xs"
            title="Click to view Wallet & Transaction Ledger"
          >
            <Coins size={16} className="text-amber-500 group-hover:rotate-12 transition-transform duration-200" />
            <span className="font-bold text-xs sm:text-sm text-amber-700 dark:text-amber-300 tabular-nums">
              {formatCoins(coinBalance)}
            </span>
          </button>

          {/* Add Funds Button */}
          <button
            type="button"
            onClick={openDepositModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
            title="Deposit funds to acquire CPC Coins"
          >
            <PlusCircle size={14} className="text-sky-500" />
            <span>Deposit</span>
          </button>

          {/* In-App Notifications Bell */}
          <NotificationBell />

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* User Profile / Role Switcher Dropdown */}
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
              aria-label="User account menu"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                {role === 'GUEST' ? 'G' : user?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-200">
                {role === 'GUEST' ? 'Guest' : user?.name?.split(' ')[0]}
              </span>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block transition-transform duration-200" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50 animate-dropdown">
                {/* User Info Header */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {role === 'GUEST' ? 'Browsing as Guest' : user?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {role === 'GUEST' ? 'Limited features enabled' : user?.email}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold">
                      {role}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Balance: {coinBalance} Coins
                    </span>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="space-y-0.5">
                  {role === 'GUEST' ? (
                    <div className="space-y-1 py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <User size={15} />
                        <span>Sign In</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push('/register');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <PlusCircle size={15} />
                        <span>Create Account</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push('/profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <User size={15} className="text-slate-400" />
                        <span>My Profile & Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push('/purchases');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <ShoppingBag size={15} className="text-slate-400" />
                        <span>My Purchases & Downloads</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push('/wallet');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Coins size={15} className="text-amber-500" />
                        <span>Wallet & Transaction Ledger</span>
                      </button>

                      {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push('/admin');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <ShieldCheck size={15} />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={async () => {
                            setIsProfileOpen(false);
                            await logout();
                            router.push('/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar visible under header on small screens */}
      <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <SearchBar />
      </div>
    </header>
  );
}
