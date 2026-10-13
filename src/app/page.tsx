'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEMO_PRODUCTS, DEMO_TASKS } from '@/lib/demo-data';
import { Product } from '@/types';
import { HeroCarousel } from '@/components/marketplace/HeroCarousel';
import { CategoryNavigation } from '@/components/layout/CategoryNavigation';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { useMarketplace } from '@/context/marketplace-context';
import {
  TrendingUp,
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  Star,
  RefreshCw,
  Gift,
  Flame,
  LayoutGrid,
  Layers,
  ChevronRight,
} from 'lucide-react';

function mapDbProductToUiProduct(p: any): Product {
  const thumbnail =
    p.images?.find((img: any) => img.isThumbnail)?.url ||
    p.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80';
  const screenshots = p.images?.map((img: any) => img.url) || [thumbnail];
  const version = p.versions?.[0]?.version || '1.0.0';

  return {
    id: p.id,
    slug: p.slug,
    name: p.title,
    shortDescription: p.shortDescription,
    description: p.description,
    category: p.category?.slug || 'web-apps',
    categoryName: p.category?.name || 'Web Applications',
    icon: '⚡',
    thumbnailUrl: thumbnail,
    screenshots,
    techStack: p.techStack || [],
    platforms: p.platforms || ['Web'],
    version,
    lastUpdated: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    pricing: {
      type: p.isFree ? 'free' : p.hasMixedPricing ? 'mixed' : 'coins',
      coinPrice: p.coinPrice,
      moneyPriceInr: Math.round((p.fiatPricePaise || 0) / 100),
      isFree: p.isFree,
      mixedCoinsPrice: p.mixedCoinsPrice,
      mixedMoneyPriceInr: Math.round((p.mixedFiatPaise || 0) / 100),
    },
    ratingAverage: p.rating?.averageRating || 4.8,
    reviewCount: p.rating?.reviewCount || 0,
    downloadCount: p.downloadCount || 0,
    fileSizeBytes: 45000000,
    publisher: {
      name:
        p.publisher?.profile?.displayName ||
        p.publisher?.email?.split('@')[0] ||
        'AstraNova Studios',
      avatarUrl: p.publisher?.profile?.avatarUrl,
      verified: true,
    },
    demoUrl: p.demoUrl,
    videoUrl: p.videoUrl,
    setupGuideMarkdown: p.versions?.[0]?.setupGuideMarkdown,
    changelogMarkdown: p.versions?.[0]?.changelogMarkdown,
    isFeatured: p.isFeatured,
    tags: p.tags || [],
  };
}

export default function HomePage() {
  const router = useRouter();
  const { openTaskModal } = useMarketplace();

  // State for database shelves
  const [shelves, setShelves] = useState<{
    featured: Product[];
    trending: Product[];
    recent: Product[];
    topRated: Product[];
    free: Product[];
    recentlyUpdated: Product[];
    categories: any[];
  }>({
    featured: DEMO_PRODUCTS.filter((p) => p.isFeatured).slice(0, 3),
    trending: DEMO_PRODUCTS.slice(0, 3),
    recent: DEMO_PRODUCTS.slice(1, 4),
    topRated: DEMO_PRODUCTS.filter((p) => p.ratingAverage >= 4.8).slice(0, 3),
    free: DEMO_PRODUCTS.filter((p) => p.pricing.isFree).slice(0, 3),
    recentlyUpdated: DEMO_PRODUCTS.slice(2, 5),
    categories: [],
  });

  const [isLoadingShelves, setIsLoadingShelves] = useState(true);

  useEffect(() => {
    fetch('/api/v1/products/home')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          const d = json.data;
          setShelves({
            featured: (d.featured || []).map(mapDbProductToUiProduct),
            trending: (d.trending || []).map(mapDbProductToUiProduct),
            recent: (d.recent || []).map(mapDbProductToUiProduct),
            topRated: (d.topRated || []).map(mapDbProductToUiProduct),
            free: (d.free || []).map(mapDbProductToUiProduct),
            recentlyUpdated: (d.recentlyUpdated || []).map(mapDbProductToUiProduct),
            categories: d.categories || [],
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load marketplace shelves from API:', err);
      })
      .finally(() => {
        setIsLoadingShelves(false);
      });
  }, []);

  return (
    <div className="space-y-12">
      {/* 1. Category Pills Bar */}
      <CategoryNavigation />

      {/* 2. Hero Banner Carousel */}
      <HeroCarousel />

      {/* 3. Daily Task Callout Shelf */}
      <div className="rounded-3xl border border-amber-200 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 via-amber-50/60 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Zap size={24} className="fill-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Daily Tasks Available: Earn up to 240 CPC Coins
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold">
                Free Credits
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Complete verified developer challenges, product inspections, and sponsor visits to redeem apps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => openTaskModal(DEMO_TASKS[0])}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
          >
            Claim Daily Check-In (+15)
          </button>
          <Link
            href="/earn"
            className="group flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </div>

      {/* 4. Shelf: Featured Products */}
      {shelves.featured.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Sparkles size={18} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Featured Releases
              </h2>
            </div>
            <Link
              href="/explore?sort=POPULAR"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              <span>View all featured</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {shelves.featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Shelf: Trending Products (Defined Metric: totalSales * 5 + viewCount) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                <Flame size={18} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Trending Right Now
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 ml-8">
              Ranked dynamically by verified purchase volume and active community inspects.
            </p>
          </div>
          <Link
            href="/explore?sort=TRENDING"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>Explore trending</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {shelves.trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Popular Categories Showcase */}
      {shelves.categories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <LayoutGrid size={18} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Popular Categories
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {shelves.categories.slice(0, 12).map((cat) => (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-sky-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-500 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {cat.description || `${cat.productCount} packages`}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="font-mono text-xs">{cat.productCount} apps</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. Shelf: Top-Rated Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Star size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Top Rated by Developers
            </h2>
          </div>
          <Link
            href="/explore?sort=RATING"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>See top rated</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {shelves.topRated.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 8. Shelf: Free Products (Earn & Download Instantly) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Gift size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Free Developer Tools & Kits
            </h2>
          </div>
          <Link
            href="/explore?pricing=FREE"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Browse all free products</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {shelves.free.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 9. Shelf: Recently Added & Recently Updated */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <Clock size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recently Added & Updated
            </h2>
          </div>
          <Link
            href="/explore?sort=NEWEST"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>See all newest</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {shelves.recent.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
