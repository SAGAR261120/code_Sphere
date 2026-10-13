'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, UserPurchase, ToastMessage, Product, DailyTask, LedgerEntry } from '@/types';
import { DEMO_USER_PROFILE, DEMO_PURCHASES, DEMO_LEDGER_ENTRIES, DEMO_PRODUCTS } from '@/lib/demo-data';

interface MarketplaceContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  user: UserProfile | null;
  role: UserRole;
  switchRole: (newRole: UserRole) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;

  coinBalance: number;
  ledgerEntries: LedgerEntry[];
  addCoins: (amount: number, description: string) => void;
  spendCoins: (amount: number, description: string) => boolean;

  purchases: UserPurchase[];
  isProductPurchased: (productId: string) => boolean;
  completePurchase: (product: Product, paymentMethod: 'COINS' | 'FREE' | 'MIXED') => boolean;

  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;

  // Checkout modal
  checkoutProduct: Product | null;
  openCheckout: (product: Product) => void;
  closeCheckout: () => void;

  // Task modal
  activeTask: DailyTask | null;
  openTaskModal: (task: DailyTask) => void;
  closeTaskModal: () => void;

  // Deposit modal
  isDepositModalOpen: boolean;
  openDepositModal: () => void;
  closeDepositModal: () => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [role, setRole] = useState<UserRole>('GUEST');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [activeTask, setActiveTask] = useState<DailyTask | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Sync real session from PostgreSQL via /api/v1/auth/me
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) {
        setUser(null);
        setRole('GUEST');
        setCoinBalance(0);
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        const apiUser = data.data;
        const primaryRole: UserRole =
          apiUser.roles?.includes('SUPER_ADMIN')
            ? 'SUPER_ADMIN'
            : apiUser.roles?.includes('ADMIN')
            ? 'ADMIN'
            : apiUser.roles?.includes('PUBLISHER')
            ? 'PUBLISHER'
            : 'USER';

        setUser({
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.profile?.displayName || apiUser.profile?.username || apiUser.email.split('@')[0],
          username: apiUser.profile?.username || '',
          role: primaryRole,
          avatarUrl: apiUser.profile?.avatarUrl,
          coinBalance: apiUser.wallet?.availableBalance ?? 0,
          totalEarnedCoins: apiUser.wallet?.totalEarned ?? 0,
          totalSpentCoins: apiUser.wallet?.totalSpent ?? 0,
          joinedAt: apiUser.profile?.createdAt || new Date().toISOString(),
          isEmailVerified: true,
        });
        setRole(primaryRole);
        setCoinBalance(apiUser.wallet?.availableBalance ?? 0);
      }
    } catch {
      // Offline or network error
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors
    }
    setUser(null);
    setRole('GUEST');
    setCoinBalance(0);
    addToast('Signed Out', 'You have been logged out successfully.', 'info');
  };

  // Initialize theme from system or storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('cpc_theme') as 'light' | 'dark' | null;
    const initial = savedTheme === 'light' ? 'light' : 'dark';
    setTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('cpc_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'GUEST') {
      setUser(null);
    } else if (user) {
      setUser({
        ...user,
        role: newRole,
      });
    }
    addToast('Role Switched', `Active view updated to ${newRole} mode.`, 'info');
  };

  const addToast = (title: string, description?: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, title, description, type, durationMs: 4000 };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addCoins = (amount: number, description: string) => {
    const newBal = coinBalance + amount;
    setCoinBalance(newBal);
    const newEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      createdAt: new Date().toISOString(),
      type: 'TASK_REWARD',
      amount,
      balanceAfter: newBal,
      description,
      referenceId: `task-${Date.now()}`,
      referenceType: 'TaskAttempt',
    };
    setLedgerEntries((prev) => [newEntry, ...prev]);
    addToast('Coins Credited!', `+${amount} CPC Coins added to your wallet.`, 'success');
  };

  const spendCoins = (amount: number, description: string): boolean => {
    if (coinBalance < amount) {
      addToast('Insufficient Balance', `You need ${amount} CPC Coins but have ${coinBalance}.`, 'error');
      return false;
    }
    const newBal = coinBalance - amount;
    setCoinBalance(newBal);
    const newEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      createdAt: new Date().toISOString(),
      type: 'PURCHASE_DEBIT',
      amount: -amount,
      balanceAfter: newBal,
      description,
      referenceId: `ord-${Date.now()}`,
      referenceType: 'Order',
    };
    setLedgerEntries((prev) => [newEntry, ...prev]);
    return true;
  };

  const isProductPurchased = (productId: string): boolean => {
    return purchases.some((p) => p.productId === productId);
  };

  const completePurchase = (product: Product, paymentMethod: 'COINS' | 'FREE' | 'MIXED'): boolean => {
    if (isProductPurchased(product.id)) {
      addToast('Already Owned', 'You already hold an entitlement for this product.', 'warning');
      return false;
    }

    if (paymentMethod === 'COINS') {
      const success = spendCoins(product.pricing.coinPrice, `Purchased: ${product.name}`);
      if (!success) return false;
    }

    const newPurchase: UserPurchase = {
      id: `pur-${Date.now()}`,
      orderNumber: `CPC-202610-${Math.floor(1000 + Math.random() * 9000)}`,
      productId: product.id,
      product,
      purchasedAt: new Date().toISOString(),
      coinsPaid: paymentMethod === 'COINS' ? product.pricing.coinPrice : 0,
      moneyPaidInr: 0,
      licenseKey: `CPC-LIC-${product.slug.toUpperCase().slice(0, 8)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      version: product.version,
      downloadCount: 0,
      maxDownloads: 10,
    };

    setPurchases((prev) => [newPurchase, ...prev]);
    addToast('Purchase Successful!', `${product.name} has been added to your downloads.`, 'success');
    closeCheckout();
    return true;
  };

  const openCheckout = (product: Product) => setCheckoutProduct(product);
  const closeCheckout = () => setCheckoutProduct(null);

  const openTaskModal = (task: DailyTask) => setActiveTask(task);
  const closeTaskModal = () => setActiveTask(null);

  const openDepositModal = () => setIsDepositModalOpen(true);
  const closeDepositModal = () => setIsDepositModalOpen(false);

  return (
    <MarketplaceContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        role,
        switchRole,
        refreshUser,
        logout,
        coinBalance,
        ledgerEntries,
        addCoins,
        spendCoins,
        purchases,
        isProductPurchased,
        completePurchase,
        toasts,
        addToast,
        removeToast,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        checkoutProduct,
        openCheckout,
        closeCheckout,
        activeTask,
        openTaskModal,
        closeTaskModal,
        isDepositModalOpen,
        openDepositModal,
        closeDepositModal,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
