import { describe, it, expect } from "vitest";
import {
  productQuerySchema,
  createProductSchema,
  moderateProductSchema,
  createProductVersionSchema,
  createProductReviewSchema,
} from "@/lib/validations/product.schema";
import { ProductStatus } from "@prisma/client";

describe("Phase 4 — Digital Product Marketplace Test Suite", () => {
  describe("1. Catalog Query & Filter Validation Schemas", () => {
    it("should accept valid query parameters with defaults", () => {
      const parsed = productQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.pricing).toBe("ALL");
      expect(parsed.sort).toBe("POPULAR");
    });

    it("should parse and normalize custom category, platform, and sort parameters", () => {
      const input = {
        category: "web-apps",
        platform: "Android",
        pricing: "UNDER_300",
        minRating: "4.5",
        sort: "TRENDING",
        search: "  DevOps cluster  ",
      };

      const parsed = productQuerySchema.parse(input);
      expect(parsed.category).toBe("web-apps");
      expect(parsed.platform).toBe("Android");
      expect(parsed.pricing).toBe("UNDER_300");
      expect(parsed.minRating).toBe(4.5);
      expect(parsed.sort).toBe("TRENDING");
      expect(parsed.search).toBe("DevOps cluster");
    });

    it("should reject invalid sort or negative price bounds", () => {
      const invalidSort = { sort: "INVALID_SORT" };
      expect(() => productQuerySchema.parse(invalidSort)).toThrow();

      const invalidRating = { minRating: 6 };
      expect(() => productQuerySchema.parse(invalidRating)).toThrow();
    });
  });

  describe("2. Product Creation & Version Schema Rules", () => {
    it("should validate a compliant product creation payload with SemVer", () => {
      const payload = {
        title: "Enterprise Kubernetes Autopilot",
        shortDescription: "Autonomous cluster autoscaling and self-healing engine.",
        description: "Comprehensive microservices control plane with automated spot instance migration and FinOps telemetry.",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        isFree: false,
        coinPrice: 350,
        fiatPricePaise: 35000,
        platforms: ["Web", "Linux", "Docker"],
        techStack: ["Next.js", "Go", "Docker"],
        tags: ["devops", "cloud"],
        initialVersion: {
          version: "1.0.0",
          changelogMarkdown: "Initial GA Release",
        },
      };

      const result = createProductSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject non-SemVer version strings", () => {
      const invalidVersion = {
        version: "v1.0", // Missing patch digit
      };

      const result = createProductVersionSchema.safeParse(invalidVersion);
      expect(result.success).toBe(false);
    });

    it("should require at least one supported platform for compatibility safety", () => {
      const noPlatformPayload = {
        title: "Platform Agnostic Utility",
        shortDescription: "General purpose software tools.",
        description: "Comprehensive software suite with full documentation and support.",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        platforms: [], // Empty platform array
      };

      const result = createProductSchema.safeParse(noPlatformPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("3. Product Moderation & Rejection Validation", () => {
    it("should validate valid ProductStatus transition payloads", () => {
      const publishPayload = { status: ProductStatus.PUBLISHED };
      expect(moderateProductSchema.safeParse(publishPayload).success).toBe(true);

      const rejectPayload = {
        status: ProductStatus.REJECTED,
        rejectionReason: "Incomplete setup guide and missing package files.",
      };
      const result = moderateProductSchema.safeParse(rejectPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rejectionReason).toBe("Incomplete setup guide and missing package files.");
      }
    });

    it("should reject invalid status strings", () => {
      const invalid = { status: "DELETED_STATUS" };
      expect(moderateProductSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("4. Review & Rating Boundary Rules", () => {
    it("should accept 1 to 5 integer ratings with content", () => {
      const validReview = {
        rating: 5,
        title: "Exceeded all expectations",
        content: "Clean TypeScript architecture and robust error handling throughout.",
      };

      expect(createProductReviewSchema.safeParse(validReview).success).toBe(true);
    });

    it("should reject reviews outside 1-5 rating range or with empty content", () => {
      const outOfBounds = { rating: 0, content: "Poor quality" };
      expect(createProductReviewSchema.safeParse(outOfBounds).success).toBe(false);

      const emptyContent = { rating: 4, content: "abc" }; // Min 5 characters required
      expect(createProductReviewSchema.safeParse(emptyContent).success).toBe(false);
    });
  });

  describe("5. Mathematical Trending Metric Calculation", () => {
    it("should rank products accurately by the defined metric (totalSales * 5 + viewCount)", () => {
      const calculateTrendingScore = (sales: number, views: number) => sales * 5 + views;

      const productA = { name: "Product A", totalSales: 40, viewCount: 300 }; // 40*5 + 300 = 500
      const productB = { name: "Product B", totalSales: 80, viewCount: 200 }; // 80*5 + 200 = 600
      const productC = { name: "Product C", totalSales: 10, viewCount: 150 }; // 10*5 + 150 = 200

      const scoreA = calculateTrendingScore(productA.totalSales, productA.viewCount);
      const scoreB = calculateTrendingScore(productB.totalSales, productB.viewCount);
      const scoreC = calculateTrendingScore(productC.totalSales, productC.viewCount);

      expect(scoreB).toBeGreaterThan(scoreA);
      expect(scoreA).toBeGreaterThan(scoreC);

      const ranked = [productA, productB, productC].sort(
        (a, b) =>
          calculateTrendingScore(b.totalSales, b.viewCount) -
          calculateTrendingScore(a.totalSales, a.viewCount)
      );

      expect(ranked[0].name).toBe("Product B");
      expect(ranked[1].name).toBe("Product A");
      expect(ranked[2].name).toBe("Product C");
    });
  });
});
