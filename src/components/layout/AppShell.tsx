'use client';

import React, { useState, Suspense } from 'react';
import { MarketplaceProvider } from '@/context/marketplace-context';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { AppFooter } from './AppFooter';
import { MobileNavigation } from './MobileNavigation';
import { ToastNotifications } from '../ui/ToastNotifications';
import { CheckoutModal } from '../marketplace/CheckoutModal';
import { TaskModal } from '../marketplace/TaskModal';
import { DepositModal } from '../marketplace/DepositModal';
import { DEMO_NOTICE } from '@/lib/demo-data';
import { Info } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <MarketplaceProvider>
      {/* 1. Global Notice Banner for clearly labeled demo mode */}
      <div className="bg-gradient-to-r from-amber-50 via-sky-50 to-amber-50 dark:from-sky-950 dark:via-slate-900 dark:to-amber-950 border-b border-amber-200 dark:border-amber-500/20 px-4 py-1 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2 text-center transition-colors">
        <Info size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
        <span>{DEMO_NOTICE}</span>
      </div>

      {/* 2. Top Header Navigation inside Suspense */}
      <Suspense fallback={<header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />}>
        <AppHeader onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)} />
      </Suspense>

      {/* 3. Main Workspace Container with Sidebar & Content (Full width) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-1 pb-20 lg:pb-12">
        <Suspense fallback={<div className="w-64 shrink-0 hidden lg:block" />}>
          <AppSidebar />
        </Suspense>
        <main className="flex-1 min-w-0 py-6 lg:pl-6">
          <Suspense fallback={<div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* 4. Mobile Bottom Nav & Slide-over Drawer inside Suspense */}
      <Suspense fallback={null}>
        <MobileNavigation
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />
      </Suspense>

      {/* 5. Production Footer */}
      <AppFooter />

      {/* 6. Global Interactive Modals & Toast System */}
      <CheckoutModal />
      <TaskModal />
      <DepositModal />
      <ToastNotifications />
    </MarketplaceProvider>
  );
}
