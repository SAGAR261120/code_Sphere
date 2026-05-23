import { useCategories } from '../../hooks/useProducts.js';
import { cn } from '../../lib/utils.js';
import { X } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'coins_asc', label: 'Coins: Low to High' },
];

const PRICE_TYPES = [
  { value: 'all', label: 'All Products' },
  { value: 'free', label: '🆓 Free' },
  { value: 'money', label: '💳 Money Only' },
  { value: 'coins', label: '🪙 Coins Only' },
  { value: 'mixed', label: '💎 Mixed Pricing' },
];

export function ProductFilters({ filters, onChange, onClear }) {
  const { data: categories } = useCategories();

  const setFilter = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">Filters</h3>
        <button onClick={onClear} className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
          <X size={12} /> Clear all
        </button>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">Sort By</label>
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => setFilter('sort', e.target.value)}
          className="input text-sm"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Price Type */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">Price Type</label>
        <div className="space-y-1">
          {PRICE_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => setFilter('priceType', pt.value)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                filters.priceType === pt.value
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              )}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories?.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">Category</label>
          <div className="space-y-1">
            <button
              onClick={() => setFilter('category', '')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                !filters.category ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-secondary hover:bg-surface-2'
              )}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setFilter('category', cat._id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  filters.category === cat._id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-secondary hover:bg-surface-2'
                )}
              >
                {cat.name}
                <span className="float-right text-text-muted text-xs">{cat.productCount || ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
