'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { CoinBadge } from '../ui/CoinBadge';
import { RatingStars } from '../ui/RatingStars';
import { useMarketplace } from '@/context/marketplace-context';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

export function HeroCarousel() {
  const router = useRouter();
  const { openCheckout } = useMarketplace();
  const featured = DEMO_PRODUCTS.filter((p) => p.isFeatured);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featured.length, isPaused]);

  if (featured.length === 0) return null;
  const product = featured[currentSlide];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-all duration-300"
    >
      {/* Background image with smooth cross-fade */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`bg-${product.id}`}
          src={product.thumbnailUrl}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-20 dark:opacity-25 filter blur-xs scale-105 transition-all duration-700 animate-banner-fade"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-950/40" />
      </div>

      {/* Slide content with elegant keyframed entrance */}
      <div
        key={`slide-${product.id}`}
        className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 animate-banner-fade"
      >
        <div className="flex-1 max-w-3xl space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/20 dark:border-sky-500/30 shadow-xs">
              <Sparkles size={13} className="text-sky-500 animate-pulse" />
              Editor&apos;s Featured Release
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {product.categoryName}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {product.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          <div className="flex items-center gap-4 pt-1">
            <RatingStars rating={product.ratingAverage} reviewCount={product.reviewCount} size="sm" />
            <span className="text-xs text-slate-400">|</span>
            <CoinBadge amount={product.pricing.coinPrice} size="md" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => openCheckout(product)}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all duration-200 shadow-md shadow-sky-600/20 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Get This Product
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-white/20 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Explore Details</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Preview Card with smooth hover lift */}
        <div className="hidden md:block w-72 lg:w-80 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md shadow-2xl shrink-0 p-3 hover:scale-[1.02] transition-transform duration-300">
          <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.screenshots[0] || product.thumbnailUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 px-1">
            <span className="font-medium truncate">{product.publisher.name}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white">
              v{product.version}
            </span>
          </div>
        </div>
      </div>

      {/* Carousel navigation controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 mr-2">
          {featured.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === idx
                  ? 'w-7 bg-sky-500 dark:bg-sky-400 shadow-xs shadow-sky-500/50'
                  : 'w-2 bg-slate-300 dark:bg-white/30 hover:bg-slate-400 dark:hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? featured.length - 1 : prev - 1))}
          className="p-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-black/40 dark:hover:bg-black/60 text-slate-700 dark:text-white transition-all duration-200 active:scale-90 cursor-pointer shadow-xs"
          aria-label="Previous slide"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % featured.length)}
          className="p-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-black/40 dark:hover:bg-black/60 text-slate-700 dark:text-white transition-all duration-200 active:scale-90 cursor-pointer shadow-xs"
          aria-label="Next slide"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
