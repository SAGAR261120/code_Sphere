import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(3).max(150).trim(),
  description: z.string().optional(),
  rewardCoins: z.number().int().min(1),
  shortenedUrl: z.string().url(),
  originalUrl: z.string().url().optional(),
  linkProvider: z.enum(['shrinkme', 'adfly', 'custom', 'ouo', 'shorte']).default('custom'),
  taskType: z.enum(['visit', 'signup', 'watch', 'download', 'social']).default('visit'),
  verificationMethod: z.enum(['timer', 'callback', 'manual', 'api']).default('timer'),
  requiredDuration: z.number().int().min(5).max(3600).default(30),
  maxCompletionsPerUser: z.number().int().min(1).default(1),
  totalCompletionLimit: z.number().int().min(1).nullable().optional(),
  cooldownHours: z.number().min(0).default(24),
  status: z.enum(['active', 'paused', 'draft']).default('active'),
  expiresAt: z.string().datetime().optional().nullable(),
  category: z.string().optional(),
  thumbnail: z.string().url().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();
