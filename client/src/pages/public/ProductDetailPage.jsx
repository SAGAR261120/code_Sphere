import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Download, ShoppingCart, Eye, Globe, Tag, Calendar, Package } from 'lucide-react';
import { useProduct } from '../../hooks/useProducts.js';
import { PricingBadge } from '../../components/marketplace/PricingBadge.jsx';
import { CheckoutModal } from '../../components/marketplace/CheckoutModal.jsx';
import { PageLoader } from '../../components/shared/PageLoader.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { formatDate, formatFileSize, formatCoins } from '../../lib/utils.js';

const TABS = ['Overview', 'Screenshots', 'Setup Guide', 'Changelog'];

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useProduct(slug);
  const [tab, setTab] = useState('Overview');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (error || !product) return (
    <div className="text-center py-20">
      <p className="text-text-secondary">Product not found.</p>
      <Link to="/marketplace" className="text-primary hover:underline mt-2 block">Back to Marketplace</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Hero image */}
          <div className="rounded-xl overflow-hidden mb-6">
            <img
              src={product.thumbnail || 'https://placehold.co/800x400/1A1D27/6366F1?text=CodeMarket'}
              alt={product.name}
              className="w-full object-cover max-h-80"
            />
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {product.category && (
                <span className="badge bg-primary/10 text-primary border border-primary/20">{product.category.name}</span>
              )}
              {product.isFeatured && (
                <span className="badge bg-warning/10 text-warning border border-warning/20">⭐ Featured</span>
              )}
              <span className="badge bg-surface-2 text-text-muted">v{product.version}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">{product.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1"><ShoppingCart size={14} /> {product.totalSales} sales</span>
              <span className="flex items-center gap-1"><Eye size={14} /> {product.views} views</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(product.createdAt)}</span>
              {product.fileSize && <span className="flex items-center gap-1"><Package size={14} /> {formatFileSize(product.fileSize)}</span>}
            </div>
          </div>

          {/* Tech stack */}
          {product.techStack?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {product.techStack.map((t) => (
                <span key={t} className="badge bg-surface-2 text-text-secondary border border-border">{t}</span>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0 border-b border-border mb-6">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {tab === 'Overview' && (
              <div className="prose prose-invert max-w-none">
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{product.description}</p>
                {product.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {product.tags.map((tag) => (
                      <Link key={tag} to={`/marketplace?tag=${tag}`} className="badge bg-surface-2 text-text-muted hover:text-primary transition-colors">
                        <Tag size={10} /> {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'Screenshots' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.screenshots?.length ? product.screenshots.map((src, i) => (
                  <img key={i} src={src} alt={`Screenshot ${i + 1}`} className="rounded-lg border border-border w-full object-cover" />
                )) : <p className="text-text-muted">No screenshots available.</p>}
              </div>
            )}

            {tab === 'Setup Guide' && (
              <div className="bg-surface-2 border border-border rounded-xl p-6">
                {product.setupGuide
                  ? <pre className="text-text-secondary text-sm whitespace-pre-wrap font-mono leading-relaxed">{product.setupGuide}</pre>
                  : <p className="text-text-muted">Setup guide available after purchase.</p>
                }
              </div>
            )}

            {tab === 'Changelog' && (
              <div className="text-text-secondary whitespace-pre-wrap text-sm">
                {product.changeLog || 'No changelog available.'}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar — pricing card */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <PricingBadge pricing={product.pricing} className="mb-4 text-sm px-3 py-1" />

            <div className="space-y-2 mb-4 text-sm">
              {product.pricing.moneyPrice > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Money price</span>
                  <span className="text-text-primary font-medium">
                    ₹{((product.pricing.discountedMoneyPrice || product.pricing.moneyPrice) / 100).toFixed(0)}
                  </span>
                </div>
              )}
              {product.pricing.coinPrice > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Coin price</span>
                  <span className="text-warning font-medium">{formatCoins(product.pricing.coinPrice)} 🪙</span>
                </div>
              )}
              {product.pricing.isFree && (
                <p className="text-success font-semibold">This product is completely free!</p>
              )}
            </div>

            {product.demoUrl && (
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary w-full flex items-center justify-center gap-2 mb-3 text-sm"
              >
                <Globe size={15} /> Live Demo <ExternalLink size={12} />
              </a>
            )}

            {isAuthenticated ? (
              <button onClick={() => setCheckoutOpen(true)} className="btn-primary w-full flex items-center justify-center gap-2">
                <ShoppingCart size={16} />
                {product.pricing.isFree ? 'Get for Free' : 'Purchase Now'}
              </button>
            ) : (
              <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 block text-center">
                Sign in to Purchase
              </Link>
            )}

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-text-muted">
              <p>✅ Instant download after purchase</p>
              <p>✅ Full source code included</p>
              <p>✅ Setup guide provided</p>
              <p>✅ Up to 10 downloads</p>
            </div>
          </div>
        </div>
      </div>

      <CheckoutModal product={product} isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
