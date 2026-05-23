import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3).max(150).trim(),
  description: z.string().min(20).max(20000),
  shortDescription: z.string().max(300).optional(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  tags: z.array(z.string().trim().toLowerCase()).max(15).optional().default([]),
  techStack: z.array(z.string().trim()).max(20).optional().default([]),
  version: z.string().optional().default('1.0.0'),
  demoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  videoUrl: z.string().url().optional().nullable(),
  pricing: z.object({
    moneyPrice: z.number().min(0).default(0),
    coinPrice: z.number().min(0).int().default(0),
    isFree: z.boolean().optional().default(false),
    hasMixedPricing: z.boolean().optional().default(false),
    discountedMoneyPrice: z.number().min(0).optional().nullable(),
    mixedOptions: z
      .array(z.object({ label: z.string(), moneyAmount: z.number().min(0), coinAmount: z.number().min(0).int() }))
      .optional()
      .default([]),
  }),
  status: z.enum(['draft', 'pending', 'active', 'rejected', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
  setupGuide: z.string().optional(),
  changelog: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productStatusSchema = z.object({
  status: z.enum(['draft', 'pending', 'active', 'rejected', 'archived']),
  rejectionReason: z.string().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'popular', 'price_asc', 'price_desc', 'coins_asc', 'coins_desc']).default('newest'),
  priceType: z.enum(['all', 'money', 'coins', 'mixed', 'free']).default('all'),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  featured: z.coerce.boolean().optional(),
});
