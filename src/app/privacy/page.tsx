import React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, ChevronRight } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
          Home
        </Link>
        <ChevronRight size={13} />
        <span className="text-slate-800 dark:text-slate-200 font-medium">Privacy Policy</span>
      </nav>

      {/* Header */}
      <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Data Protection
          </span>
          <span className="text-xs text-slate-400">Last Revised: October 13, 2026</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          How AstraNova Technologies collects, protects, uses, and respects your personal data on CPC Marketplace.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            1. Information We Collect
          </h2>
          <p>
            We collect only information necessary to deliver marketplace services, secure transactions, and maintain ledger integrity:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Account Information:</strong> Email address, hashed passwords (bcrypt cost 12), and public display name.</li>
            <li><strong>Financial & Transaction Records:</strong> Ledger transaction history, coin balance adjustments, order numbers, and payment provider transaction references. We never store raw credit card numbers or banking passwords.</li>
            <li><strong>Technical & Telemetry Data:</strong> IP addresses (anonymized for analytics), user-agent headers, and security audit logs to protect against fraudulent activities.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            2. How We Use Information
          </h2>
          <p>
            Your information is used solely to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Authenticate sessions and process entitled digital software downloads.</li>
            <li>Maintain tamper-evident ledger histories for wallet transactions.</li>
            <li>Prevent account takeovers, brute force logins, and double-spending attacks.</li>
            <li>Deliver critical notifications regarding purchases, version updates, and security notices.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            3. Data Sharing & Third Parties
          </h2>
          <p>
            We do NOT sell, rent, or trade your personal data. Data is shared with external services strictly when required to execute services:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Payment Gateways (e.g. Razorpay):</strong> To process verified fiat deposit intents.</li>
            <li><strong>Object Storage (e.g. S3 / R2):</strong> To deliver short-lived signed URLs for entitled software files.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            4. Your Rights & Account Deletion
          </h2>
          <p>
            In compliance with applicable privacy regulations including the Digital Personal Data Protection Act (DPDP Act, India), you have the right to inspect your account data and request account deletion. Account deletion requests can be initiated from your profile settings. Note that legally required financial transaction ledgers are retained for mandatory audit compliance.
          </p>
        </section>
      </div>
    </div>
  );
}
