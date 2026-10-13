'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, Command, Sparkles } from 'lucide-react';
import { useMarketplace } from '@/context/marketplace-context';

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useMarketplace();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const quickSuggestions = [
    'Next.js 15 Starter Kit',
    'Flutter Realtime Chat',
    'Python Scraper',
    'POS Billing Web App',
    'Radix UI Components',
    'Agency Portfolio',
  ];

  // Shortcut key handling (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement !== inputRef.current)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (term: string) => {
    setSearchQuery(term);
    setIsOpen(false);
    if (pathname !== '/explore') {
      router.push(`/explore?q=${encodeURIComponent(term)}`);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-xl ${className || ''}`}>
      <div className="relative flex items-center">
        <Search
          size={18}
          className="absolute left-3.5 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(searchQuery);
            }
          }}
          placeholder="Search apps, templates, source code..."
          className="w-full h-10 pl-10 pr-20 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-none transition-all"
        />
        <div className="absolute right-2.5 flex items-center gap-1">
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 select-none">
              <Command size={10} /> K
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete & suggestions dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <Sparkles size={12} className="text-sky-500" />
            Popular Searches
          </div>
          <div className="mt-1 space-y-1">
            {quickSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSearch(item)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
              >
                <Search size={13} className="text-slate-400" />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
