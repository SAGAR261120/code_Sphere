import { z } from 'zod';

export const adminAdjustCoinsSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  amount: z.number().int().refine((val) => val !== 0, 'Adjustment amount cannot be zero'),
  reason: z.string().min(5, 'Reason must be at least 5 characters for auditing').max(250).trim(),
  idempotencyKey: z.string().uuid().optional(),
});

export type AdminAdjustCoinsInput = z.infer<typeof adminAdjustCoinsSchema>;

export const createDepositSchema = z.object({
  amountFiatPaise: z.number().int().min(10000, 'Minimum deposit is ₹100 (10,000 paise)'),
  gateway: z.enum(['RAZORPAY', 'STRIPE']).default('RAZORPAY'),
  idempotencyKey: z.string().uuid('Idempotency key must be a valid UUID'),
});

export type CreateDepositInput = z.infer<typeof createDepositSchema>;

export const walletQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum([
    'TASK_REWARD',
    'PURCHASE_DEBIT',
    'DEPOSIT_CREDIT',
    'ADMIN_CREDIT',
    'ADMIN_DEBIT',
    'REFUND_CREDIT',
    'PROMO_BONUS',
  ]).optional(),
  direction: z.enum(['ALL', 'CREDIT', 'DEBIT']).default('ALL'),
  search: z.string().max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type WalletQueryInput = z.infer<typeof walletQuerySchema>;

export const exportStatementSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum([
    'TASK_REWARD',
    'PURCHASE_DEBIT',
    'DEPOSIT_CREDIT',
    'ADMIN_CREDIT',
    'ADMIN_DEBIT',
    'REFUND_CREDIT',
    'PROMO_BONUS',
  ]).optional(),
});

export type ExportStatementInput = z.infer<typeof exportStatementSchema>;

export const coinConfigSchema = z.object({
  dailyIssuanceLimit: z.number().int().min(100).max(1000000),
  maxWalletBalance: z.number().int().min(1000).max(10000000),
  minDepositPaise: z.number().int().min(1000).max(10000000),
  promoRewardLimit: z.number().int().min(10).max(100000),
  coinExpiryDays: z.number().int().min(0).max(3650),
});

export type CoinConfigInput = z.infer<typeof coinConfigSchema>;

export const repairWalletSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  reason: z.string().min(5, 'Reason must be at least 5 characters for auditing').max(250).trim(),
});

export type RepairWalletInput = z.infer<typeof repairWalletSchema>;

