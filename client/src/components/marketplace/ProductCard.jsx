import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { PricingBadge } from './PricingBadge.jsx';
import { formatCoins } from '../../lib/utils.js';

export function ProductCard({ product }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
    >
      <div className="relative">
        <img
          src={product.thumbnail || 'https://placehold.co/400x240/1A1D27/6366F1?text=CodeMarket'}
          alt={product.name}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {product.isFeatured && (
            <span className="badge bg-warning/90 text-background text-xs font-semibold">⭐ Featured</span>
          )}
          {product.category && (
            <span className="badge bg-background/80 text-text-secondary border border-border backdrop-blur-sm">
              {product.category.name}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-text-primary truncate mb-1">{product.name}</h3>
        {product.shortDescription && (
          <p className="text-text-secondary text-sm line-clamp-2 mb-3">{product.shortDescription}</p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {product.techStack?.slice(0, 3).map((t) => (
            <span key={t} className="badge bg-surface-2 text-text-muted text-[10px]">{t}</span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <PricingBadge pricing={product.pricing} />
          <div className="flex items-center gap-3 text-text-muted text-xs">
            <span className="flex items-center gap-1"><ShoppingCart size={10} /> {product.totalSales}</span>
            <span className="flex items-center gap-1"><Eye size={10} /> {product.views}</span>
          </div>
        </div>

        <Link
          to={`/marketplace/${product.slug}`}
          className="mt-3 btn-secondary w-full text-center text-sm py-2 block"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}
