'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  Flag,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowUpDown,
  Filter,
  X,
  Send,
  MessageSquare,
} from 'lucide-react';
import { RatingStars } from '@/components/ui/RatingStars';
import { useMarketplace } from '@/context/marketplace-context';
import { formatDate } from '@/lib/utils';

interface ProductReviewsSectionProps {
  productId: string;
  slug: string;
  productTitle: string;
}

export function ProductReviewsSection({
  productId,
  slug,
  productTitle,
}: ProductReviewsSectionProps) {
  const { user, addToast } = useMarketplace();

  const [reviews, setReviews] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any>({
    averageRating: 0,
    reviewCount: 0,
    oneStarCount: 0,
    twoStarCount: 0,
    threeStarCount: 0,
    fourStarCount: 0,
    fiveStarCount: 0,
    percentages: { one: 0, two: 0, three: 0, four: 0, five: 0 },
  });
  const [userEligibility, setUserEligibility] = useState<any>(null);
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report Modal State
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let url = `/api/v1/products/${slug}/reviews?sort=${sort}`;
      if (filterRating) url += `&rating=${filterRating}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setReviews(json.data.reviews || []);
          if (json.data.distribution) {
            setDistribution(json.data.distribution);
          }
          if (json.data.userEligibility) {
            setUserEligibility(json.data.userEligibility);
            // If user already reviewed, populate form with existing values for controlled editing
            if (json.data.userEligibility.existingReview) {
              const r = json.data.userEligibility.existingReview;
              setRating(r.rating);
              setTitle(r.title || '');
              setContent(r.content || '');
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [slug, sort, filterRating, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      addToast('Review required', 'Please provide detailed review feedback.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/products/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        addToast(
          userEligibility?.hasReviewed ? 'Review Updated' : 'Review Published',
          'Your verified purchase review has been recorded.',
          'success'
        );
        fetchReviews();
      } else {
        addToast('Review Error', json.message || 'Unable to submit review.', 'error');
      }
    } catch {
      addToast('Error', 'Failed to communicate with review server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReviewId || !reportReason.trim()) return;

    setIsSubmittingReport(true);
    try {
      const res = await fetch(`/api/v1/reviews/${reportingReviewId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        addToast(
          'Report Submitted',
          'Thank you. Our moderation team has been notified.',
          'success'
        );
        setReportingReviewId(null);
        setReportReason('');
      } else {
        addToast('Notice', json.message || 'Unable to report review.', 'error');
      }
    } catch {
      addToast('Error', 'Failed to submit review report.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* 1. Rating Overview & Star Breakdown Card */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Average Rating Big Score */}
          <div className="md:col-span-4 text-center md:text-left md:border-r border-slate-200 dark:border-slate-800 md:pr-6 space-y-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tabular-nums">
              {distribution.averageRating.toFixed(1)}
            </span>
            <div className="flex justify-center md:justify-start">
              <RatingStars rating={distribution.averageRating} size="md" showCount={false} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Based on {distribution.reviewCount} verified purchaser {distribution.reviewCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution Bars (5 to 1 Stars) */}
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const countKey =
                star === 5
                  ? 'fiveStarCount'
                  : star === 4
                  ? 'fourStarCount'
                  : star === 3
                  ? 'threeStarCount'
                  : star === 2
                  ? 'twoStarCount'
                  : 'oneStarCount';
              const percentKey =
                star === 5 ? 'five' : star === 4 ? 'four' : star === 3 ? 'three' : star === 2 ? 'two' : 'one';

              const count = distribution[countKey] || 0;
              const percent = distribution.percentages?.[percentKey] || 0;
              const isSelected = filterRating === star;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFilterRating(isSelected ? null : star)}
                  className={`w-full flex items-center gap-3 text-xs p-1 rounded-lg transition-colors cursor-pointer group ${
                    isSelected ? 'bg-sky-50 dark:bg-sky-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                  title={`Filter by ${star} stars`}
                >
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{star}</span>
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected ? 'bg-sky-500' : 'bg-amber-400 group-hover:bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="w-16 text-right shrink-0 font-mono text-[11px] text-slate-400">
                    {percent}% ({count})
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {filterRating && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Filtering by <strong>{filterRating} Stars</strong>
            </span>
            <button
              type="button"
              onClick={() => setFilterRating(null)}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* 2. Review Submission Form or Eligibility Notice */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs">
        {!user ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <Lock size={16} className="text-amber-500 shrink-0" />
            <span>
              Please sign in with your account to leave a verified purchaser review for {productTitle}.
            </span>
          </div>
        ) : !userEligibility?.isPurchaser ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
            <ShieldCheck size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold">Verified Purchase Required</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                To guarantee 100% authentic feedback, only verified purchasers who hold an active license can submit product ratings.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {userEligibility.hasReviewed ? 'Update Your Verified Review' : 'Write a Verified Customer Review'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {userEligibility.hasReviewed
                    ? 'You can revise your rating and feedback at any time.'
                    : 'Your review helps fellow developers choose trustworthy solutions.'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={12} />
                <span>Verified Purchaser</span>
              </span>
            </div>

            {/* Star Selector */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-slate-500 font-medium">Your Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      size={20}
                      className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-500 font-mono">
                {rating}.0 / 5.0
              </span>
            </div>

            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Review headline (e.g., Clean architecture and comprehensive documentation)"
                maxLength={120}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your technical experience with code quality, setup speed, and performance..."
                maxLength={1500}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                {content.length}/1500 characters
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Send size={13} />
                <span>{isSubmitting ? 'Saving...' : userEligibility.hasReviewed ? 'Update Review' : 'Submit Review'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Reviews Header Controls: Sorting & Count */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-sky-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Customer Reviews ({reviews.length})
          </h3>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated (5 → 1)</option>
            <option value="lowest">Lowest Rated (1 → 5)</option>
          </select>
        </div>
      </div>

      {/* 4. Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {filterRating ? `No reviews with ${filterRating} stars yet.` : 'No customer reviews yet.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Be the first verified customer to share feedback!
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 space-y-3"
            >
              {/* Review Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                    {rev.userName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {rev.userName}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                          <CheckCircle2 size={10} />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Reviewed on {formatDate(rev.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <RatingStars rating={rev.rating} size="sm" showCount={false} />
                  {/* Flag / Report Button */}
                  {user && user.id !== rev.userId && (
                    <button
                      type="button"
                      onClick={() => setReportingReviewId(rev.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Report inappropriate review"
                    >
                      <Flag size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Review Title & Content */}
              {rev.title && (
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {rev.title}
                </h4>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {rev.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 5. Report Review Modal */}
      {reportingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <Flag size={18} />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Report Review
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setReportingReviewId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please explain why this review violates community standards (e.g. spam, abusive language, irrelevant content, or security concerns).
            </p>

            <form onSubmit={handleReportReview} className="space-y-4">
              <textarea
                rows={4}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Provide a detailed explanation for our moderation team..."
                minLength={5}
                maxLength={500}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportingReviewId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport || reportReason.trim().length < 5}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingReport ? 'Submitting Report...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
