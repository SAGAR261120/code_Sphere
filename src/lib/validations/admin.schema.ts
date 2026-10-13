import { z } from "zod";
import { OrderStatus, PaymentMethod } from "@prisma/client";

export const adminOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.nativeEnum(OrderStatus).or(z.literal("ALL")).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).or(z.literal("ALL")).optional(),
  productId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export type AdminOrderQueryInput = z.infer<typeof adminOrderQuerySchema>;

export const adminRefundSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Refund justification must be at least 5 characters")
    .max(500, "Refund justification cannot exceed 500 characters"),
});

export type AdminRefundInput = z.infer<typeof adminRefundSchema>;

export const adminReviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isApproved: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    })
    .optional(),
  productId: z.string().uuid().optional(),
});

export type AdminReviewQueryInput = {
  page?: number;
  limit?: number;
  search?: string;
  rating?: number;
  isApproved?: boolean;
  productId?: string;
};

export const adminReviewModerateSchema = z.object({
  isApproved: z.boolean(),
  reason: z
    .string()
    .trim()
    .min(5, "Moderation reason must be at least 5 characters")
    .max(500, "Moderation reason cannot exceed 500 characters"),
});

export type AdminReviewModerateInput = z.infer<typeof adminReviewModerateSchema>;

export const adminReviewDeleteSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Deletion justification must be at least 5 characters")
    .max(500, "Deletion justification cannot exceed 500 characters"),
});

export type AdminReviewDeleteInput = z.infer<typeof adminReviewDeleteSchema>;

export const platformSettingItemSchema = z.object({
  key: z.string().trim().min(2).max(100),
  value: z.string().trim(),
  description: z.string().trim().optional(),
  category: z.string().trim().default("GENERAL"),
  isPublic: z.boolean().default(false),
});

export const updatePlatformSettingsSchema = z.object({
  settings: z.array(platformSettingItemSchema).min(1, "At least one setting must be provided"),
  reason: z
    .string()
    .trim()
    .min(5, "Configuration modification reason must be at least 5 characters")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;
