import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, Lock, Coins, HelpCircle } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xs py-8 mt-12 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          {/* Brand & Purpose */}
          <div className="space-y-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500 flex items-center justify-center text-white font-black text-xs">
                C
              </span>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                CPC Marketplace
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Curated digital marketplace for production-ready web apps, mobile apps, SaaS templates, and verified source code.
            </p>
          </div>

          {/* Marketplace Navigation */}
          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Platform
            </span>
            <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/explore" className="hover:text-sky-500 transition-colors">
                  Browse All Products
                </Link>
              </li>
              <li>
                <Link href="/earn" className="hover:text-sky-500 transition-colors">
                  Earn CPC Coins
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-sky-500 transition-colors">
                  Coin Wallet & Ledgers
                </Link>
              </li>
              <li>
                <Link href="/purchases" className="hover:text-sky-500 transition-colors">
                  My Purchases & Entitlements
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust, Security & Currency */}
          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Trust & Security
            </span>
            <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Double-Entry Verified Ledger</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Lock size={13} className="text-sky-500" />
                <span>HMAC-Signed Download Tokens</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Coins size={13} className="text-amber-500" />
                <span>Non-Fiat Digital Utility Credits</span>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Links */}
          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Legal & Compliance
            </span>
            <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/terms" className="hover:text-sky-500 transition-colors flex items-center gap-1">
                  <FileText size={12} />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-sky-500 transition-colors flex items-center gap-1">
                  <Lock size={12} />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-sky-500 transition-colors flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Buyer Protection & Refunds</span>
                </Link>
              </li>
              <li>
                <Link href="/licenses" className="hover:text-sky-500 transition-colors flex items-center gap-1">
                  <FileText size={12} />
                  <span>Commercial License Agreement</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            &copy; 2026 CPC Marketplace &bull; AstraNova Technologies. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/refund-policy" className="hover:underline">Refunds</Link>
            <Link href="/licenses" className="hover:underline">License Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
