import { z } from 'zod';

export const createDepositIntentSchema = z.object({
  amountFiatPaise: z.number().int().min(10000, 'Minimum deposit is ₹100 (10,000 paise)').max(5000000, 'Maximum single deposit is ₹50,000 (5,000,000 paise)'),
  gateway: z.enum(['RAZORPAY', 'STRIPE', 'SANDBOX']).default('RAZORPAY'),
  idempotencyKey: z.string().uuid('Idempotency key must be a valid RFC 4122 UUID').optional(),
});

export type CreateDepositIntentInput = z.infer<typeof createDepositIntentSchema>;

export const verifyPaymentSchema = z.object({
  gatewayOrderId: z.string().min(5, 'Gateway order ID is required'),
  gatewayPaymentId: z.string().min(5, 'Gateway payment ID is required'),
  gatewaySignature: z.string().optional(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const depositQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).default('ALL'),
  gateway: z.string().optional(),
  search: z.string().max(100).optional(),
});

export type DepositQueryInput = z.infer<typeof depositQuerySchema>;

export const updatePaymentConfigSchema = z.object({
  depositsEnabled: z.boolean(),
  defaultGateway: z.enum(['RAZORPAY', 'STRIPE', 'SANDBOX']),
  minDepositPaise: z.number().int().min(1000).max(1000000),
  maxDepositPaise: z.number().int().min(100000).max(100000000),
  conversionRatePaise: z.number().int().min(10).max(10000),
  razorpayKeyId: z.string().max(100).optional(),
  complianceNotice: z.string().max(500).optional(),
});

export type UpdatePaymentConfigInput = z.infer<typeof updatePaymentConfigSchema>;
