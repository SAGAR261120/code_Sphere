import { z } from 'zod';
import { DocumentType } from '@prisma/client';

export const documentTypeSchema = z.enum([
  'OVERVIEW',
  'MANUAL',
  'INSTALLATION_GUIDE',
  'TECHNICAL_SPEC',
  'API_DOC',
  'LICENSE',
  'CHANGELOG',
  'RECEIPT',
]);

export const createDocumentationSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  documentType: documentTypeSchema.default('OVERVIEW'),
  version: z.string().trim().max(30).default('1.0.0'),
  language: z.string().trim().max(30).default('English'),
  isPublic: z.boolean().default(false),
  contentSummary: z.string().trim().max(500).optional(),
  contentMarkdown: z.string().trim().optional(),
});

export type CreateDocumentationInput = z.infer<typeof createDocumentationSchema>;

export const documentationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  documentType: documentTypeSchema.optional(),
  isPublic: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
});

export type DocumentationQueryInput = z.infer<typeof documentationQuerySchema>;
