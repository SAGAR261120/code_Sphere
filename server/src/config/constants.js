export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
};

export const PERMISSIONS = {
  super_admin: ['*'],
  admin: [
    'users:read', 'users:write', 'users:ban',
    'products:read', 'products:write', 'products:delete', 'products:approve',
    'tasks:read', 'tasks:write', 'tasks:delete',
    'orders:read', 'deposits:read', 'deposits:approve',
    'analytics:read', 'coupons:write', 'coupons:read',
    'reports:read', 'coins:adjust', 'wallet:adjust',
  ],
  moderator: [
    'products:read', 'products:approve',
    'tasks:read', 'tasks:verify',
    'users:read', 'reports:read',
  ],
  user: [
    'products:read', 'orders:own',
    'tasks:complete', 'wallet:own',
    'profile:own', 'downloads:own',
  ],
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const TASK_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  DRAFT: 'draft',
};

export const SESSION_STATUS = {
  PENDING: 'pending',
  VERIFYING: 'verifying',
  COMPLETED: 'completed',
  FAILED: 'failed',
  FRAUD: 'fraud',
};

export const DEPOSIT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FAILED: 'failed',
};

export const REFERRAL_COIN_REWARD = 50;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_TIME_MINUTES = 30;
export const MAX_DOWNLOAD_COUNT = 10;
export const EMAIL_VERIFY_EXPIRY_HOURS = 24;
export const PASSWORD_RESET_EXPIRY_HOURS = 1;
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
