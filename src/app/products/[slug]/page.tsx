'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { Product } from '@/types';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ProductScreenshotGallery } from '@/components/marketplace/ProductScreenshotGallery';
import { RatingStars } from '@/components/ui/RatingStars';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { useMarketplace } from '@/context/marketplace-context';
import { formatCoins, formatFileSize, formatDate } from '@/lib/utils';
import {
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Download,
  CheckCircle2,
  Lock,
  Layers,
  FileCode,
  Calendar,
  Sparkles,
  BookOpen,
  History,
  Star,
  Coins,
  Cpu,
  Monitor,
  Smartphone,
  Server,
  ArrowRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { ProductReviewsSection } from '@/components/marketplace/ProductReviewsSection';
import { ProductRecommendationsShelf } from '@/components/marketplace/ProductRecommendationsShelf';
import { ProductDocumentationSection } from '@/components/marketplace/ProductDocumentationSection';

function mapDbProductToUiProduct(p: any): Product {
  const thumbnail =
    p.images?.find((img: any) => img.isThumbnail)?.url ||
    p.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80';
  const screenshots = p.images?.map((img: any) => img.url) || [thumbnail];
  const currentVersion = p.versions?.find((v: any) => v.isCurrent) || p.versions?.[0];
  const version = currentVersion?.version || '1.0.0';

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
    reviewCount: p.rating?.reviewCount || p.reviews?.length || 0,
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
    setupGuideMarkdown: currentVersion?.setupGuideMarkdown,
    changelogMarkdown: currentVersion?.changelogMarkdown,
    isFeatured: p.isFeatured,
    tags: p.tags || [],
  };
}

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const {
    coinBalance,
    isProductPurchased,
    openCheckout,
    openDepositModal,
    addToast,
    user,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'overview' | 'tech' | 'setup' | 'docs' | 'reviews' | 'changelog'>('overview');
  const [product, setProduct] = useState<Product | null>(null);
  const [rawProduct, setRawProduct] = useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any | null>(null);

  // Review form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/v1/products/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.product) {
          const p = json.data.product;
          setRawProduct(p);
          const mapped = mapDbProductToUiProduct(p);
          setProduct(mapped);
          setReviewsList(p.reviews || []);

          // Track PRODUCT_VIEW analytics event
          fetch('/api/v1/analytics/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'PRODUCT_VIEW',
              entityId: p.id,
              metadata: { slug: p.slug, category: p.category?.slug },
            }),
          }).catch(() => {});

          if (json.data.relatedProducts && Array.isArray(json.data.relatedProducts)) {
            setRelatedProducts(json.data.relatedProducts.map(mapDbProductToUiProduct));
          }
        } else {
          // Fallback to demo product
          const demo = DEMO_PRODUCTS.find((p) => p.slug === slug) || DEMO_PRODUCTS[0];
          setProduct(demo);
          setRelatedProducts(DEMO_PRODUCTS.filter((p) => p.slug !== demo.slug).slice(0, 3));
        }
      })
      .catch((err) => {
        console.error('Failed to load product detail:', err);
        const demo = DEMO_PRODUCTS.find((p) => p.slug === slug) || DEMO_PRODUCTS[0];
        setProduct(demo);
        setRelatedProducts(DEMO_PRODUCTS.filter((p) => p.slug !== demo.slug).slice(0, 3));
      });

    // Check live purchase eligibility & ownership
    fetch(`/api/v1/products/${slug}/eligibility`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setEligibility(json.data);
      })
      .catch(() => {});
  }, [slug]);

  if (!product) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  const isPurchased = eligibility?.alreadyOwned || isProductPurchased(product.id);
  const isFree = product.pricing.isFree;
  const hasSufficientCoins = isFree || (eligibility ? eligibility.canAfford : coinBalance >= product.pricing.coinPrice);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim()) {
      addToast('Review required', 'Please provide detailed review feedback.', 'warning');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/v1/products/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          content: reviewContent.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        addToast('Review Posted', 'Thank you for your review!', 'success');
        setReviewsList((prev) => [
          {
            id: json.data?.id || Math.random().toString(),
            rating: reviewRating,
            title: reviewTitle,
            content: reviewContent,
            createdAt: new Date().toISOString(),
            isVerifiedPurchase: true,
            user: {
              profile: {
                displayName: user?.name || 'Verified User',
              },
            },
          },
          ...prev,
        ]);
        setReviewTitle('');
        setReviewContent('');
      } else {
        const err = await res.json();
        addToast('Review Notice', err.message || 'Unable to post review. Sign in to review.', 'error');
      }
    } catch {
      addToast('Error', 'Network error submitting review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. Breadcrumb navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto pb-1">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
          Home
        </Link>
        <ChevronRight size={13} />
        <Link href="/explore" className="hover:text-slate-900 dark:hover:text-white transition-colors">
          Explore
        </Link>
        <ChevronRight size={13} />
        <Link
          href={`/explore?category=${product.category}`}
          className="hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {product.categoryName}
        </Link>
        <ChevronRight size={13} />
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
          {product.name}
        </span>
      </nav>

      {/* 2. Product Header */}
      <div className="flex flex-col sm:flex-row items-start gap-5 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-500/10 via-indigo-500/10 to-amber-500/10 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-3xl sm:text-4xl shrink-0 shadow-sm">
          {product.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {product.categoryName}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Version {product.version}
            </span>
            {isPurchased && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={13} />
                Owned & Entitled
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Published by</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {product.publisher.name}
              </span>
              {product.publisher.verified && (
                <span title="Verified Publisher">
                  <ShieldCheck size={14} className="text-sky-500" />
                </span>
              )}
            </div>
            <span>•</span>
            <RatingStars rating={product.ratingAverage} reviewCount={product.reviewCount} size="sm" />
            <span>•</span>
            <span>{product.downloadCount} Total Downloads</span>
          </div>
        </div>
      </div>

      {/* 3. Main Content Grid (Gallery + Details on left, Purchasing Card on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Screenshot Gallery */}
          <ProductScreenshotGallery
            screenshots={product.screenshots}
            productName={product.name}
          />

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 overflow-x-auto pb-px scrollbar-none">
              {[
                { id: 'overview', label: 'Overview & Features', icon: Sparkles },
                { id: 'tech', label: 'Tech Stack & Specs', icon: Layers },
                { id: 'setup', label: 'Setup Guide', icon: BookOpen },
                { id: 'docs', label: 'Documentation & PDFs', icon: FileText },
                { id: 'reviews', label: `Reviews (${reviewsList.length || product.reviewCount})`, icon: Star },
                { id: 'changelog', label: 'Version Changelog', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`inline-flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>

              {/* Stored Features list if available */}
              {rawProduct?.features && rawProduct.features.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Key Features & Technical Highlights
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rawProduct.features.map((feat: any) => (
                      <div
                        key={feat.id || feat.title}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60"
                      >
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-sky-500" />
                          {feat.title}
                        </h4>
                        {feat.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {feat.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Included in This Package
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Complete Unminified Source Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Perpetual Commercial License</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Detailed Setup & Deployment Guides</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Access to Future Version Updates</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Tech Specs & Supported Platforms */}
          {activeTab === 'tech' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Supported Platforms Section */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Monitor size={16} className="text-sky-500" />
                  <span>Officially Supported Platforms</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.platforms.map((plat) => (
                    <span
                      key={plat}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                    >
                      {plat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technology Stack Grid */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Cpu size={16} className="text-indigo-500" />
                  <span>Technology Stack & Frameworks</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Package Format</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      ZIP Archive (.zip) / Tarball
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Archive Size</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatFileSize(product.fileSizeBytes)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Current Release Version</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      v{product.version}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Licensing Terms</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Standard Commercial Digital License
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Setup Guide */}
          {activeTab === 'setup' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                  {product.setupGuideMarkdown || (
                    `### Setup & Installation\n1. Download and extract the repository package.\n2. Install required dependencies with npm install or yarn.\n3. Configure .env environment variables.\n4. Run the local dev server using npm run dev.\n5. Build for production with npm run build.`
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Documentation & Download Center */}
          {activeTab === 'docs' && (
            <ProductDocumentationSection
              slug={product.slug}
              productTitle={product.name}
            />
          )}

          {/* Tab 4: Reviews & Verified Rating Breakdown */}
          {activeTab === 'reviews' && (
            <ProductReviewsSection
              productId={product.id}
              slug={product.slug}
              productTitle={product.name}
            />
          )}

          {/* Tab 5: Changelog */}
          {activeTab === 'changelog' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                  {product.changelogMarkdown || (
                    `### Version ${product.version}\n- Initial production-ready release\n- Full documentation, type definitions, and test coverage\n- Responsive desktop and mobile layouts`
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Purchasing Card */}
        <div>
          <div className="sticky top-24 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            {/* Price display header */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Digital License Price</span>
              <PriceDisplay pricing={product.pricing} size="lg" />
            </div>

            {/* Wallet balance comparison pill */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Your Coin Balance:</span>
              <CoinBadge amount={coinBalance} size="sm" />
            </div>

            {/* CTA action buttons */}
            <div className="space-y-2.5">
              {isPurchased ? (
                <button
                  type="button"
                  onClick={() => router.push('/purchases')}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={16} />
                  <span>Download Package File</span>
                </button>
              ) : hasSufficientCoins ? (
                <button
                  type="button"
                  onClick={() => openCheckout(product)}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <Lock size={16} />
                  <span>{isFree ? 'Acquire Free License' : 'Purchase with CPC Coins'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openDepositModal}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Coins size={16} />
                  <span>Top Up Coins to Acquire</span>
                </button>
              )}

              {product.demoUrl && (
                <a
                  href={product.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Launch Live Interactive Demo</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Refund & License Information per Business Rules */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Buyer Protection & Refund Policy</span>
              </div>
              <p>
                Entitled downloads are accessible indefinitely from your account. In case of verified technical defect, refund requests can be submitted to support.
              </p>
            </div>

            {/* Quick Specs List */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileCode size={13} className="text-slate-400" />
                  Source Code:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Full Access</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  Version:
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">v{product.version}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  Updates:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Perpetual</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Smart Recommendations Shelf */}
      <ProductRecommendationsShelf slug={product.slug} categoryName={product.categoryName} />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
