import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(60, "Name cannot exceed 60 characters").trim(),
  bio: z.string().max(300, "Bio cannot exceed 300 characters").trim().optional().nullable(),
  avatarUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  githubUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
  reason: z.string().min(5, "Audit reason must be at least 5 characters").max(300).trim(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "PUBLISHER", "USER"]),
  reason: z.string().min(5, "Audit reason must be at least 5 characters").max(300).trim(),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "PUBLISHER", "USER"]).optional(),
  sort: z.enum(["NEWEST", "OLDEST", "COINS_HIGH", "COINS_LOW"]).optional().default("NEWEST"),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;

export const accountDeletionSchema = z.object({
  confirmation: z.literal("DELETE_MY_ACCOUNT", {
    message: "Type DELETE_MY_ACCOUNT to confirm deletion request",
  }),
  reason: z.string().max(300).optional(),
});

export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;
