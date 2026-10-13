'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { RatingStars } from '../ui/RatingStars';
import { PriceDisplay } from '../ui/PriceDisplay';
import { useMarketplace } from '@/context/marketplace-context';
import { CheckCircle2, ArrowRight, Layers, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const router = useRouter();
  const { isProductPurchased, openCheckout } = useMarketplace();
  const isPurchased = isProductPurchased(product.id);
  const screenshotCount = product.screenshots?.length || 1;

  return (
    <div
      className={cn(
        'group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-sky-500/50 dark:hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden',
        className
      )}
    >
      {/* 1. Preview Screenshot Image & Overlays */}
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.thumbnailUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Category Pill Tag Overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap max-w-[80%]">
          <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-black/75 backdrop-blur-md text-white border border-white/10 shadow-xs">
            {product.categoryName}
          </span>
          {product.pricing.isFree ? (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500 text-white uppercase tracking-wider shadow-xs">
              Free
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-500/90 text-white uppercase tracking-wider shadow-xs">
              Paid
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500 text-slate-950 uppercase tracking-wider shadow-xs">
              Featured
            </span>
          )}
        </div>

        {/* Top Right: Screenshot indicator & Owned badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {screenshotCount > 1 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 text-white/90 text-[10px] font-medium backdrop-blur-xs border border-white/10">
              <ImageIcon size={11} />
              <span>{screenshotCount}</span>
            </div>
          )}
          {isPurchased && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/90 text-white text-[11px] font-semibold shadow-md backdrop-blur-xs">
              <CheckCircle2 size={13} />
              <span>Owned</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Content Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Icon & Title Header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
            {product.icon}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 line-clamp-1 transition-colors duration-200"
            >
              {product.name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                by {product.publisher.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                v{product.version}
              </span>
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2.5 leading-relaxed">
          {product.shortDescription}
        </p>

        {/* Platform Badges */}
        <div className="flex items-center gap-1 mb-2.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-medium mr-0.5">Platforms:</span>
          {product.platforms.map((plat) => (
            <span
              key={plat}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/60"
            >
              {plat}
            </span>
          ))}
        </div>

        {/* Tech Stack Chips */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.techStack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800"
            >
              {tech}
            </span>
          ))}
          {product.techStack.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400">
              +{product.techStack.length - 3}
            </span>
          )}
        </div>

        {/* Rating and Sales */}
        <div className="flex items-center justify-between mb-4 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <RatingStars rating={product.ratingAverage} reviewCount={product.reviewCount} size="sm" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {product.downloadCount} downloads
          </span>
        </div>

        {/* Bottom Bar: Price & CTA Action */}
        <div className="flex items-center justify-between pt-1">
          <PriceDisplay pricing={product.pricing} size="sm" />

          <div className="flex items-center gap-1.5">
            <Link
              href={`/products/${product.slug}`}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-90 cursor-pointer"
              aria-label={`View details for ${product.name}`}
              title="View Details"
            >
              <ArrowRight size={16} />
            </Link>

            {isPurchased ? (
              <button
                type="button"
                onClick={() => router.push('/purchases')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Download
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openCheckout(product)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all duration-200 shadow-xs active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {product.pricing.isFree ? 'Get Free' : 'Get App'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
