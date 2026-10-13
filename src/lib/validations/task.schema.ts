import { z } from 'zod';

export const startTaskSchema = z.object({
  taskId: z.string().uuid('Task ID must be a valid UUID'),
});

export type StartTaskInput = z.infer<typeof startTaskSchema>;

export const verifyTaskSchema = z.object({
  attemptId: z.string().uuid('Attempt ID must be a valid UUID'),
  sessionToken: z.string().min(20, 'Valid session token required'),
  callbackCode: z.string().optional(),
});

export type VerifyTaskInput = z.infer<typeof verifyTaskSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(5, 'Task title must be at least 5 characters').max(150, 'Title cannot exceed 150 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description cannot exceed 500 characters'),
  instructionsMarkdown: z.string().min(20, 'Instructions must be at least 20 characters'),
  rewardCoins: z.coerce.number().int().min(1, 'Reward must be at least 1 CPC Coin').max(10000, 'Reward cannot exceed 10,000 Coins per completion'),
  taskType: z.enum(['VISIT', 'SIGNUP', 'WATCH', 'SOCIAL', 'TUTORIAL']).default('VISIT'),
  verificationMethod: z.enum(['TIMER', 'CALLBACK', 'MANUAL']).default('TIMER'),
  requiredDurationSeconds: z.coerce.number().int().min(5, 'Duration must be at least 5 seconds').max(3600, 'Duration cannot exceed 1 hour').default(30),
  cooldownHours: z.coerce.number().int().min(0, 'Cooldown hours cannot be negative').default(24),
  maxDailyCompletions: z.coerce.number().int().min(1, 'Daily completions limit must be at least 1').max(100).default(1),
  totalBudgetCoins: z.coerce.number().int().min(50, 'Total budget must be at least 50 coins').default(10000),
  targetUrl: z.string().url('Target URL must be a valid URL').optional().or(z.literal('')),
  externalVideoUrl: z.string().url('Video URL must be a valid URL').optional().or(z.literal('')),
  mediaUrl: z.string().url('Image URL must be a valid URL').optional().or(z.literal('')),
  category: z.string().min(2).max(50).default('General'),
  difficulty: z.enum(['Quick', 'Medium', 'Deep Dive', 'Survey', 'Social']).default('Quick'),
  isActive: z.boolean().default(true),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const adminTaskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['ALL', 'ACTIVE', 'PAUSED', 'EXHAUSTED']).default('ALL'),
  category: z.string().optional(),
  search: z.string().optional(),
});

export type AdminTaskQueryInput = z.infer<typeof adminTaskQuerySchema>;
