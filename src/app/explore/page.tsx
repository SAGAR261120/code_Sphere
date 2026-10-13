'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { Product } from '@/types';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { CategoryNavigation } from '@/components/layout/CategoryNavigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ProductGridSkeleton } from '@/components/ui/LoadingSkeleton';
import { useMarketplace } from '@/context/marketplace-context';
import {
  SlidersHorizontal,
  LayoutGrid,
  Search,
  X,
  Sparkles,
  ArrowUpDown,
  Star,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useMarketplace();

  // Read URL query parameters
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || null;
  const urlPlatform = searchParams.get('platform') || 'ALL';
  const urlPricing = searchParams.get('pricing') || 'ALL';
  const urlMinRating = searchParams.get('minRating') || 'ALL';
  const urlSort = searchParams.get('sort') || 'POPULAR';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  // Local filter states synchronized with URL
  const [platform, setPlatform] = useState<string>(urlPlatform);
  const [pricing, setPricing] = useState<string>(urlPricing);
  const [minRating, setMinRating] = useState<string>(urlMinRating);
  const [sort, setSort] = useState<string>(urlSort);
  const [page, setPage] = useState<number>(urlPage);
  const [localSearch, setLocalSearch] = useState<string>(urlSearch || searchQuery);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const platforms = ['ALL', 'Web', 'Android', 'iOS', 'Linux', 'macOS', 'Windows', 'Docker'];
  const pricingOptions = [
    { label: 'All Pricing', value: 'ALL' },
    { label: 'Free Only', value: 'FREE' },
    { label: 'Under 300 Coins', value: 'UNDER_300' },
    { label: '300+ Coins', value: 'OVER_300' },
  ];
  const ratingOptions = [
    { label: 'Any Rating', value: 'ALL' },
    { label: '4.5+ Stars', value: '4.5' },
    { label: '4.0+ Stars', value: '4.0' },
    { label: '3.0+ Stars', value: '3.0' },
  ];
  const sortOptions = [
    { label: 'Most Popular', value: 'POPULAR' },
    { label: 'Trending', value: 'TRENDING' },
    { label: 'Highest Rated', value: 'RATING' },
    { label: 'Newest Added', value: 'NEWEST' },
    { label: 'Recently Updated', value: 'UPDATED' },
    { label: 'Price: Low to High', value: 'PRICE_LOW' },
    { label: 'Price: High to Low', value: 'PRICE_HIGH' },
  ];

  // Synchronize state when URL changes externally
  useEffect(() => {
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
    if (urlSearch !== localSearch) {
      setLocalSearch(urlSearch);
      setSearchQuery(urlSearch);
    }
    setPlatform(urlPlatform);
    setPricing(urlPricing);
    setMinRating(urlMinRating);
    setSort(urlSort);
    setPage(urlPage);
  }, [searchParams]);

  // Synchronize URL query params
  const updateQueryParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'ALL') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.push(`/explore?${params.toString()}`);
  };

  // Fetch products from database API with query parameters
  useEffect(() => {
    setIsLoading(true);
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', '9');
    if (selectedCategory) query.set('category', selectedCategory);
    if (platform !== 'ALL') query.set('platform', platform);
    if (pricing !== 'ALL') query.set('pricing', pricing);
    if (minRating !== 'ALL') query.set('minRating', minRating);
    if (sort) query.set('sort', sort);
    if (localSearch.trim()) query.set('search', localSearch.trim());

    fetch(`/api/v1/products?${query.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data && Array.isArray(json.data)) {
          const mapped = json.data.map(mapDbProductToUiProduct);
          setProducts(mapped);
          setTotalCount(json.pagination?.total || mapped.length);
          setTotalPages(json.pagination?.totalPages || 1);
        } else {
          // Fallback to client filtered demo data
          let filtered = [...DEMO_PRODUCTS];
          if (localSearch.trim()) {
            const q = localSearch.toLowerCase();
            filtered = filtered.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.shortDescription.toLowerCase().includes(q) ||
                p.tags.some((t) => t.toLowerCase().includes(q))
            );
          }
          if (selectedCategory) {
            filtered = filtered.filter((p) => p.category === selectedCategory);
          }
          if (platform !== 'ALL') {
            filtered = filtered.filter((p) => p.platforms.includes(platform as any));
          }
          if (pricing === 'FREE') filtered = filtered.filter((p) => p.pricing.isFree);
          if (pricing === 'UNDER_300')
            filtered = filtered.filter((p) => !p.pricing.isFree && p.pricing.coinPrice <= 300);
          if (pricing === 'OVER_300')
            filtered = filtered.filter((p) => p.pricing.coinPrice > 300);
          if (minRating !== 'ALL') {
            const min = parseFloat(minRating);
            filtered = filtered.filter((p) => p.ratingAverage >= min);
          }

          setTotalCount(filtered.length);
          setTotalPages(Math.max(1, Math.ceil(filtered.length / 9)));
          setProducts(filtered.slice((page - 1) * 9, page * 9));
        }
      })
      .catch((err) => {
        console.error('Failed to load products from API:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedCategory, platform, pricing, minRating, sort, page, localSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    updateQueryParams({ search: localSearch, page: 1 });
  };

  const handlePlatformChange = (val: string) => {
    setPlatform(val);
    setPage(1);
    updateQueryParams({ platform: val, page: 1 });
  };

  const handlePricingChange = (val: string) => {
    setPricing(val);
    setPage(1);
    updateQueryParams({ pricing: val, page: 1 });
  };

  const handleMinRatingChange = (val: string) => {
    setMinRating(val);
    setPage(1);
    updateQueryParams({ minRating: val, page: 1 });
  };

  const handleSortChange = (val: string) => {
    setSort(val);
    setPage(1);
    updateQueryParams({ sort: val, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateQueryParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetAllFilters = () => {
    setLocalSearch('');
    setSearchQuery('');
    setSelectedCategory(null);
    setPlatform('ALL');
    setPricing('ALL');
    setMinRating('ALL');
    setSort('POPULAR');
    setPage(1);
    router.push('/explore');
  };

  const hasActiveFilters =
    localSearch !== '' ||
    selectedCategory !== null ||
    platform !== 'ALL' ||
    pricing !== 'ALL' ||
    minRating !== 'ALL' ||
    sort !== 'POPULAR';

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Explore Digital Products & Source Code
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Discover verified web applications, mobile codebases, SaaS kits, and developer utilities.
        </p>
      </div>

      {/* Category Navigation Bar */}
      <CategoryNavigation />

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by keywords, tags, or technology stack..."
          className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-100"
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              setSearchQuery('');
              updateQueryParams({ search: '', page: 1 });
            }}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
        >
          Search
        </button>
      </form>

      {/* Filter & Sort Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs">
        {/* Left: Platform & Pricing Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Platform Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs overflow-x-auto max-w-full">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5">Platform:</span>
            {platforms.map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => handlePlatformChange(plat)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                  platform === plat
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {plat}
              </button>
            ))}
          </div>

          {/* Pricing Selector */}
          <select
            value={pricing}
            onChange={(e) => handlePricingChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            {pricingOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Rating Selector */}
          <select
            value={minRating}
            onChange={(e) => handleMinRatingChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            {ratingOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Sort and Reset */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <X size={13} />
              <span>Reset</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={13} className="text-slate-400" />
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-900 dark:text-slate-200">{products.length}</strong> of{' '}
          <strong className="text-slate-900 dark:text-slate-200">{totalCount}</strong> published products
        </span>
        {selectedCategory && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[11px]">
            Category: {selectedCategory}
          </span>
        )}
      </div>

      {/* Products Grid or Empty / Loading State */}
      {isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      ) : (
        <EmptyState
          title="No digital products match your criteria"
          description="Try loosening your category, platform, or price constraints to discover more packages."
          actionText="Clear all filters"
          onAction={resetAllFilters}
        />
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ProductGridSkeleton count={6} />}>
      <ExploreContent />
    </Suspense>
  );
}
