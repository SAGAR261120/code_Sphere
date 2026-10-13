import { z } from "zod";
import { NotificationType } from "@prisma/client";

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.enum(["newest", "highest", "lowest"]).default("newest"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;

export const submitReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Rating must be at least 1 star").max(5, "Rating cannot exceed 5 stars"),
  title: z.string().trim().max(120, "Title cannot exceed 120 characters").optional(),
  content: z
    .string()
    .trim()
    .min(5, "Review content must be at least 5 characters")
    .max(1500, "Review content cannot exceed 1500 characters"),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

export const reportReviewSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Report justification must be at least 5 characters")
    .max(500, "Report justification cannot exceed 500 characters"),
});

export type ReportReviewInput = z.infer<typeof reportReviewSchema>;

export const recommendationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).default(6),
  category: z.string().optional(),
  query: z.string().optional(),
});

export type RecommendationQueryInput = z.infer<typeof recommendationQuerySchema>;

export const analyticsEventSchema = z.object({
  eventType: z.enum([
    "SEARCH",
    "PRODUCT_VIEW",
    "PURCHASE_INTENT",
    "PURCHASE",
    "DOWNLOAD",
    "TASK_ENGAGE",
  ]),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
