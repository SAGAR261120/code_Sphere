import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  platform: z.string().optional(),
  pricing: z.enum(['ALL', 'FREE', 'UNDER_300', 'OVER_300']).optional().default('ALL'),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z
    .enum(['POPULAR', 'TRENDING', 'RATING', 'NEWEST', 'UPDATED', 'PRICE_LOW', 'PRICE_HIGH'])
    .optional()
    .default('POPULAR'),
  search: z.string().trim().optional(),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const createProductSchema = z.object({
  title: z.string().min(3).max(120).trim(),
  shortDescription: z.string().min(10).max(250).trim(),
  description: z.string().min(20).trim(),
  categoryId: z.string().uuid(),
  isFree: z.boolean().default(false),
  coinPrice: z.number().int().nonnegative().default(0),
  fiatPricePaise: z.number().int().nonnegative().default(0),
  demoUrl: z.string().url().optional().nullable().or(z.literal('')),
  videoUrl: z.string().url().optional().nullable().or(z.literal('')),
  tags: z.array(z.string().trim()).default([]),
  techStack: z.array(z.string().trim()).default([]),
  platforms: z.array(z.string().trim()).min(1, 'At least one supported platform is required'),
  features: z
    .array(
      z.object({
        title: z.string().min(2).max(100),
        description: z.string().max(300).optional(),
        icon: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  initialVersion: z
    .object({
      version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow SemVer (e.g. 1.0.0)'),
      changelogMarkdown: z.string().optional(),
      setupGuideMarkdown: z.string().optional(),
    })
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const moderateProductSchema = z.object({
  status: z.nativeEnum(ProductStatus),
  rejectionReason: z.string().max(500).optional(),
});

export type ModerateProductInput = z.infer<typeof moderateProductSchema>;

export const createProductVersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow SemVer (e.g. 1.0.0)'),
  changelogMarkdown: z.string().optional(),
  setupGuideMarkdown: z.string().optional(),
  isCurrent: z.boolean().default(true),
});

export type CreateProductVersionInput = z.infer<typeof createProductVersionSchema>;

export const createProductReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  content: z.string().min(5).max(1000).trim(),
});

export type CreateProductReviewInput = z.infer<typeof createProductReviewSchema>;
