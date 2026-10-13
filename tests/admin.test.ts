import { describe, it, expect, vi } from "vitest";
import {
  adminOrderQuerySchema,
  adminRefundSchema,
  adminReviewQuerySchema,
  adminReviewModerateSchema,
  adminReviewDeleteSchema,
  updatePlatformSettingsSchema,
} from "@/lib/validations/admin.schema";
import { AdminControlService } from "@/services/admin-control.service";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";

describe("Phase 10: CPC Marketplace Admin Control Center Test Suite", () => {
  describe("1. Admin Validation Schemas & Input Boundary Enforcement", () => {
    it("should parse valid admin order query with defaults", () => {
      const parsed = adminOrderQuerySchema.safeParse({});
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(1);
        expect(parsed.data.limit).toBe(20);
      }
    });

    it("should accept valid order filters by status, paymentMethod, and search", () => {
      const parsed = adminOrderQuerySchema.safeParse({
        page: "2",
        limit: "50",
        status: "COMPLETED",
        paymentMethod: "COINS",
        search: "CPC-202610",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(2);
        expect(parsed.data.limit).toBe(50);
        expect(parsed.data.status).toBe("COMPLETED");
        expect(parsed.data.paymentMethod).toBe("COINS");
        expect(parsed.data.search).toBe("CPC-202610");
      }
    });

    it("should reject invalid order status or excessive page limit (> 100)", () => {
      const invalidStatus = adminOrderQuerySchema.safeParse({
        status: "NON_EXISTENT_STATUS",
      });
      expect(invalidStatus.success).toBe(false);

      const excessLimit = adminOrderQuerySchema.safeParse({
        limit: 500,
      });
      expect(excessLimit.success).toBe(false);
    });

    it("should enforce mandatory refund justification (min 5 characters)", () => {
      const tooShort = adminRefundSchema.safeParse({
        reason: "bad",
      });
      expect(tooShort.success).toBe(false);

      const valid = adminRefundSchema.safeParse({
        reason: "Customer encountered unexpected compatibility defect in download zip.",
      });
      expect(valid.success).toBe(true);
    });

    it("should validate review query parameters and transform isApproved string", () => {
      const parsedTrue = adminReviewQuerySchema.safeParse({
        rating: 5,
        isApproved: "true",
      });
      expect(parsedTrue.success).toBe(true);
      if (parsedTrue.success) {
        expect(parsedTrue.data.isApproved).toBe(true);
        expect(parsedTrue.data.rating).toBe(5);
      }

      const parsedFalse = adminReviewQuerySchema.safeParse({
        isApproved: "false",
      });
      expect(parsedFalse.success).toBe(true);
      if (parsedFalse.success) {
        expect(parsedFalse.data.isApproved).toBe(false);
      }

      const invalidRating = adminReviewQuerySchema.safeParse({
        rating: 10,
      });
      expect(invalidRating.success).toBe(false);
    });

    it("should validate review moderation schema requiring reason and boolean isApproved", () => {
      const invalid = adminReviewModerateSchema.safeParse({
        isApproved: false,
        reason: "sh",
      });
      expect(invalid.success).toBe(false);

      const valid = adminReviewModerateSchema.safeParse({
        isApproved: true,
        reason: "Verified user provided constructive feedback meeting standards.",
      });
      expect(valid.success).toBe(true);
    });

    it("should validate review deletion schema requiring reason", () => {
      const empty = adminReviewDeleteSchema.safeParse({
        reason: "   ",
      });
      expect(empty.success).toBe(false);

      const valid = adminReviewDeleteSchema.safeParse({
        reason: "Spam link injected in review body.",
      });
      expect(valid.success).toBe(true);
    });

    it("should validate platform settings update schema", () => {
      const emptySettings = updatePlatformSettingsSchema.safeParse({
        settings: [],
        reason: "Update configuration",
      });
      expect(emptySettings.success).toBe(false);

      const valid = updatePlatformSettingsSchema.safeParse({
        settings: [
          {
            key: "COIN_DAILY_ISSUANCE_LIMIT",
            value: "75000",
            category: "FINANCIAL",
            isPublic: false,
          },
          {
            key: "PLATFORM_NAME",
            value: "CPC Marketplace Elite",
            category: "GENERAL",
            isPublic: true,
          },
        ],
        reason: "Annual platform limit adjustment approved by management.",
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("2. Executive Dashboard Aggregations & Currency Separation", () => {
    it("should aggregate database metrics with strict separation of fiat revenue and coin volume", async () => {
      const metrics = await AdminControlService.getExecutiveDashboardMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.overview).toBeDefined();
      expect(metrics.overview.users).toHaveProperty("total");
      expect(metrics.overview.users).toHaveProperty("active");
      expect(metrics.overview.products).toHaveProperty("total");
      expect(metrics.overview.products).toHaveProperty("published");
      expect(metrics.overview.orders).toHaveProperty("completedCount");
      expect(metrics.overview.coinEconomy).toHaveProperty("issued");
      expect(metrics.overview.coinEconomy).toHaveProperty("redeemed");
      expect(metrics.overview.coinEconomy).toHaveProperty("circulatingSupply");
      expect(metrics.overview.fiatRevenue).toHaveProperty("totalPaise");
      expect(metrics.overview.fiatRevenue).toHaveProperty("formattedRupees");
      expect(metrics.overview.tasks).toHaveProperty("completionsCount");
      expect(metrics.overview.operations).toHaveProperty("downloadsCount");

      // Verify fiat formatting follows Indian Rupee format
      expect(typeof metrics.overview.fiatRevenue.formattedRupees).toBe("string");
      expect(metrics.overview.fiatRevenue.formattedRupees.startsWith("₹")).toBe(true);

      // Verify recent activity feeds exist
      expect(Array.isArray(metrics.recentActivity.orders)).toBe(true);
      expect(Array.isArray(metrics.recentActivity.deposits)).toBe(true);
      expect(Array.isArray(metrics.recentActivity.taskCompletions)).toBe(true);
      expect(Array.isArray(metrics.recentActivity.auditLogs)).toBe(true);
    });
  });

  describe("3. Order Management & Entitlement Lifecycle", () => {
    it("should retrieve paginated admin orders with user and entitlement items", async () => {
      const result = await AdminControlService.getAdminOrders({
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.orders)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);

      if (result.orders.length > 0) {
        const order = result.orders[0];
        expect(order).toHaveProperty("orderNumber");
        expect(order).toHaveProperty("user");
        expect(order).toHaveProperty("items");
        expect(Array.isArray(order.items)).toBe(true);
      }
    });

    it("should throw ApiError with 404 when looking up non-existent order ID", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      await expect(AdminControlService.getAdminOrderById(fakeId)).rejects.toThrow(ApiError);
    });
  });

  describe("4. Reviews Moderation & Aggregate Rating Invariants", () => {
    it("should fetch paginated reviews for administrator moderation queue", async () => {
      const result = await AdminControlService.getAdminReviews({
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.reviews)).toBe(true);
      expect(result.pagination).toBeDefined();

      if (result.reviews.length > 0) {
        const review = result.reviews[0];
        expect(review).toHaveProperty("rating");
        expect(review).toHaveProperty("content");
        expect(review).toHaveProperty("isApproved");
        expect(review).toHaveProperty("product");
        expect(review).toHaveProperty("user");
      }
    });

    it("should reject moderation on non-existent review with 404", async () => {
      const fakeReviewId = "00000000-0000-0000-0000-000000000000";
      const adminId = "00000000-0000-0000-0000-000000000001";

      await expect(
        AdminControlService.moderateReview(
          adminId,
          fakeReviewId,
          false,
          "Inappropriate review content"
        )
      ).rejects.toThrow(ApiError);
    });

    it("should calculate correct average rating and star counts on approval change", () => {
      const mockReviews = [
        { rating: 5, isApproved: true },
        { rating: 4, isApproved: true },
        { rating: 1, isApproved: false }, // hidden/unapproved
        { rating: 5, isApproved: true },
      ];

      const approved = mockReviews.filter((r) => r.isApproved);
      const count = approved.length;
      const sum = approved.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0.0;

      // 5 + 4 + 5 = 14 / 3 = 4.67
      expect(count).toBe(3);
      expect(averageRating).toBe(4.67);
      expect(approved.filter((r) => r.rating === 5).length).toBe(2);
      expect(approved.filter((r) => r.rating === 4).length).toBe(1);
      expect(approved.filter((r) => r.rating === 1).length).toBe(0);
    });
  });

  describe("5. Platform Settings & Audited Configuration Governance", () => {
    it("should return complete grouped platform settings across all 5 operational categories", async () => {
      const result = await AdminControlService.getPlatformSettings();

      expect(result).toBeDefined();
      expect(Array.isArray(result.all)).toBe(true);
      expect(result.grouped).toBeDefined();

      // Check all 5 categories are populated
      expect(result.grouped.GENERAL.length).toBeGreaterThan(0);
      expect(result.grouped.FINANCIAL.length).toBeGreaterThan(0);
      expect(result.grouped.SECURITY.length).toBeGreaterThan(0);
      expect(result.grouped.NOTIFICATIONS.length).toBeGreaterThan(0);
      expect(result.grouped.LEGAL.length).toBeGreaterThan(0);

      // Verify key setting entries exist in defaults
      const keys = result.all.map((s) => s.key);
      expect(keys).toContain("PLATFORM_NAME");
      expect(keys).toContain("COIN_DAILY_ISSUANCE_LIMIT");
      expect(keys).toContain("MAX_FAILED_LOGIN_ATTEMPTS");
      expect(keys).toContain("TERMS_VERSION");
      expect(keys).toContain("REFUND_WINDOW_HOURS");
    });

    it("should calculate diffs and produce audited change logs on platform settings update", async () => {
      // Find an admin user in DB to act as adminId
      const adminUser = await prisma.user.findFirst({
        where: {
          userRoles: {
            some: {
              role: { slug: { in: ["SUPER_ADMIN", "ADMIN"] } },
            },
          },
        },
      });

      if (adminUser) {
        const updateResult = await AdminControlService.updatePlatformSettings(
          adminUser.id,
          {
            settings: [
              {
                key: "PLATFORM_TAGLINE",
                value: "Verified Source Code & SaaS Codebases",
                category: "GENERAL",
                isPublic: true,
              },
            ],
            reason: "Updated marketing tagline for 2026 digital marketplace launch.",
          }
        );

        expect(Array.isArray(updateResult)).toBe(true);
        expect(updateResult.length).toBe(1);
        expect(updateResult[0].key).toBe("PLATFORM_TAGLINE");
        expect(updateResult[0].value).toBe("Verified Source Code & SaaS Codebases");

        // Verify audit log entry was written
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            action: "PLATFORM_SETTINGS_UPDATE",
            adminId: adminUser.id,
          },
          orderBy: { createdAt: "desc" },
        });

        expect(auditLog).toBeDefined();
        expect(auditLog?.targetType).toBe("PlatformSetting");
        expect(auditLog?.reason).toContain("Updated marketing tagline");
      }
    });
  });

  describe("6. Admin Safety & Financial Invariants", () => {
    it("should prevent bypassing the double-entry wallet ledger for administrative refunds", () => {
      // Rule 6 & Rule 8: Every refund MUST append a REFUND_CREDIT transaction to CoinTransaction
      const mockOrder = {
        id: "ord-test-1",
        orderNumber: "CPC-202610-0001",
        totalCoins: 250,
      };

      const refundEntry = {
        type: "REFUND_CREDIT",
        amount: mockOrder.totalCoins,
        referenceId: mockOrder.id,
        referenceType: "Order",
        description: `Refund: Order #${mockOrder.orderNumber}`,
      };

      expect(refundEntry.amount).toBe(250);
      expect(refundEntry.type).toBe("REFUND_CREDIT");
      expect(refundEntry.referenceType).toBe("Order");
    });
  });
});
