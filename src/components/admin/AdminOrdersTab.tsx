"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  CreditCard,
  Download,
  Key,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Eye,
  RotateCcw,
  FileText,
  User,
  Hash,
} from "lucide-react";
import { formatCoins, formatDate } from "@/lib/utils";

interface AdminOrdersTabProps {
  addToast: (title: string, message: string, type: "success" | "error" | "info" | "warning") => void;
}

export function AdminOrdersTab({ addToast }: AdminOrdersTabProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  // Selected Order Inspection Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Refund Modal State
  const [refundingOrder, setRefundingOrder] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const fetchOrders = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", "15");
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (paymentFilter !== "ALL") params.set("paymentMethod", paymentFilter);

      const res = await fetch(`/api/v1/admin/orders?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch orders");

      setOrders(json.data || []);
      setPagination(json.pagination);
      setPage(pageNum);
    } catch (err: any) {
      addToast("Order Query Error", err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, paymentFilter]);

  const handleInspectOrder = async (orderId: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Could not retrieve order details");
      setSelectedOrder(json.data);
    } catch (err: any) {
      addToast("Failed to Inspect Order", err.message, "error");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingOrder) return;
    if (refundReason.trim().length < 5) {
      addToast("Reason Required", "Please provide a detailed refund justification (min 5 characters).", "warning");
      return;
    }

    setIsSubmittingRefund(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${refundingOrder.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Refund failed");

      addToast("Refund Executed", json.message || "Order refunded and entitlement revoked.", "success");
      setRefundingOrder(null);
      setRefundReason("");
      if (selectedOrder?.id === refundingOrder.id) {
        handleInspectOrder(refundingOrder.id);
      }
      fetchOrders(page);
    } catch (err: any) {
      addToast("Refund Error", err.message, "error");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>Order & Entitlement Lifecycle Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit customer orders, inspect perpetual licenses, track download logs, and issue audited refunds.
          </p>
        </div>

        <button
          onClick={() => fetchOrders(page)}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-500" : ""}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchOrders(1)}
            placeholder="Search by order number (e.g. CPC-202610-...), customer email, or product title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 py-1 pl-1 pr-6"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs w-full sm:w-auto">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 py-1 pl-2 pr-6"
            >
              <option value="ALL">All Methods</option>
              <option value="COINS">Coins Only</option>
              <option value="FIAT">Fiat Only</option>
              <option value="FREE">Free</option>
            </select>
          </div>

          <button
            onClick={() => fetchOrders(1)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors"
          >
            Filter
          </button>
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Order Number</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Item Snapshot</th>
                <th className="py-3.5 px-4">Price Charged</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500 mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const firstItem = ord.items[0];
                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {ord.orderNumber}
                        </span>
                        {firstItem?.entitlement?.licenseKey && (
                          <span className="block font-mono text-[10px] text-slate-400 truncate max-w-[160px]">
                            {firstItem.entitlement.licenseKey}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[180px]">
                          {ord.user?.email}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ord.user?.profile?.displayName || "User"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900 dark:text-slate-100 block truncate max-w-[200px]">
                          {firstItem?.product?.title || "Digital Package"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          v{firstItem?.version?.version || "1.0.0"} • {firstItem?.licenseType || "COMMERCIAL"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {ord.totalCoins > 0 ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {formatCoins(ord.totalCoins)} Coins
                          </span>
                        ) : ord.totalFiatPaise > 0 ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{(ord.totalFiatPaise / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="font-bold text-slate-500">FREE</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : ord.status === "REFUNDED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {formatDate(ord.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspectOrder(ord.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-500 hover:border-sky-500 transition-colors"
                            title="Inspect Order Entitlement & Downloads"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {ord.status === "COMPLETED" && (
                            <button
                              onClick={() => {
                                setRefundingOrder(ord);
                                setRefundReason("");
                              }}
                              className="px-2 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Process Refund & Revoke License"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Refund</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchOrders(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => fetchOrders(page + 1)}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Order Details Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {selectedOrder.orderNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedOrder.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : selectedOrder.status === "REFUNDED"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {formatDate(selectedOrder.createdAt)} • Payment Method: {selectedOrder.paymentMethod}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Customer Information
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedOrder.user?.profile?.displayName || "User"}
                  </span>
                  <span className="text-slate-500 block">{selectedOrder.user?.email}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Current Available Balance</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatCoins(selectedOrder.user?.wallet?.availableBalance || 0)} Coins
                  </span>
                </div>
              </div>
            </div>

            {/* Purchased Items & Entitlements */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Purchased Packages & Digital Entitlements
              </h4>
              {selectedOrder.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.product?.title}
                      </h5>
                      <span className="text-slate-500 text-[11px]">
                        Version {item.version?.version} • {item.licenseType} License
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {item.priceCoins > 0 ? `${formatCoins(item.priceCoins)} Coins` : "FREE"}
                    </div>
                  </div>

                  {item.entitlement && (
                    <div className="p-3 rounded-lg border border-sky-500/20 bg-sky-500/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold text-xs">
                          <Key className="w-3.5 h-3.5" />
                          <span>Perpetual License Key:</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.entitlement.isRevoked
                              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {item.entitlement.isRevoked ? "REVOKED" : "ACTIVE"}
                        </span>
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 p-2 rounded border border-sky-500/20 select-all">
                        {item.entitlement.licenseKey}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>
                          Downloads Used: {item.entitlement.downloadCount} / {item.entitlement.maxDownloads}
                        </span>
                        {item.entitlement.lastDownloadedAt && (
                          <span>Last: {formatDate(item.entitlement.lastDownloadedAt)}</span>
                        )}
                      </div>

                      {/* Download Event Log */}
                      {item.entitlement.downloadEvents?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-sky-500/20">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Download Audit Logs ({item.entitlement.downloadEvents.length})
                          </span>
                          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                            {item.entitlement.downloadEvents.map((evt: any) => (
                              <div
                                key={evt.id}
                                className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-950 p-1.5 rounded"
                              >
                                <span>{evt.file?.fileName || "package.zip"}</span>
                                <span>{formatDate(evt.createdAt)}</span>
                                <span className="font-mono text-slate-400">{evt.clientIp || "IP hidden"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Related Ledger Transactions */}
            {selectedOrder.ledgerTransactions?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Related Ledger Transactions
                </h4>
                <div className="space-y-1.5 text-xs font-mono">
                  {selectedOrder.ledgerTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                          {tx.type} • {tx.description}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(tx.createdAt)}</span>
                      </div>
                      <span
                        className={`font-bold ${
                          tx.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400"
                        }`}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Coins
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              {selectedOrder.status === "COMPLETED" && (
                <button
                  onClick={() => {
                    setRefundingOrder(selectedOrder);
                    setRefundReason("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Execute Full Refund</span>
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Refund Confirmation Modal */}
      {refundingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleProcessRefund}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
              <RotateCcw className="w-5 h-5" />
              <span>Confirm Order Refund & Entitlement Revocation</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              You are about to refund Order <strong className="font-mono">{refundingOrder.orderNumber}</strong>.
              This will restore <strong className="font-mono text-amber-600">{formatCoins(refundingOrder.totalCoins)} CPC Coins</strong> to the customer&apos;s wallet, append a compensating double-entry ledger credit, and revoke all commercial license keys.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mandatory Audit Justification / Reason:
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Explain the reason for issuing this refund (e.g. Defect in zip codebase, accidental duplicate purchase, compliance request)..."
                rows={3}
                required
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-slate-400">Minimum 5 characters required for compliance.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRefund || refundReason.trim().length < 5}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isSubmittingRefund ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Authorize & Process Refund</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
