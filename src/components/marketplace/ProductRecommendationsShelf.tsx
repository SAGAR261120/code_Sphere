'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Star, Coins } from 'lucide-react';
import { RatingStars } from '@/components/ui/RatingStars';
import { formatCoins } from '@/lib/utils';
import { RecommendedProduct } from '@/services/recommendation.service';

interface ProductRecommendationsShelfProps {
  slug: string;
  categoryName?: string;
}

export function ProductRecommendationsShelf({
  slug,
  categoryName,
}: ProductRecommendationsShelfProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/v1/products/${slug}/recommendations?limit=4`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.recommendations) {
          setRecommendations(json.data.recommendations);
        }
      })
      .catch((err) => console.error('Failed to load recommendations', err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (!loading && recommendations.length === 0) return null;

  return (
    <section className="space-y-5 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500 fill-amber-500/20" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Recommended Digital Solutions & Alternatives
          </h2>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
        >
          <span>Explore Catalog</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))
        ) : (
          recommendations.map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.slug}`}
              className="group flex flex-col justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-200"
            >
              <div className="space-y-3">
                {/* Thumbnail image */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Preview
                    </div>
                  )}
                  {item.matchReason && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-semibold text-sky-300 border border-sky-400/20">
                      {item.matchReason}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.category.name}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-sky-500 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.shortDescription}
                  </p>
                </div>
              </div>

              {/* Price & Rating footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                  <Coins size={14} className="text-amber-500" />
                  <span>{item.isFree ? 'FREE' : `${formatCoins(item.coinPrice)} Coins`}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span>{item.averageRating.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
