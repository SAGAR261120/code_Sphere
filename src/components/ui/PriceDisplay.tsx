import React from 'react';
import { ProductPricing } from '@/types';
import { CoinBadge } from './CoinBadge';
import { formatCurrencyINR } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  pricing: ProductPricing;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showInrEstimate?: boolean;
}

export function PriceDisplay({
  pricing,
  size = 'md',
  className,
  showInrEstimate = true,
}: PriceDisplayProps) {
  if (pricing.isFree) {
    return (
      <div className={cn('inline-flex items-center gap-1.5', className)}>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold',
            size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-3 py-1' : 'text-sm px-2.5 py-0.5'
          )}
        >
          <Sparkles size={size === 'sm' ? 12 : 14} className="text-emerald-500" />
          Free
        </span>
      </div>
    );
  }

  if (pricing.type === 'mixed' && pricing.mixedCoinsPrice && pricing.mixedMoneyPriceInr) {
    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <CoinBadge amount={pricing.mixedCoinsPrice} size={size} />
          <span className="text-xs text-slate-400 font-medium">+</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {formatCurrencyINR(pricing.mixedMoneyPriceInr)}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Or {pricing.coinPrice} Coins outright
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <CoinBadge amount={pricing.coinPrice} size={size} />
      {showInrEstimate && pricing.moneyPriceInr > 0 && (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
          (≈ {formatCurrencyINR(pricing.moneyPriceInr)})
        </span>
      )}
    </div>
  );
}
