import { z } from 'zod';

export const createProviderSchema = z.object({
  name: z.string().min(2, 'Provider name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  baseUrl: z.string().url('Base URL must be a valid HTTP or HTTPS URL'),
  apiKey: z.string().max(255).optional().nullable(),
  webhookSecret: z.string().max(255).optional().nullable(),
  campaignId: z.string().max(100).optional().nullable(),
  permittedDomains: z.array(z.string().min(3)).default([]),
  verificationType: z
    .enum(['SIGNED_POSTBACK', 'API_POLL', 'MANUAL_REVIEW'])
    .default('SIGNED_POSTBACK'),
  config: z.record(z.string(), z.any()).optional().nullable(),
  isEnabled: z.boolean().default(true),
});

export const updateProviderSchema = createProviderSchema.partial();

export const startShortlinkTaskSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
});

export const taskReturnQuerySchema = z.object({
  attemptId: z.string().uuid('Invalid attempt identifier'),
  status: z.string().optional(),
  error: z.string().optional(),
});

export const callbackEventQuerySchema = z.object({
  providerSlug: z.string().optional(),
  verificationResult: z.string().optional(),
  rewardStatus: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type CallbackEventQueryInput = z.infer<typeof callbackEventQuerySchema>;
