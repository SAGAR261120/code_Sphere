import { z } from 'zod';

export const checkoutSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  paymentMethod: z.enum(['FREE', 'COINS', 'FIAT', 'MIXED']).default('COINS'),
  licenseType: z.enum(['COMMERCIAL', 'PERSONAL', 'EXTENDED']).default('COMMERCIAL'),
  idempotencyKey: z.string().uuid('Idempotency key must be a valid UUID').optional(),
  acceptedTerms: z.boolean().default(true),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['ALL', 'PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).default('ALL'),
});

export type OrderQueryInput = z.infer<typeof orderQuerySchema>;

export const createSignedUrlSchema = z.object({
  productFileId: z.string().uuid('Product file ID must be a valid UUID'),
  entitlementId: z.string().uuid('Entitlement ID must be a valid UUID').optional(),
});

export type CreateSignedUrlInput = z.infer<typeof createSignedUrlSchema>;

export const refundRequestSchema = z.object({
  reason: z.string().min(10, 'Refund reason must be at least 10 characters long').max(500, 'Reason cannot exceed 500 characters'),
});

export type RefundRequestInput = z.infer<typeof refundRequestSchema>;
