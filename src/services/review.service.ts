import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-response';
import { ReviewQueryInput, SubmitReviewInput, ReportReviewInput } from '@/lib/validations/interaction.schema';

export interface RatingDistribution {
  averageRating: number;
  reviewCount: number;
  oneStarCount: number;
  twoStarCount: number;
  threeStarCount: number;
  fourStarCount: number;
  fiveStarCount: number;
  percentages: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
}

export class ReviewService {
  /**
   * Recalculates ProductRating aggregates from approved reviews in the database.
   * Prevents arbitrary or fabricated averages.
   */
  static async recalculateProductRating(productId: string, tx: any = prisma): Promise<RatingDistribution> {
    const counts = await tx.productReview.groupBy({
      by: ['rating'],
      where: {
        productId,
        isApproved: true,
      },
      _count: {
        _all: true,
      },
    });

    let oneStar = 0;
    let twoStar = 0;
    let threeStar = 0;
    let fourStar = 0;
    let fiveStar = 0;

    for (const item of counts) {
      if (item.rating === 1) oneStar = item._count._all;
      else if (item.rating === 2) twoStar = item._count._all;
      else if (item.rating === 3) threeStar = item._count._all;
      else if (item.rating === 4) fourStar = item._count._all;
      else if (item.rating === 5) fiveStar = item._count._all;
    }

    const reviewCount = oneStar + twoStar + threeStar + fourStar + fiveStar;
    const totalScore = oneStar * 1 + twoStar * 2 + threeStar * 3 + fourStar * 4 + fiveStar * 5;
    const rawAvg = reviewCount > 0 ? totalScore / reviewCount : 0.0;
    const averageRating = Math.round(rawAvg * 10) / 10;

    await tx.productRating.upsert({
      where: { productId },
      create: {
        productId,
        averageRating,
        reviewCount,
        oneStarCount: oneStar,
        twoStarCount: twoStar,
        threeStarCount: threeStar,
        fourStarCount: fourStar,
        fiveStarCount: fiveStar,
      },
      update: {
        averageRating,
        reviewCount,
        oneStarCount: oneStar,
        twoStarCount: twoStar,
        threeStarCount: threeStar,
        fourStarCount: fourStar,
        fiveStarCount: fiveStar,
      },
    });

    const percentages = {
      one: reviewCount > 0 ? Math.round((oneStar / reviewCount) * 100) : 0,
      two: reviewCount > 0 ? Math.round((twoStar / reviewCount) * 100) : 0,
      three: reviewCount > 0 ? Math.round((threeStar / reviewCount) * 100) : 0,
      four: reviewCount > 0 ? Math.round((fourStar / reviewCount) * 100) : 0,
      five: reviewCount > 0 ? Math.round((fiveStar / reviewCount) * 100) : 0,
    };

    return {
      averageRating,
      reviewCount,
      oneStarCount: oneStar,
      twoStarCount: twoStar,
      threeStarCount: threeStar,
      fourStarCount: fourStar,
      fiveStarCount: fiveStar,
      percentages,
    };
  }

  /**
   * Fetch approved reviews for a product with pagination, sorting, and rating filters.
   */
  static async getProductReviews(productId: string, query: ReviewQueryInput) {
    const { page, limit, sort, rating } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      productId,
      isApproved: true,
    };

    if (rating) {
      where.rating = rating;
    }

    let orderBy: any = [{ createdAt: 'desc' }];
    if (sort === 'highest') {
      orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'lowest') {
      orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
    }

    const [reviews, totalMatching, ratingRecord] = await Promise.all([
      prisma.productReview.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: { reports: true },
          },
        },
      }),
      prisma.productReview.count({ where }),
      prisma.productRating.findUnique({
        where: { productId },
      }),
    ]);

    const reviewCount = ratingRecord?.reviewCount || 0;
    const distribution: RatingDistribution = {
      averageRating: ratingRecord?.averageRating || 0.0,
      reviewCount,
      oneStarCount: ratingRecord?.oneStarCount || 0,
      twoStarCount: ratingRecord?.twoStarCount || 0,
      threeStarCount: ratingRecord?.threeStarCount || 0,
      fourStarCount: ratingRecord?.fourStarCount || 0,
      fiveStarCount: ratingRecord?.fiveStarCount || 0,
      percentages: {
        one: reviewCount > 0 ? Math.round(((ratingRecord?.oneStarCount || 0) / reviewCount) * 100) : 0,
        two: reviewCount > 0 ? Math.round(((ratingRecord?.twoStarCount || 0) / reviewCount) * 100) : 0,
        three: reviewCount > 0 ? Math.round(((ratingRecord?.threeStarCount || 0) / reviewCount) * 100) : 0,
        four: reviewCount > 0 ? Math.round(((ratingRecord?.fourStarCount || 0) / reviewCount) * 100) : 0,
        five: reviewCount > 0 ? Math.round(((ratingRecord?.fiveStarCount || 0) / reviewCount) * 100) : 0,
      },
    };

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        userName: r.user.profile?.displayName || r.user.email?.split('@')[0] || 'Verified Customer',
        userAvatar: r.user.profile?.avatarUrl || null,
        rating: r.rating,
        title: r.title,
        content: r.content,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      distribution,
      pagination: {
        page,
        limit,
        total: totalMatching,
        totalPages: Math.ceil(totalMatching / limit) || 1,
      },
    };
  }

  /**
   * Retrieves the current user's existing review for this product if already reviewed.
   */
  static async getUserReviewForProduct(productId: string, userId: string) {
    return prisma.productReview.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  /**
   * Checks if user is eligible to review: must have an active PurchaseEntitlement (not revoked).
   */
  static async checkReviewEligibility(productId: string, userId: string) {
    const entitlement = await prisma.purchaseEntitlement.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    const isPurchaser = !!entitlement && !entitlement.isRevoked;
    const existingReview = await prisma.productReview.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return {
      canReview: isPurchaser,
      isPurchaser,
      hasReviewed: !!existingReview,
      existingReview,
    };
  }

  /**
   * Submits or edits a review.
   * Enforces verified purchase rule (Rule 6 & Phase 11 specs).
   * Atomically recalculates product rating aggregates.
   */
  static async submitOrUpdateReview(productId: string, userId: string, input: SubmitReviewInput) {
    const eligibility = await this.checkReviewEligibility(productId, userId);

    if (!eligibility.isPurchaser) {
      throw new ApiError(
        403,
        'Only verified purchasers of this product can submit a customer review.',
        'VERIFIED_PURCHASE_REQUIRED'
      );
    }

    const { rating, title, content } = input;

    // Use transaction to ensure review upsert and rating recalculation are atomic
    return prisma.$transaction(async (tx) => {
      const review = await tx.productReview.upsert({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        create: {
          productId,
          userId,
          rating,
          title: title || null,
          content,
          isVerifiedPurchase: true,
          isApproved: true,
        },
        update: {
          rating,
          title: title || null,
          content,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      const updatedDistribution = await this.recalculateProductRating(productId, tx);

      return {
        review: {
          ...review,
          userName: review.user.profile?.displayName || review.user.email?.split('@')[0] || 'Verified Customer',
        },
        distribution: updatedDistribution,
      };
    });
  }

  /**
   * Reports an inappropriate review for moderation.
   * Enforces 1 report per user per review.
   */
  static async reportReview(reviewId: string, userId: string, input: ReportReviewInput) {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND');
    }

    if (review.userId === userId) {
      throw new ApiError(400, 'You cannot report your own review', 'CANNOT_REPORT_OWN_REVIEW');
    }

    const existingReport = await prisma.reviewReport.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    if (existingReport) {
      throw new ApiError(400, 'You have already submitted a report for this review', 'ALREADY_REPORTED');
    }

    return prisma.reviewReport.create({
      data: {
        reviewId,
        userId,
        reason: input.reason,
        status: 'PENDING',
      },
    });
  }

  /**
   * Admin: List reported reviews with filtering and pagination.
   */
  static async getAdminReportedReviews(status = 'PENDING', page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.reviewReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          review: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
              user: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.reviewReport.count({ where }),
    ]);

    const formattedReports = reports.map((r) => ({
      ...r,
      user: {
        id: r.user.id,
        email: r.user.email,
        name: r.user.profile?.displayName || r.user.email?.split('@')[0],
      },
      review: r.review
        ? {
            ...r.review,
            user: {
              id: r.review.user.id,
              email: r.review.user.email,
              name: r.review.user.profile?.displayName || r.review.user.email?.split('@')[0],
            },
          }
        : null,
    }));

    return {
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin: Dismiss reports without taking action against the review.
   */
  static async dismissReport(reportId: string) {
    return prisma.reviewReport.update({
      where: { id: reportId },
      data: { status: 'DISMISSED' },
    });
  }

  /**
   * Admin: Moderate review (approve or hide/remove).
   * Resolves associated reports and recalculates ratings.
   */
  static async moderateReview(reviewId: string, isApproved: boolean) {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(404, 'Review not found', 'REVIEW_NOT_FOUND');
    }

    return prisma.$transaction(async (tx) => {
      const updatedReview = await tx.productReview.update({
        where: { id: reviewId },
        data: { isApproved },
      });

      // Mark all pending reports for this review as RESOLVED
      await tx.reviewReport.updateMany({
        where: { reviewId, status: 'PENDING' },
        data: { status: 'RESOLVED' },
      });

      const distribution = await this.recalculateProductRating(review.productId, tx);

      return {
        review: updatedReview,
        distribution,
      };
    });
  }
}
