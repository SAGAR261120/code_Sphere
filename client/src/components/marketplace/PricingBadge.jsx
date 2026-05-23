import { cn } from '../../lib/utils.js';
import { formatCurrency, formatCoins } from '../../lib/utils.js';
import { Coins } from 'lucide-react';

export function PricingBadge({ pricing, className }) {
  if (!pricing) return null;

  if (pricing.isFree) {
    return (
      <span className={cn('badge bg-success/10 text-success border border-success/20', className)}>
        Free
      </span>
    );
  }

  if (pricing.hasMixedPricing && pricing.mixedOptions?.length) {
    const opt = pricing.mixedOptions[0];
    return (
      <span className={cn('badge bg-purple-500/10 text-purple-400 border border-purple-500/20', className)}>
        {formatCurrency(opt.moneyAmount)} + <Coins size={10} className="inline" /> {formatCoins(opt.coinAmount)}
      </span>
    );
  }

  if (pricing.coinPrice > 0 && pricing.moneyPrice === 0) {
    return (
      <span className={cn('badge bg-warning/10 text-warning border border-warning/20', className)}>
        <Coins size={10} /> {formatCoins(pricing.coinPrice)} coins
      </span>
    );
  }

  return (
    <span className={cn('badge bg-primary/10 text-primary border border-primary/20', className)}>
      {formatCurrency(pricing.discountedMoneyPrice || pricing.moneyPrice)}
    </span>
  );
}
