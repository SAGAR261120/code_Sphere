import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'INR') {
  const value = typeof amount === 'number' ? amount / 100 : 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function formatCoins(n) {
  if (!n && n !== 0) return '0';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function formatDate(date, fmt = 'short') {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: fmt === 'short' ? 'medium' : 'long',
    timeStyle: fmt === 'long' ? 'short' : undefined,
  }).format(new Date(date));
}

export function formatFileSize(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(1)} ${units[i]}`;
}

export function truncate(str, len = 100) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}
