'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/context/marketplace-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatCoins } from '@/lib/utils';
import {
  Download,
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileCode,
  BookOpen,
  ShoppingBag,
  RefreshCw,
  Search,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';

export default function PurchasesPage() {
  const { addToast } = useMarketplace();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Download loading states
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Refund dialog states
  const [refundingOrder, setRefundingOrder] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/v1/orders?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    setCopiedKey(licenseKey);
    addToast('License Key Copied', 'Copied to clipboard.', 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadFile = async (productFileId: string, entitlementId: string, fileName: string) => {
    setDownloadingFileId(productFileId);
    try {
      const res = await fetch('/api/v1/downloads/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productFileId, entitlementId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to generate download token');
      }

      const downloadUrl = json.data.downloadUrl;
      addToast(
        'Download Initiated',
        `Generated 15-minute secure token for ${fileName}.`,
        'success'
      );

      // Trigger file download
      window.open(downloadUrl, '_blank');
      fetchOrders(); // Refresh download counts
    } catch (err: any) {
      addToast('Download Error', err.message, 'error');
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleDownloadPdf = (entitlementId: string, productTitle: string) => {
    addToast('Generating PDF', `Creating official License Certificate for ${productTitle}...`, 'info');
    window.open(`/api/v1/downloads/pdf/${entitlementId}`, '_blank');
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingOrder) return;

    setIsSubmittingRefund(true);
    try {
      const res = await fetch(`/api/v1/orders/${refundingOrder.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Refund request failed');
      }

      addToast(
        'Refund Completed',
        `Order #${refundingOrder.orderNumber} refunded. ${json.data.refundedCoins} CPC Coins restored to wallet.`,
        'success'
      );

      setRefundingOrder(null);
      setRefundReason('');
      fetchOrders();
    } catch (err: any) {
      addToast('Refund Error', err.message, 'error');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchNumber = ord.orderNumber.toLowerCase().includes(q);
    const matchProduct = ord.items?.some((i: any) =>
      i.product?.title?.toLowerCase().includes(q)
    );
    return matchNumber || matchProduct;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20">
              Purchases & Entitlements
            </span>
            <span className="text-xs text-slate-400">Cryptographically Signed Licenses</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            My Purchases & Source Code
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Access your acquired digital software packages, source code repositories, and license certificates.
          </p>
        </div>

        <Link
          href="/explore"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Explore Marketplace</span>
        </Link>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number or product name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg cursor-pointer"
            title="Refresh purchases"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Orders & Purchases List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500" />
          <p className="text-xs">Loading verified entitlements...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Purchases Found"
          description={
            searchQuery
              ? 'No orders match your search criteria. Try a different query.'
              : "You haven't acquired any software packages or digital products yet."
          }
          actionText="Browse Digital Products"
          onAction={() => window.location.assign('/explore')}
        />
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const item = order.items?.[0];
            const product = item?.product;
            const version = item?.version;
            const entitlement = item?.entitlement;
            const files = version?.files || [];
            const isRefunded = order.status === 'REFUNDED';

            return (
              <div
                key={order.id}
                className={`p-6 rounded-3xl border transition-all ${
                  isRefunded
                    ? 'border-purple-500/20 bg-purple-500/5 dark:bg-slate-900/60 opacity-80'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      Order #{order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      Purchased on {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={13} />
                        Active License
                      </span>
                    )}
                    {order.status === 'REFUNDED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <RotateCcw size={13} />
                        Refunded (Revoked)
                      </span>
                    )}

                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {order.totalCoins === 0 ? 'Free ($0)' : `${formatCoins(order.totalCoins)} Coins`}
                    </span>
                  </div>
                </div>

                {/* Product Info & Files Section */}
                <div className="pt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Product Overview */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center text-xl">
                        {product?.images?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>📦</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${product?.slug}`}
                          className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 line-clamp-1 transition-colors"
                        >
                          {product?.title || 'Digital Product Package'}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {product?.shortDescription}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                          <span>Version {version?.version || '1.0.0'}</span>
                          <span>•</span>
                          <span>{item?.licenseType || 'Commercial'}</span>
                        </div>
                      </div>
                    </div>

                    {/* License Key box */}
                    {entitlement && (
                      <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>License Certificate Key</span>
                          <span className="font-mono">
                            {entitlement.downloadCount} / {entitlement.maxDownloads} downloads
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 font-mono text-xs font-bold text-sky-600 dark:text-sky-400 truncate">
                            {entitlement.isRevoked ? (
                              <span className="text-rose-500 line-through">REVOKED</span>
                            ) : (
                              entitlement.licenseKey
                            )}
                          </div>
                          {!entitlement.isRevoked && (
                            <button
                              type="button"
                              onClick={() => handleCopy(entitlement.licenseKey)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy license key"
                            >
                              {copiedKey === entitlement.licenseKey ? (
                                <Check size={14} className="text-emerald-500" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions: PDF Certificate, Invoice & Refund */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {entitlement && !isRefunded && (
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(entitlement.id, product?.title)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText size={13} className="text-sky-500" />
                          <span>PDF Certificate</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          addToast('Generating Invoice', `Opening official invoice for #${order.orderNumber}...`, 'info');
                          window.open(`/api/v1/orders/${order.id}/receipt`, '_blank');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={13} className="text-indigo-500" />
                        <span>PDF Invoice</span>
                      </button>

                      {!isRefunded && order.totalCoins > 0 && (
                        <button
                          type="button"
                          onClick={() => setRefundingOrder(order)}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/20 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <RotateCcw size={13} />
                          <span>Request Refund</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Available Downloads Files List */}
                  <div className="lg:col-span-2 space-y-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Downloadable Assets & Releases
                    </span>

                    {isRefunded ? (
                      <div className="p-6 rounded-2xl border border-purple-500/20 bg-purple-500/10 text-xs text-purple-700 dark:text-purple-300 space-y-1">
                        <div className="font-bold">License Entitlement Revoked</div>
                        <p>
                          This order was refunded. Download access to private source code and release builds has been terminated.
                        </p>
                      </div>
                    ) : files.length === 0 ? (
                      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-400">
                        No downloadable binary packages attached to this release version.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {files.map((file: any) => {
                          const isDownloading = downloadingFileId === file.id;

                          return (
                            <div
                              key={file.id}
                              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                                  <FileCode size={18} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {file.fileName}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                    {(Number(file.fileSizeBytes) / (1024 * 1024)).toFixed(1)} MB • {file.mimeType}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadFile(file.id, entitlement?.id, file.fileName)
                                }
                                disabled={isDownloading || entitlement?.isRevoked}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                <Download size={14} className={isDownloading ? 'animate-bounce' : ''} />
                                <span>{isDownloading ? 'Signing...' : 'Download File'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refund Request Modal */}
      {refundingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRequestRefund}
            className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Request Order Refund
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRefundingOrder(null)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Order: <strong className="font-mono text-slate-800 dark:text-slate-200">#{refundingOrder.orderNumber}</strong>
              <br />
              Refunding will restore <strong className="text-emerald-500">{refundingOrder.totalCoins} CPC Coins</strong> to your wallet and revoke your download rights and license key.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for Refund (Minimum 10 characters):
              </label>
              <textarea
                required
                minLength={10}
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Technical incompatibility with current stack, or duplicate accidental order..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRefund || refundReason.length < 10}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmittingRefund ? 'Processing...' : `Confirm Refund (${refundingOrder.totalCoins} Coins)`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
