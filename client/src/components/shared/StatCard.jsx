import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function StatCard({ icon: Icon, title, value, change, changeLabel, color = 'primary' }) {
  const colorMap = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
  };

  const isPositive = change >= 0;

  return (
    <div className="card flex items-start gap-4">
      <div className={cn('p-3 rounded-xl', colorMap[color])}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-secondary text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-text-primary mt-0.5">{value}</p>
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium', isPositive ? 'text-success' : 'text-danger')}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{isPositive ? '+' : ''}{change}% {changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
