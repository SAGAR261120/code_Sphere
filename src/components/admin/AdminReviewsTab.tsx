"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  ThumbsUp,
  Flag,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AdminReviewsTabProps {
  addToast: (title: string, message: string, type: "success" | "error" | "info" | "warning") => void;
}

export function AdminReviewsTab({ addToast }: AdminReviewsTabProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [approvedFilter, setApprovedFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"ALL" | "REPORTS">("ALL");
  const [reports, setReports] = useState<any[]>([]);

  // Moderation Modal State
  const [moderatingReview, setModeratingReview] = useState<any | null>(null);
  const [targetApprovedState, setTargetApprovedState] = useState<boolean>(true);
  const [moderationReason, setModerationReason] = useState("");
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false);

  // Deletion Modal State
  const [deletingReview, setDeletingReview] = useState<any | null>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);

  const fetchReviews = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      if (viewMode === "REPORTS") {
        const res = await fetch(`/api/v1/admin/reviews/reports?page=${pageNum}&limit=15`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to load reported reviews");
        setReports(json.data || []);
        setPagination(json.pagination);
        setPage(pageNum);
      } else {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", "15");
        if (search) params.set("search", search);
        if (ratingFilter !== "ALL") params.set("rating", ratingFilter);
        if (approvedFilter === "APPROVED") params.set("isApproved", "true");
        if (approvedFilter === "HIDDEN") params.set("isApproved", "false");

        const res = await fetch(`/api/v1/admin/reviews?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to load reviews");

        setReviews(json.data || []);
        setPagination(json.pagination);
        setPage(pageNum);
      }
    } catch (err: any) {
      addToast("Reviews Query Error", err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [ratingFilter, approvedFilter, viewMode]);

  const handleDismissReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/reviews/reports/${reportId}/dismiss`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to dismiss report");
      addToast("Report Dismissed", "The flag has been marked as dismissed.", "success");
      fetchReviews(page);
    } catch (err: any) {
      addToast("Error", err.message, "error");
    }
  };

  const handleModerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingReview) return;
    if (moderationReason.trim().length < 5) {
      addToast("Reason Required", "Please provide a reason with at least 5 characters.", "warning");
      return;
    }

    setIsSubmittingModeration(true);
    try {
      const res = await fetch(`/api/v1/admin/reviews/${moderatingReview.id}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isApproved: targetApprovedState,
          reason: moderationReason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update review status");

      addToast("Status Updated", json.message || "Review status updated and rating recalculated.", "success");
      setModeratingReview(null);
      setModerationReason("");
      fetchReviews(page);
    } catch (err: any) {
      addToast("Moderation Failed", err.message, "error");
    } finally {
      setIsSubmittingModeration(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingReview) return;
    if (deletionReason.trim().length < 5) {
      addToast("Reason Required", "Please provide a deletion reason with at least 5 characters.", "warning");
      return;
    }

    setIsSubmittingDeletion(true);
    try {
      const res = await fetch(`/api/v1/admin/reviews/${deletingReview.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deletionReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to delete review");

      addToast("Review Deleted", "Abusive review deleted and ratings updated.", "success");
      setDeletingReview(null);
      setDeletionReason("");
      fetchReviews(page);
    } catch (err: any) {
      addToast("Deletion Failed", err.message, "error");
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <span>Product Reviews & Content Moderation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit customer feedback, investigate reported ratings, hide abusive remarks, and maintain marketplace credibility.
          </p>
        </div>

        <button
          onClick={() => fetchReviews(page)}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-500" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 2. Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => {
            setViewMode("ALL");
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            viewMode === "ALL"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Catalog Reviews
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMode("REPORTS");
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            viewMode === "REPORTS"
              ? "bg-rose-500 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Reported Reviews Queue</span>
        </button>
      </div>

      {viewMode === "ALL" ? (
        <>
          {/* Search & Filters Bar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchReviews(1)}
                placeholder="Search by review text, product name, or reviewer email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 py-1 pl-2 pr-6"
                >
                  <option value="ALL">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <select
                  value={approvedFilter}
                  onChange={(e) => setApprovedFilter(e.target.value)}
                  className="bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 py-1 pl-2 pr-6"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="HIDDEN">Hidden / Flagged</option>
                </select>
              </div>

              <button
                onClick={() => fetchReviews(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Reviews List Grid */}
          {isLoading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
              Loading moderation queue...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
              No reviews found matching current filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3.5 relative flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Product & Approval Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {rev.product?.category?.name || "Software Package"}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {rev.product?.title}
                    </h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      rev.isApproved
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {rev.isApproved ? "Approved" : "Hidden"}
                  </span>
                </div>

                {/* Stars & Verified Badge */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  {rev.isVerifiedPurchase && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>

                {/* Title & Body */}
                {rev.title && (
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    &ldquo;{rev.title}&rdquo;
                  </h5>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {rev.content}
                </p>
              </div>

              {/* Footer: User, Date & Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                    {rev.user?.profile?.displayName || "Reviewer"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {rev.user?.email} • {formatDate(rev.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setModeratingReview(rev);
                      setTargetApprovedState(!rev.isApproved);
                      setModerationReason("");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      rev.isApproved
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {rev.isApproved ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setDeletingReview(rev);
                      setDeletionReason("");
                    }}
                    className="p-1 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                    title="Delete abusive review permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  ) : (
    /* Reported Reviews Queue View */
    isLoading ? (
      <div className="py-20 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-2" />
        Loading reported reviews queue...
      </div>
    ) : reports.length === 0 ? (
      <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
        <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
        No pending review reports. Marketplace content is compliant!
      </div>
    ) : (
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Flag className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Flagged for: &ldquo;{report.reason}&rdquo;
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Reported by {report.user?.name || "User"} ({report.user?.email}) • {formatDate(report.createdAt)}
                  </span>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  report.status === "PENDING"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : report.status === "RESOLVED"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-500/10 text-slate-500"
                }`}
              >
                {report.status}
              </span>
            </div>

            {/* Target Review Snippet */}
            {report.review && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {report.review.product?.title}
                  </span>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s: number) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= report.review.rating ? "fill-amber-400" : "text-slate-300 dark:text-slate-700"}`}
                      />
                    ))}
                  </div>
                </div>
                {report.review.title && (
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {report.review.title}
                  </p>
                )}
                <p className="text-slate-600 dark:text-slate-400 italic">
                  &ldquo;{report.review.content}&rdquo;
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Author: {report.review.user?.name} ({report.review.user?.email})
                </div>
              </div>
            )}

            {/* Report Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {report.status === "PENDING" && (
                <button
                  type="button"
                  onClick={() => handleDismissReport(report.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Dismiss Flag
                </button>
              )}
              {report.review && (
                <button
                  type="button"
                  onClick={() => {
                    setModeratingReview(report.review);
                    setTargetApprovedState(false);
                    setModerationReason(`Flagged: ${report.reason}`);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                >
                  Hide Abusive Review
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  )}

      {/* Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total reviews)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchReviews(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => fetchReviews(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 4. Moderation Modal */}
      {moderatingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleModerate}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-base">
              {targetApprovedState ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <EyeOff className="w-5 h-5 text-amber-500" />
              )}
              <span>
                {targetApprovedState ? "Approve Review Publication" : "Hide Review from Catalog"}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              You are changing the visibility of this {moderatingReview.rating}-star review for{" "}
              <strong>{moderatingReview.product?.title}</strong>. Product rating metrics will be automatically recalculated.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Audited Reason for Action:
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Explain why this review is being approved or hidden (e.g. Verified genuine review, inappropriate offensive remarks)..."
                rows={3}
                required
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-400">Minimum 5 characters required for audit logging.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModeratingReview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingModeration || moderationReason.trim().length < 5}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isSubmittingModeration ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Save Decision</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Deletion Modal */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleDelete}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <span>Delete Abusive Review</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Permanently purge this review from the database. Aggregate rating calculations will be adjusted immediately.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mandatory Reason for Deletion:
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="State the violation (e.g. Severe harassment, illegal content, spam bot)..."
                rows={3}
                required
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-slate-400">Minimum 5 characters required for compliance.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingDeletion || deletionReason.trim().length < 5}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isSubmittingDeletion ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Permanently Remove</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
