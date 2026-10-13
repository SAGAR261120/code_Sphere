import React from 'react';
import Link from 'next/link';
import { FileCode, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

export default function LicensesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
          Home
        </Link>
        <ChevronRight size={13} />
        <span className="text-slate-800 dark:text-slate-200 font-medium">Commercial License Terms</span>
      </nav>

      {/* Header */}
      <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Software Licensing
          </span>
          <span className="text-xs text-slate-400">Standard Commercial Digital License</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Commercial License Agreement
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Understanding your perpetual commercial rights and permitted uses for purchased digital software and source code.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Permitted Usages (You Can)</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">&bull;</span>
              <span>Deploy the software into commercial SaaS applications, client websites, or internal business systems.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">&bull;</span>
              <span>Modify, customize, refactor, and integrate source code into your own proprietary projects.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">&bull;</span>
              <span>Bundle the compiled binary as part of an end product sold or distributed to clients.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">&bull;</span>
              <span>Retain perpetual rights to use the acquired version indefinitely without recurring subscription fees.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20 space-y-3">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <XCircle size={16} />
            <span>Restricted Usages (You Cannot)</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&bull;</span>
              <span>Resell, sub-license, redistribute, or publish the raw source code repository on any public marketplace or code forum.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&bull;</span>
              <span>Claim authorship or copyright ownership over the original foundational software assets.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&bull;</span>
              <span>Share or leak cryptographically signed download tokens or private PDF license keys to unauthorized third parties.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 font-bold">&bull;</span>
              <span>Continue running or deploying software after an order has been refunded and revoked.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Full License Terms */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            1. Grant of License
          </h2>
          <p>
            Upon completion of an order on CPC Marketplace and settlement of required CPC Coins, AstraNova Technologies and the publishing author grant the purchaser a worldwide, non-exclusive, perpetual, non-transferable license to make use of the digital package in accordance with these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            2. License Key Verification
          </h2>
          <p>
            Each entitlement is assigned a unique cryptographic License Key recorded in the marketplace registry. This key serves as irrefutable proof of purchase and grants access to version updates, package downloads, and developer support.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            3. Disclaimer of Warranties
          </h2>
          <p>
            The software package is provided &quot;as is&quot;, without warranty of any kind, express or implied. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use or inability to use the software.
          </p>
        </section>
      </div>
    </div>
  );
}
