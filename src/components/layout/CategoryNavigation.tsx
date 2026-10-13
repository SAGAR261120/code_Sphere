'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMarketplace } from '@/context/marketplace-context';
import { DEMO_CATEGORIES } from '@/lib/demo-data';
import { CategoryInfo } from '@/types';
import {
  Sparkles,
  Globe,
  Smartphone,
  Rocket,
  Layout,
  Terminal,
  Code,
  Palette,
  Server,
  SlidersHorizontal,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Smartphone,
  Rocket,
  Layout,
  Terminal,
  Code,
  Palette,
  Server,
  SlidersHorizontal,
  FileCode,
  LayoutGrid: Globe,
  Apple: Smartphone,
};

export function CategoryNavigation({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCategory, setSelectedCategory } = useMarketplace();
  const [categories, setCategories] = useState<CategoryInfo[]>(DEMO_CATEGORIES);

  useEffect(() => {
    fetch('/api/v1/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(
            json.data.map((c: any) => ({
              id: c.slug,
              name: c.name,
              slug: c.slug,
              description: c.description || '',
              iconName: c.icon || 'Globe',
              productCount: c.productCount || 0,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleSelect = (slug: string | null) => {
    setSelectedCategory(slug);
    if (typeof window !== 'undefined' && pathname === '/explore') {
      const searchParams = new URLSearchParams(window.location.search);
      if (slug) {
        searchParams.set('category', slug);
      } else {
        searchParams.delete('category');
      }
      searchParams.set('page', '1');
      router.replace(`/explore?${searchParams.toString()}`);
    } else {
      router.push(`/explore${slug ? `?category=${encodeURIComponent(slug)}` : ''}`);
    }
  };

  return (
    <nav
      className={cn('w-full overflow-x-auto py-2 scrollbar-none scroll-smooth', className)}
      aria-label="Category Navigation"
    >
      <div className="flex items-center gap-2 min-w-max pb-1">
        {/* All Products pill */}
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer active:scale-95',
            selectedCategory === null
              ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-600 shadow-sm shadow-sky-500/25 scale-[1.02]'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Sparkles size={14} className={cn('transition-transform duration-200', selectedCategory === null ? 'text-white' : 'text-sky-500')} />
          <span>All Products</span>
        </button>

        {categories.map((cat) => {
          const Icon = iconMap[cat.iconName || ''] || Globe;
          const isSelected = selectedCategory === cat.slug;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(isSelected ? null : cat.slug)}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer active:scale-95',
                isSelected
                  ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-600 shadow-sm shadow-sky-500/25 scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Icon
                size={14}
                className={cn('transition-transform duration-200', isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400')}
              />
              <span>{cat.name}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono transition-colors duration-200',
                  isSelected
                    ? 'bg-white/20 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                )}
              >
                {cat.productCount}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
