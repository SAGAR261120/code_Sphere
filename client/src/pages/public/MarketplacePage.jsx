import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts.js';
import { ProductCard } from '../../components/marketplace/ProductCard.jsx';
import { ProductFilters } from '../../components/marketplace/ProductFilters.jsx';
import { CardSkeleton, PageLoader } from '../../components/shared/PageLoader.jsx';
import { EmptyState } from '../../components/shared/EmptyState.jsx';

export default function MarketplacePage() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = {
    page: parseInt(params.get('page') || '1'),
    sort: params.get('sort') || 'newest',
    category: params.get('category') || '',
    priceType: params.get('priceType') || 'all',
    search: params.get('q') || '',
  };

  const setFilter = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.set('page', '1');
      return next;
    });
  };

  const clearFilters = () => setParams({});

  const { data, isLoading } = useProducts(filters);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Marketplace</h1>
        <p className="text-text-secondary mt-1">Browse premium source code projects</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={filters.search}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Search products, tech stacks, categories..."
            className="input pl-9"
          />
          {filters.search && (
            <button onClick={() => setFilter('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="btn-secondary flex items-center gap-2 lg:hidden"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="card sticky top-24">
            <ProductFilters
              filters={filters}
              onChange={(f) => {
                const next = new URLSearchParams();
                Object.entries(f).forEach(([k, v]) => { if (v) next.set(k, v); });
                setParams(next);
              }}
              onClear={clearFilters}
            />
          </div>
        </aside>

        {/* Mobile filters panel */}
        {filtersOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
            <div className="relative w-72 bg-surface border-r border-border p-4 overflow-y-auto">
              <ProductFilters
                filters={filters}
                onChange={(f) => {
                  const next = new URLSearchParams();
                  Object.entries(f).forEach(([k, v]) => { if (v) next.set(k, v); });
                  setParams(next);
                  setFiltersOpen(false);
                }}
                onClear={() => { clearFilters(); setFiltersOpen(false); }}
              />
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {data && (
            <p className="text-text-muted text-sm mb-4">
              {data.pagination.total} product{data.pagination.total !== 1 ? 's' : ''} found
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array(9).fill(0).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !data?.products?.length ? (
            <EmptyState
              icon={Search}
              title="No products found"
              description="Try adjusting your filters or search terms."
              action={<button onClick={clearFilters} className="btn-secondary">Clear filters</button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>

              {/* Pagination */}
              {data.pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilter('page', p.toString())}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        filters.page === p
                          ? 'bg-primary text-white'
                          : 'bg-surface border border-border text-text-secondary hover:border-primary'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
