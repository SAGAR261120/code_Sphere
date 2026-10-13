'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Lock,
  CheckCircle2,
  BookOpen,
  Terminal,
  Cpu,
  ShieldCheck,
  Calendar,
  Globe,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import { DocumentItemDto } from '@/services/documentation.service';
import { useMarketplace } from '@/context/marketplace-context';

interface ProductDocumentationSectionProps {
  slug: string;
  productTitle: string;
}

export function ProductDocumentationSection({
  slug,
  productTitle,
}: ProductDocumentationSectionProps) {
  const { user, addToast } = useMarketplace();
  const [documents, setDocuments] = useState<DocumentItemDto[]>([]);
  const [isPurchaser, setIsPurchaser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/v1/products/${slug}/documentation`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setDocuments(json.data.documents || []);
          setIsPurchaser(json.data.isPurchaser || false);
        }
      })
      .catch((err) => console.error('Failed to load documentation', err))
      .finally(() => setLoading(false));
  }, [slug, user]);

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'OVERVIEW':
        return <BookOpen size={18} className="text-sky-500" />;
      case 'MANUAL':
        return <FileText size={18} className="text-indigo-500" />;
      case 'INSTALLATION_GUIDE':
        return <Terminal size={18} className="text-emerald-500" />;
      case 'TECHNICAL_SPEC':
        return <Cpu size={18} className="text-amber-500" />;
      case 'API_DOC':
        return <Layers size={18} className="text-purple-500" />;
      case 'LICENSE':
        return <ShieldCheck size={18} className="text-rose-500" />;
      default:
        return <FileText size={18} className="text-slate-400" />;
    }
  };

  const formatDocTypeName = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Info Banner */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={16} className="text-sky-500" />
            <span>Official Documentation & Download Center</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographically validated PDF manuals, architectural blueprints, installation guides, and API specifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPurchaser ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={13} />
              <span>Full Access Unlocked</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span>Public PDFs Available</span>
            </span>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
          No documentation files published for this package yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3">
                {/* Header: Icon, Title & Access Tag */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getDocTypeIcon(doc.documentType)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                        {formatDocTypeName(doc.documentType)}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {doc.title}
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      doc.isPublic
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                        : doc.accessGranted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {doc.isPublic
                      ? 'Free Public'
                      : doc.accessGranted
                      ? 'Purchaser Unlocked'
                      : 'Purchaser Only'}
                  </span>
                </div>

                {/* Summary */}
                {doc.contentSummary && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {doc.contentSummary}
                  </p>
                )}

                {/* Metadata Chips: Version, Language, Size, Date */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono">
                    v{doc.version}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    <Globe size={11} className="text-slate-400" />
                    <span>{doc.language}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono">
                    {formatFileSize(doc.fileSizeBytes)}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar size={11} />
                    <span>{formatDate(doc.updatedAt)}</span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {doc.downloadCount} {doc.downloadCount === 1 ? 'download' : 'downloads'}
                </span>

                {doc.accessGranted ? (
                  <a
                    href={`/api/v1/documentation/${doc.id}/download`}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
                  </a>
                ) : (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold cursor-not-allowed"
                    title="Acquire this package to download developer documentation"
                  >
                    <Lock size={13} />
                    <span>License Required</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
