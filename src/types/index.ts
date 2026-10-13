export type UserRole = 'GUEST' | 'USER' | 'MODERATOR' | 'PUBLISHER' | 'ADMIN' | 'SUPER_ADMIN';

export type ProductCategory =
  | 'web-apps'
  | 'android-apps'
  | 'ios-apps'
  | 'website-templates'
  | 'complete-websites'
  | 'saas-apps'
  | 'admin-dashboards'
  | 'source-code'
  | 'developer-tools'
  | 'ui-kits'
  | (string & {});

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName?: string;
  icon?: string;
  productCount: number;
}

export type PricingType = 'free' | 'coins' | 'fiat' | 'mixed';

export interface ProductPricing {
  type: PricingType;
  coinPrice: number;
  moneyPriceInr: number; // In rupees
  isFree: boolean;
  mixedCoinsPrice?: number;
  mixedMoneyPriceInr?: number;
  discountPercentage?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ProductCategory;
  categoryName: string;
  icon: string; // URL or icon key
  thumbnailUrl: string;
  screenshots: string[];
  techStack: string[];
  platforms: ('Web' | 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux')[];
  version: string;
  lastUpdated: string;
  pricing: ProductPricing;
  ratingAverage: number;
  reviewCount: number;
  downloadCount: number;
  fileSizeBytes: number;
  publisher: {
    name: string;
    avatarUrl?: string;
    verified: boolean;
  };
  demoUrl?: string;
  videoUrl?: string;
  setupGuideMarkdown?: string;
  changelogMarkdown?: string;
  isFeatured?: boolean;
  tags: string[];
}

export type TaskType = 'VISIT' | 'SIGNUP' | 'WATCH' | 'SOCIAL' | 'TUTORIAL';
export type TaskVerificationMethod = 'TIMER' | 'CALLBACK' | 'MANUAL';

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  rewardCoins: number;
  taskType: TaskType;
  verificationMethod: TaskVerificationMethod;
  requiredDurationSeconds: number;
  cooldownHours: number;
  completedToday: boolean;
  cooldownRemainingSeconds?: number;
  linkUrl: string;
  icon: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Quick';
}

export type LedgerTransactionType =
  | 'TASK_REWARD'
  | 'PURCHASE_DEBIT'
  | 'DEPOSIT_CREDIT'
  | 'ADMIN_CREDIT'
  | 'ADMIN_DEBIT'
  | 'REFUND_CREDIT'
  | 'PROMO_BONUS';

export interface LedgerEntry {
  id: string;
  createdAt: string;
  type: LedgerTransactionType;
  amount: number; // positive or negative
  balanceAfter: number;
  description: string;
  referenceId: string;
  referenceType: 'Order' | 'TaskAttempt' | 'Deposit' | 'Admin';
}

export interface UserPurchase {
  id: string;
  orderNumber: string;
  productId: string;
  product: Product;
  purchasedAt: string;
  coinsPaid: number;
  moneyPaidInr: number;
  licenseKey: string;
  version: string;
  downloadCount: number;
  maxDownloads: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  coinBalance: number;
  totalEarnedCoins: number;
  totalSpentCoins: number;
  joinedAt: string;
  isEmailVerified: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  durationMs?: number;
}
