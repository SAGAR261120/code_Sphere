import React from 'react';
import Link from 'next/link';
import { RotateCcw, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
          Home
        </Link>
        <ChevronRight size={13} />
        <span className="text-slate-800 dark:text-slate-200 font-medium">Refund Policy</span>
      </nav>

      {/* Header */}
      <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Buyer Protection
          </span>
          <span className="text-xs text-slate-400">Policy Version: 2.0</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Buyer Protection & Refund Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Clear, trustworthy guidelines regarding refunds, license revocations, and defective digital software packages.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            1. Nature of Digital Software Products
          </h2>
          <p>
            Due to the immediate access nature of downloadable digital items (source code repositories, ZIP archives, APKs, PDF manuals), digital products generally cannot be &quot;returned&quot; once decrypted or downloaded. However, CPC Marketplace provides robust buyer protection to guarantee that software matches published specifications.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            2. 48-Hour Technical Defect Window
          </h2>
          <p>
            You may request a full refund within <strong>48 hours</strong> of completing an order if:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>The package is demonstrably broken, defective, or missing critical promised files.</li>
            <li>The software materially differs from the verified description, tech stack, or supported platforms stated on the product page.</li>
            <li>The publisher or technical support is unable to resolve the verifiable issue within a reasonable period.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            3. Automated Wallet Restorations & License Revocation
          </h2>
          <p>
            When a refund is approved and processed:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Atomic Ledger Credit:</strong> Debited CPC Coins are immediately returned to your available wallet balance via a compensating <code>REFUND_CREDIT</code> ledger transaction.</li>
            <li><strong>Entitlement Revocation:</strong> Your commercial license certificate and signed download URL access are permanently marked <code>REVOKED</code>.</li>
            <li><strong>Cessation of Use:</strong> Upon refund issuance, you must delete all local copies, branches, or extracts of the refunded source code and may not deploy the software in production.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            4. Non-Refundable Situations
          </h2>
          <p>
            Refunds cannot be issued for:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Change of mind after source code has been downloaded.</li>
            <li>Lack of technical expertise to run clearly stated frameworks (e.g. Node.js or Docker requirements specified on product page).</li>
            <li>Promotional bonus coins or tasks completed.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
