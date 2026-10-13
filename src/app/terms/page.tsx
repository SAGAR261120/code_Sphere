import React from 'react';
import Link from 'next/link';
import { ShieldAlert, CheckCircle, FileText, ChevronRight } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
          Home
        </Link>
        <ChevronRight size={13} />
        <span className="text-slate-800 dark:text-slate-200 font-medium">Terms of Service</span>
      </nav>

      {/* Header */}
      <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Legal Agreement
          </span>
          <span className="text-xs text-slate-400">Effective Date: October 13, 2026</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Governing your access, user accounts, digital transactions, and task participations on CPC Marketplace.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            1. Acceptance of Terms
          </h2>
          <p>
            By registering for an account, accessing the marketplace catalog, earning CPC Coins, or completing digital purchases on CPC Marketplace (operated by AstraNova Technologies), you explicitly agree to be bound by these Terms of Service. If you do not agree, you must cease using the platform immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            2. CPC Coins — Internal Utility Credits
          </h2>
          <p>
            CPC Coins are strictly internal, platform-specific digital utility credits. CPC Coins:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Do NOT constitute Indian Rupees (INR), foreign currency, fiat money, or legal tender.</li>
            <li>Do NOT constitute a financial investment, cryptocurrency, security, or redeemable cash asset.</li>
            <li>Cannot be withdrawn, cashed out, or redeemed for fiat currency unless explicitly permitted under legally reviewed platform policies.</li>
            <li>Are managed authoritatively on the server through double-entry ledger accounting. Client-side representations cannot alter wallet balances.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            3. User Accounts & Security
          </h2>
          <p>
            Users must provide accurate email credentials and maintain confidential passwords. You are responsible for all actions taken under your account. Any attempts to bypass authentication, share private download tokens, automate task bots, or tamper with financial ledgers will result in immediate account suspension and revocation of all entitlements without refund.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            4. Task System & Anti-Fraud Policy
          </h2>
          <p>
            Users can earn CPC Coins by engaging with educational and instructional tasks. You agree:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Not to deploy automated scripts, scrapers, headless browsers, or botnets to fabricate completions.</li>
            <li>Coins are awarded strictly after verified completion confirms with server-side timing and provider validations.</li>
            <li>Falsified return links, query tampering, or replay attempts will be logged as security incidents and flagged for admin review.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            5. Intellectual Property & Digital Products
          </h2>
          <p>
            Digital products, source code repositories, and documentation acquired through CPC Marketplace remain the intellectual property of their verified publishers or AstraNova Technologies. Acquisition grants a non-exclusive license under the terms specified at checkout.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            6. Governing Law & Dispute Resolution
          </h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
        </section>
      </div>
    </div>
  );
}
