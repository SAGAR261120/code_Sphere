import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number; // 0 to 5
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function RatingStars({
  rating,
  reviewCount,
  size = 'md',
  showCount = true,
  className,
}: RatingStarsProps) {
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.4 && rating % 1 <= 0.8;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <Star
          key={i}
          size={iconSizes[size]}
          className="text-amber-400 fill-amber-400"
          aria-hidden="true"
        />
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <StarHalf
          key={i}
          size={iconSizes[size]}
          className="text-amber-400 fill-amber-400"
          aria-hidden="true"
        />
      );
    } else {
      stars.push(
        <Star
          key={i}
          size={iconSizes[size]}
          className="text-slate-300 dark:text-slate-700"
          aria-hidden="true"
        />
      );
    }
  }

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}
    >
      <div className="flex items-center gap-0.5">{stars}</div>
      <span
        className={cn(
          'font-semibold tabular-nums text-slate-800 dark:text-slate-200',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        )}
      >
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
