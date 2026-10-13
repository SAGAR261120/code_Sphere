import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { OrderService } from "@/services/order.service";
import {
  AdminOrderQueryInput,
  AdminReviewQueryInput,
  UpdatePlatformSettingsInput,
} from "@/lib/validations/admin.schema";
import { Prisma, OrderStatus, PaymentMethod } from "@prisma/client";

// Default platform configuration fallbacks
const DEFAULT_PLATFORM_SETTINGS: Array<{
  key: string;
  value: string;
  description: string;
  category: "GENERAL" | "FINANCIAL" | "SECURITY" | "NOTIFICATIONS" | "LEGAL";
  isPublic: boolean;
}> = [
  // GENERAL
  {
    key: "PLATFORM_NAME",
    value: "Code Sphere",
    description: "Official marketplace brand title displayed across headers and metadata",
    category: "GENERAL",
    isPublic: true,
  },
  {
    key: "PLATFORM_TAGLINE",
    value: "Verified Source Code, Software & Digital Solutions",
    description: "Hero subheading for marketing and search engines",
    category: "GENERAL",
    isPublic: true,
  },
  {
    key: "SUPPORT_EMAIL",
    value: "support@cpcmarket.internal",
    description: "Primary support email address for user queries and receipts",
    category: "GENERAL",
    isPublic: true,
  },
  {
    key: "DEFAULT_CURRENCY",
    value: "INR",
    description: "Base fiat currency code",
    category: "GENERAL",
    isPublic: true,
  },
  // FINANCIAL
  {
    key: "COIN_CONVERSION_RATE_INR_PAISE",
    value: "100",
    description: "Fiat paise per 1 CPC Coin (100 paise = ₹1.00 per coin)",
    category: "FINANCIAL",
    isPublic: true,
  },
  {
    key: "COIN_DAILY_ISSUANCE_LIMIT",
    value: "50000",
    description: "Maximum allowable reward coins issued per calendar day across platform",
    category: "FINANCIAL",
    isPublic: false,
  },
  {
    key: "COIN_MAX_WALLET_BALANCE",
    value: "100000",
    description: "Maximum wallet coin holding threshold per standard user account",
    category: "FINANCIAL",
    isPublic: false,
  },
  {
    key: "MIN_DEPOSIT_PAISE",
    value: "10000",
    description: "Minimum fiat deposit threshold in paise (₹100.00)",
    category: "FINANCIAL",
    isPublic: true,
  },
  {
    key: "MAX_DEPOSIT_PAISE",
    value: "5000000",
    description: "Maximum fiat deposit ceiling in paise (₹50,000.00)",
    category: "FINANCIAL",
    isPublic: true,
  },
  {
    key: "COIN_EXPIRY_DAYS",
    value: "0",
    description: "Coin expiry window in days (0 indicates non-expiring balance)",
    category: "FINANCIAL",
    isPublic: false,
  },
  // SECURITY
  {
    key: "MAX_FAILED_LOGIN_ATTEMPTS",
    value: "5",
    description: "Failed password attempts before account enters temporary lockout",
    category: "SECURITY",
    isPublic: false,
  },
  {
    key: "ACCOUNT_LOCKOUT_MINUTES",
    value: "30",
    description: "Lockout duration in minutes for brute-force protection",
    category: "SECURITY",
    isPublic: false,
  },
  {
    key: "DOWNLOAD_TOKEN_EXPIRY_MINUTES",
    value: "15",
    description: "Presigned download URL validity duration for entitled files",
    category: "SECURITY",
    isPublic: false,
  },
  // NOTIFICATIONS
  {
    key: "NOTIFY_ON_ORDER_PURCHASE",
    value: "true",
    description: "Dispatch instant in-app notification when an acquisition completes",
    category: "NOTIFICATIONS",
    isPublic: false,
  },
  {
    key: "NOTIFY_ON_REWARD_CLAIM",
    value: "true",
    description: "Dispatch notification when task reward is verified and credited",
    category: "NOTIFICATIONS",
    isPublic: false,
  },
  {
    key: "ALERT_ON_FAILED_CALLBACKS",
    value: "true",
    description: "Generate security alert when suspicious short-link postbacks are detected",
    category: "NOTIFICATIONS",
    isPublic: false,
  },
  // LEGAL
  {
    key: "TERMS_VERSION",
    value: "v2026.1",
    description: "Current platform master terms and condition version",
    category: "LEGAL",
    isPublic: true,
  },
  {
    key: "REFUND_WINDOW_HOURS",
    value: "48",
    description: "Standard customer refund eligibility window following acquisition",
    category: "LEGAL",
    isPublic: true,
  },
  {
    key: "COMPLIANCE_NOTICE",
    value: "CPC Marketplace complies with applicable digital goods regulations and RBI payment guidelines.",
    description: "Mandatory compliance disclaimer shown on checkout and receipts",
    category: "LEGAL",
    isPublic: true,
  },
];

export class AdminControlService {
  /**
   * Aggregates real database-backed metrics for the executive dashboard.
   * Strictly separates CPC Coin volume from fiat INR revenue.
   */
  static async getExecutiveDashboardMetrics() {
    const now = new Date();

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      lockedUsers,
      totalProducts,
      publishedProducts,
      pendingProducts,
      completedOrdersCount,
      refundedOrdersCount,
      orderCoinsAggregate,
      fiatDepositAggregate,
      pendingDepositsCount,
      failedDepositsCount,
      coinsIssuedAggregate,
      coinsRedeemedAggregate,
      walletSupplyAggregate,
      taskCompletionsCount,
      rewardCostsAggregate,
      pendingTaskAttemptsCount,
      downloadActivityCount,
      failedCallbackEventsCount,
      recentOrders,
      recentDeposits,
      recentTaskCompletions,
      recentAuditLogs,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: { in: ["SUSPENDED", "BANNED"] } } }),
      prisma.user.count({ where: { lockedUntil: { gt: now } } }),

      // Products
      prisma.product.count(),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.product.count({ where: { status: "PENDING_REVIEW" } }),

      // Orders
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      prisma.order.count({ where: { status: OrderStatus.REFUNDED } }),
      prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { totalCoins: true, totalFiatPaise: true },
      }),

      // Fiat Deposits
      prisma.deposit.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amountFiatPaise: true, coinsToCredit: true },
      }),
      prisma.deposit.count({ where: { status: "PENDING" } }),
      prisma.deposit.count({ where: { status: "FAILED" } }),

      // Coin Transactions
      prisma.coinTransaction.aggregate({
        where: {
          type: { in: ["TASK_REWARD", "DEPOSIT_CREDIT", "ADMIN_CREDIT", "PROMO_BONUS"] },
        },
        _sum: { amount: true },
      }),
      prisma.coinTransaction.aggregate({
        where: {
          type: { in: ["PURCHASE_DEBIT", "ADMIN_DEBIT"] },
        },
        _sum: { amount: true },
      }),
      prisma.coinWallet.aggregate({
        _sum: { availableBalance: true, lockedBalance: true },
      }),

      // Tasks & Rewards
      prisma.taskCompletion.count(),
      prisma.taskCompletion.aggregate({
        _sum: { rewardCoins: true },
      }),
      prisma.taskAttempt.count({ where: { status: "PENDING_VERIFICATION" } }),

      // Downloads
      prisma.downloadEvent.count(),

      // Shortlink / Security Failures
      prisma.taskCallbackEvent.count({
        where: {
          verificationResult: {
            in: ["REJECTED", "INVALID_SIGNATURE", "EXPIRED", "DUPLICATE", "UNSUPPORTED"],
          },
        },
      }),

      // Recent Activity Feeds
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { email: true, profile: { select: { displayName: true } } },
          },
          items: {
            include: { product: { select: { title: true, slug: true } } },
            take: 1,
          },
        },
      }),

      prisma.deposit.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { email: true, profile: { select: { displayName: true } } },
          },
        },
      }),

      prisma.taskCompletion.findMany({
        take: 5,
        orderBy: { completedAt: "desc" },
        include: {
          user: {
            select: { email: true, profile: { select: { displayName: true } } },
          },
          task: {
            select: { title: true, slug: true },
          },
        },
      }),

      prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: { email: true, profile: { select: { displayName: true } } },
          },
        },
      }),
    ]);

    // Financial calculations
    const totalDepositsFiatPaise = fiatDepositAggregate._sum.amountFiatPaise || 0;
    const totalOrderFiatPaise = orderCoinsAggregate._sum.totalFiatPaise || 0;
    const totalRevenueFiatPaise = totalDepositsFiatPaise + totalOrderFiatPaise;
    const totalRevenueFiatRupees = (totalRevenueFiatPaise / 100).toFixed(2);

    const coinsIssued = coinsIssuedAggregate._sum.amount || 0;
    const coinsRedeemed = Math.abs(coinsRedeemedAggregate._sum.amount || 0);
    const circulatingCoinSupply = walletSupplyAggregate._sum.availableBalance || 0;
    const totalRewardCostCoins = rewardCostsAggregate._sum.rewardCoins || 0;

    return {
      overview: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          locked: lockedUsers,
        },
        products: {
          total: totalProducts,
          published: publishedProducts,
          pendingReview: pendingProducts,
        },
        orders: {
          completedCount: completedOrdersCount,
          refundedCount: refundedOrdersCount,
          coinsSpent: orderCoinsAggregate._sum.totalCoins || 0,
        },
        fiatRevenue: {
          totalPaise: totalRevenueFiatPaise,
          formattedRupees: `₹${Number(totalRevenueFiatRupees).toLocaleString("en-IN")}`,
          completedDepositsPaise: totalDepositsFiatPaise,
          pendingDepositsCount,
          failedDepositsCount,
        },
        coinEconomy: {
          issued: coinsIssued,
          redeemed: coinsRedeemed,
          circulatingSupply: circulatingCoinSupply,
          rewardCostsCoins: totalRewardCostCoins,
        },
        tasks: {
          completionsCount: taskCompletionsCount,
          pendingVerificationCount: pendingTaskAttemptsCount,
          rewardCoinsIssued: totalRewardCostCoins,
        },
        operations: {
          downloadsCount: downloadActivityCount,
          failedPaymentsCount: failedDepositsCount,
          failedCallbackEventsCount,
        },
      },
      recentActivity: {
        orders: recentOrders,
        deposits: recentDeposits,
        taskCompletions: recentTaskCompletions,
        auditLogs: recentAuditLogs,
      },
    };
  }

  /**
   * Search, filter, and paginate platform orders with entitlement and download history.
   */
  static async getAdminOrders(query: AdminOrderQueryInput) {
    const { page, limit, search, status, paymentMethod, productId, userId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status && status !== "ALL" && { status: status as OrderStatus }),
      ...(paymentMethod && paymentMethod !== "ALL" && { paymentMethod: paymentMethod as PaymentMethod }),
      ...(userId && { userId }),
      ...(productId && {
        items: {
          some: { productId },
        },
      }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          {
            items: {
              some: {
                product: { title: { contains: search, mode: "insensitive" } },
              },
            },
          },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              profile: {
                select: {
                  username: true,
                  displayName: true,
                },
              },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  coinPrice: true,
                  isFree: true,
                },
              },
              version: {
                select: {
                  id: true,
                  version: true,
                },
              },
              entitlement: {
                select: {
                  id: true,
                  licenseKey: true,
                  downloadCount: true,
                  maxDownloads: true,
                  isRevoked: true,
                  revocationReason: true,
                  lastDownloadedAt: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves complete order details including download logs and related ledger entries.
   */
  static async getAdminOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            wallet: {
              select: {
                availableBalance: true,
              },
            },
          },
        },
        items: {
          include: {
            product: {
              include: {
                images: { where: { isThumbnail: true }, take: 1 },
                publisher: {
                  select: {
                    id: true,
                    email: true,
                    profile: { select: { displayName: true } },
                  },
                },
              },
            },
            version: {
              include: {
                files: true,
              },
            },
            entitlement: {
              include: {
                downloadEvents: {
                  orderBy: { createdAt: "desc" },
                  take: 20,
                  include: {
                    file: {
                      select: {
                        fileName: true,
                        fileSizeBytes: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    // Also look up related ledger transactions for this order
    const ledgerTransactions = await prisma.coinTransaction.findMany({
      where: {
        referenceId: order.id,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      ...order,
      ledgerTransactions,
    };
  }

  /**
   * Processes administrative refund: restocks coins, revokes entitlement, and writes audit record.
   */
  static async processAdminRefund(adminId: string, orderId: string, reason: string) {
    return OrderService.requestOrProcessRefund(adminId, orderId, reason, true);
  }

  /**
   * Search, filter, and paginate product reviews for moderation.
   */
  static async getAdminReviews(query: AdminReviewQueryInput) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const { search, rating, isApproved, productId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductReviewWhereInput = {
      ...(rating && { rating }),
      ...(typeof isApproved === "boolean" && { isApproved }),
      ...(productId && { productId }),
      ...(search && {
        OR: [
          { content: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { product: { title: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: { select: { name: true } },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.productReview.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approves or hides/rejects a product review with automatic rating aggregate re-computation.
   */
  static async moderateReview(
    adminId: string,
    reviewId: string,
    isApproved: boolean,
    reason: string
  ) {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
      include: { product: true },
    });

    if (!review) {
      throw new ApiError(404, "Review not found", "REVIEW_NOT_FOUND");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Update review approval flag
      const updatedReview = await tx.productReview.update({
        where: { id: reviewId },
        data: { isApproved },
      });

      // 2. Recalculate aggregates for product
      const approvedReviews = await tx.productReview.findMany({
        where: {
          productId: review.productId,
          isApproved: true,
        },
      });

      const count = approvedReviews.length;
      const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0.0;

      await tx.productRating.upsert({
        where: { productId: review.productId },
        update: {
          averageRating,
          reviewCount: count,
          oneStarCount: approvedReviews.filter((r) => r.rating === 1).length,
          twoStarCount: approvedReviews.filter((r) => r.rating === 2).length,
          threeStarCount: approvedReviews.filter((r) => r.rating === 3).length,
          fourStarCount: approvedReviews.filter((r) => r.rating === 4).length,
          fiveStarCount: approvedReviews.filter((r) => r.rating === 5).length,
        },
        create: {
          productId: review.productId,
          averageRating,
          reviewCount: count,
          oneStarCount: approvedReviews.filter((r) => r.rating === 1).length,
          twoStarCount: approvedReviews.filter((r) => r.rating === 2).length,
          threeStarCount: approvedReviews.filter((r) => r.rating === 3).length,
          fourStarCount: approvedReviews.filter((r) => r.rating === 4).length,
          fiveStarCount: approvedReviews.filter((r) => r.rating === 5).length,
        },
      });

      // 3. Resolve all pending reports for this review
      await tx.reviewReport.updateMany({
        where: { reviewId, status: "PENDING" },
        data: { status: "RESOLVED" },
      });

      // 4. Write Audit Log
      await tx.auditLog.create({
        data: {
          adminId,
          action: isApproved ? "REVIEW_APPROVED" : "REVIEW_HIDDEN",
          targetType: "ProductReview",
          targetId: reviewId,
          reason,
          metadata: {
            productId: review.productId,
            previousApprovedState: review.isApproved,
            newApprovedState: isApproved,
            rating: review.rating,
          },
        },
      });

      return updatedReview;
    });
  }

  /**
   * Deletes an abusive review and recalculates the product's rating.
   */
  static async deleteReview(adminId: string, reviewId: string, reason: string) {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(404, "Review not found", "REVIEW_NOT_FOUND");
    }

    return await prisma.$transaction(async (tx) => {
      await tx.productReview.delete({
        where: { id: reviewId },
      });

      // Recalculate aggregates
      const approvedReviews = await tx.productReview.findMany({
        where: {
          productId: review.productId,
          isApproved: true,
        },
      });

      const count = approvedReviews.length;
      const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0.0;

      await tx.productRating.upsert({
        where: { productId: review.productId },
        update: {
          averageRating,
          reviewCount: count,
          oneStarCount: approvedReviews.filter((r) => r.rating === 1).length,
          twoStarCount: approvedReviews.filter((r) => r.rating === 2).length,
          threeStarCount: approvedReviews.filter((r) => r.rating === 3).length,
          fourStarCount: approvedReviews.filter((r) => r.rating === 4).length,
          fiveStarCount: approvedReviews.filter((r) => r.rating === 5).length,
        },
        create: {
          productId: review.productId,
          averageRating,
          reviewCount: count,
          oneStarCount: approvedReviews.filter((r) => r.rating === 1).length,
          twoStarCount: approvedReviews.filter((r) => r.rating === 2).length,
          threeStarCount: approvedReviews.filter((r) => r.rating === 3).length,
          fourStarCount: approvedReviews.filter((r) => r.rating === 4).length,
          fiveStarCount: approvedReviews.filter((r) => r.rating === 5).length,
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          adminId,
          action: "REVIEW_DELETED",
          targetType: "ProductReview",
          targetId: reviewId,
          reason,
          metadata: {
            productId: review.productId,
            rating: review.rating,
            contentSnippet: review.content.slice(0, 100),
          },
        },
      });

      return { success: true, deletedReviewId: reviewId };
    });
  }

  /**
   * Retrieves all platform settings categorized, falling back to defaults if unseeded.
   */
  static async getPlatformSettings() {
    const existing = await prisma.platformSetting.findMany({
      orderBy: { key: "asc" },
    });

    const existingMap = new Map(existing.map((s) => [s.key, s]));

    // Merge defaults
    const merged = DEFAULT_PLATFORM_SETTINGS.map((def) => {
      const dbRecord = existingMap.get(def.key);
      if (dbRecord) {
        return {
          id: dbRecord.id,
          key: dbRecord.key,
          value: dbRecord.value,
          description: dbRecord.description || def.description,
          category: dbRecord.category || def.category,
          isPublic: dbRecord.isPublic,
          updatedAt: dbRecord.updatedAt,
        };
      }
      return {
        id: `default-${def.key}`,
        key: def.key,
        value: def.value,
        description: def.description,
        category: def.category,
        isPublic: def.isPublic,
        updatedAt: new Date(),
      };
    });

    // Add any custom settings present in DB but not in defaults
    for (const record of existing) {
      if (!DEFAULT_PLATFORM_SETTINGS.some((d) => d.key === record.key)) {
        merged.push({
          id: record.id,
          key: record.key,
          value: record.value,
          description: record.description || "",
          category: (record.category as any) || "GENERAL",
          isPublic: record.isPublic,
          updatedAt: record.updatedAt,
        });
      }
    }

    // Group by category
    const grouped: Record<string, typeof merged> = {
      GENERAL: [],
      FINANCIAL: [],
      SECURITY: [],
      NOTIFICATIONS: [],
      LEGAL: [],
    };

    for (const item of merged) {
      const cat = grouped[item.category] ? item.category : "GENERAL";
      grouped[cat].push(item);
    }

    return {
      all: merged,
      grouped,
    };
  }

  /**
   * Updates platform settings with full audit trail and change diff.
   */
  static async updatePlatformSettings(
    adminId: string,
    input: UpdatePlatformSettingsInput
  ) {
    const { settings, reason } = input;

    return await prisma.$transaction(async (tx) => {
      const beforeRecords = await tx.platformSetting.findMany({
        where: {
          key: { in: settings.map((s) => s.key) },
        },
      });

      const beforeMap = new Map(beforeRecords.map((r) => [r.key, r.value]));
      const diffs: Record<string, { before: string | null; after: string }> = {};

      const upserted = [];
      for (const item of settings) {
        const beforeValue = beforeMap.get(item.key) ?? null;
        diffs[item.key] = { before: beforeValue, after: item.value };

        const updated = await tx.platformSetting.upsert({
          where: { key: item.key },
          update: {
            value: item.value,
            description: item.description,
            category: item.category,
            isPublic: item.isPublic,
          },
          create: {
            key: item.key,
            value: item.value,
            description: item.description,
            category: item.category,
            isPublic: item.isPublic,
          },
        });
        upserted.push(updated);
      }

      await tx.auditLog.create({
        data: {
          adminId,
          action: "PLATFORM_SETTINGS_UPDATE",
          targetType: "PlatformSetting",
          targetId: "GLOBAL",
          reason,
          metadata: {
            changesCount: settings.length,
            diffs,
          },
        },
      });

      return upserted;
    });
  }
}
