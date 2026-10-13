import React from 'react';
import { Coins } from 'lucide-react';
import { cn, formatCoins } from '@/lib/utils';

interface CoinBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  animated?: boolean;
}

export function CoinBadge({
  amount,
  size = 'md',
  className,
  showIcon = true,
  animated = false,
}: CoinBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tabular-nums',
        sizeClasses[size],
        animated && 'animate-coin',
        className
      )}
    >
      {showIcon && (
        <Coins
          size={iconSizes[size]}
          className="text-amber-500 shrink-0"
          aria-hidden="true"
        />
      )}
      <span>{formatCoins(amount)} Coins</span>
    </span>
  );
}
