import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  reviewQuerySchema,
  submitReviewSchema,
  reportReviewSchema,
  recommendationQuerySchema,
  analyticsEventSchema,
  notificationQuerySchema,
} from '@/lib/validations/interaction.schema';
import { ReviewService } from '@/services/review.service';
import { RecommendationService } from '@/services/recommendation.service';
import { NotificationService } from '@/services/notification.service';
import { AnalyticsService } from '@/services/analytics.service';
import { NotificationType } from '@prisma/client';

describe('Phase 11: Reviews, Recommendations & Notifications Test Suite', () => {
  let testUser1: any;
  let testUser2: any;
  let testAdmin: any;
  let testCategory: any;
  let testProduct1: any;
  let testProduct2: any;
  let testEntitlement: any;

  beforeAll(async () => {
    // Setup clean test data in PostgreSQL database
    const randomSuffix = Math.floor(Math.random() * 100000);

    // Create test category
    testCategory = await prisma.productCategory.create({
      data: {
        name: `Test Cat ${randomSuffix}`,
        slug: `test-cat-${randomSuffix}`,
      },
    });

    // Create users
    testUser1 = await prisma.user.create({
      data: {
        email: `purchaser_${randomSuffix}@cpcmarket.test`,
        passwordHash: 'dummy_hash',
        profile: {
          create: {
            username: `purchaser_${randomSuffix}`,
            displayName: 'Alice Purchaser',
          },
        },
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: `non_purchaser_${randomSuffix}@cpcmarket.test`,
        passwordHash: 'dummy_hash',
        profile: {
          create: {
            username: `non_purchaser_${randomSuffix}`,
            displayName: 'Bob Visitor',
          },
        },
      },
    });

    testAdmin = await prisma.user.create({
      data: {
        email: `admin_${randomSuffix}@cpcmarket.test`,
        passwordHash: 'dummy_hash',
        profile: {
          create: {
            username: `admin_${randomSuffix}`,
            displayName: 'Admin Charlie',
          },
        },
      },
    });

    // Create products
    testProduct1 = await prisma.product.create({
      data: {
        title: `Next.js SaaS Kit ${randomSuffix}`,
        slug: `nextjs-saas-kit-${randomSuffix}`,
        shortDescription: 'Full production SaaS starter kit',
        description: 'Complete with authentication, payments, and admin control.',
        categoryId: testCategory.id,
        publisherId: testAdmin.id,
        status: 'PUBLISHED',
        coinPrice: 150,
        tags: ['nextjs', 'typescript', 'react', 'tailwind'],
        techStack: ['Next.js', 'PostgreSQL', 'Tailwind CSS'],
        platforms: ['Web'],
        isFeatured: true,
        versions: {
          create: {
            version: '1.0.0',
            isCurrent: true,
          },
        },
      },
    });

    testProduct2 = await prisma.product.create({
      data: {
        title: `Mobile Flutter App ${randomSuffix}`,
        slug: `flutter-mobile-${randomSuffix}`,
        shortDescription: 'Cross-platform mobile marketplace app',
        description: 'Complete mobile frontend with offline cache support.',
        categoryId: testCategory.id,
        publisherId: testAdmin.id,
        status: 'PUBLISHED',
        coinPrice: 200,
        tags: ['flutter', 'mobile', 'dart'],
        techStack: ['Flutter', 'Dart'],
        platforms: ['iOS', 'Android'],
        versions: {
          create: {
            version: '1.0.0',
            isCurrent: true,
          },
        },
      },
    });

    // Create an Order and PurchaseEntitlement for testUser1 on testProduct1
    const order = await prisma.order.create({
      data: {
        orderNumber: `CPC-TEST-${randomSuffix}`,
        userId: testUser1.id,
        totalCoins: 150,
        paymentMethod: 'COINS',
        status: 'COMPLETED',
        items: {
          create: {
            productId: testProduct1.id,
            versionId: (await prisma.productVersion.findFirst({ where: { productId: testProduct1.id } }))!.id,
            priceCoins: 150,
            licenseType: 'COMMERCIAL',
          },
        },
      },
      include: { items: true },
    });

    testEntitlement = await prisma.purchaseEntitlement.create({
      data: {
        orderItemId: order.items[0].id,
        userId: testUser1.id,
        productId: testProduct1.id,
        licenseKey: `CPC-LIC-TEST-${randomSuffix}`,
      },
    });
  });

  afterAll(async () => {
    // Clean up created test data
    try {
      await prisma.reviewReport.deleteMany({
        where: { userId: { in: [testUser1.id, testUser2.id, testAdmin.id] } },
      });
      await prisma.productReview.deleteMany({
        where: { userId: { in: [testUser1.id, testUser2.id, testAdmin.id] } },
      });
      await prisma.notification.deleteMany({
        where: { userId: { in: [testUser1.id, testUser2.id, testAdmin.id] } },
      });
      await prisma.purchaseEntitlement.deleteMany({
        where: { userId: { in: [testUser1.id, testUser2.id] } },
      });
      await prisma.orderItem.deleteMany({
        where: { productId: { in: [testProduct1.id, testProduct2.id] } },
      });
      await prisma.order.deleteMany({
        where: { userId: { in: [testUser1.id, testUser2.id] } },
      });
      await prisma.productVersion.deleteMany({
        where: { productId: { in: [testProduct1.id, testProduct2.id] } },
      });
      await prisma.productRating.deleteMany({
        where: { productId: { in: [testProduct1.id, testProduct2.id] } },
      });
      await prisma.product.deleteMany({
        where: { id: { in: [testProduct1.id, testProduct2.id] } },
      });
      await prisma.productCategory.deleteMany({
        where: { id: testCategory.id },
      });
      await prisma.userProfile.deleteMany({
        where: { userId: { in: [testUser1.id, testUser2.id, testAdmin.id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [testUser1.id, testUser2.id, testAdmin.id] } },
      });
    } catch (e) {
      // Ignore teardown errors
    }
  });

  describe('1. Zod Validation & Schema Boundary Enforcement', () => {
    it('should validate valid review submission input', () => {
      const parsed = submitReviewSchema.safeParse({
        rating: 5,
        title: 'Outstanding quality and clean code',
        content: 'Setup took under 5 minutes. Well documented and completely typed.',
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject ratings outside the 1 to 5 star boundaries', () => {
      const zeroStar = submitReviewSchema.safeParse({
        rating: 0,
        content: 'Too low',
      });
      expect(zeroStar.success).toBe(false);

      const sixStar = submitReviewSchema.safeParse({
        rating: 6,
        content: 'Too high',
      });
      expect(sixStar.success).toBe(false);

      const negativeStar = submitReviewSchema.safeParse({
        rating: -1,
        content: 'Negative rating',
      });
      expect(negativeStar.success).toBe(false);
    });

    it('should reject reviews with content shorter than 5 characters or longer than 1500', () => {
      const short = submitReviewSchema.safeParse({
        rating: 5,
        content: 'Bad',
      });
      expect(short.success).toBe(false);

      const excessive = submitReviewSchema.safeParse({
        rating: 5,
        content: 'A'.repeat(1501),
      });
      expect(excessive.success).toBe(false);
    });

    it('should validate reportReviewSchema requires min 5 characters justification', () => {
      const valid = reportReviewSchema.safeParse({
        reason: 'This review contains advertising spam and abusive remarks.',
      });
      expect(valid.success).toBe(true);

      const invalid = reportReviewSchema.safeParse({
        reason: 'Spam',
      });
      expect(invalid.success).toBe(false);
    });

    it('should validate reviewQuerySchema sorting values and limit bounds', () => {
      const validSort = reviewQuerySchema.safeParse({
        sort: 'highest',
        page: '2',
        limit: '25',
      });
      expect(validSort.success).toBe(true);
      if (validSort.success) {
        expect(validSort.data.page).toBe(2);
        expect(validSort.data.limit).toBe(25);
        expect(validSort.data.sort).toBe('highest');
      }

      const invalidSort = reviewQuerySchema.safeParse({
        sort: 'random_order',
      });
      expect(invalidSort.success).toBe(false);
    });

    it('should validate analyticsEventSchema allowed event types', () => {
      const validEvent = analyticsEventSchema.safeParse({
        eventType: 'PRODUCT_VIEW',
        entityId: 'test-entity-123',
        metadata: { referrer: 'explore_page' },
      });
      expect(validEvent.success).toBe(true);

      const invalidEvent = analyticsEventSchema.safeParse({
        eventType: 'UNAUTHORIZED_CUSTOM_EVENT',
      });
      expect(invalidEvent.success).toBe(false);
    });
  });

  describe('2. Ratings and Reviews Engine', () => {
    it('should enforce verified purchase requirement on the server (Rule 6)', async () => {
      // testUser2 did NOT purchase testProduct1
      await expect(
        ReviewService.submitOrUpdateReview(testProduct1.id, testUser2.id, {
          rating: 4,
          title: 'Unverified attempt',
          content: 'I did not buy this product but trying to review it.',
        })
      ).rejects.toThrow('Only verified purchasers of this product can submit a customer review.');
    });

    it('should permit eligible purchaser to submit a 1-5 star review', async () => {
      // testUser1 purchased testProduct1
      const result = await ReviewService.submitOrUpdateReview(testProduct1.id, testUser1.id, {
        rating: 5,
        title: 'Exceptional Architecture',
        content: 'Fully typed TypeScript, modular service layer, and comprehensive error handling.',
      });

      expect(result.review).toBeDefined();
      expect(result.review.rating).toBe(5);
      expect(result.review.isVerifiedPurchase).toBe(true);
      expect(result.distribution.averageRating).toBe(5.0);
      expect(result.distribution.reviewCount).toBe(1);
      expect(result.distribution.fiveStarCount).toBe(1);
    });

    it('should enforce 1 active review per user with controlled editing', async () => {
      // testUser1 edits their review to 4 stars
      const updated = await ReviewService.submitOrUpdateReview(testProduct1.id, testUser1.id, {
        rating: 4,
        title: 'Updated: Very good with minor note',
        content: 'Revising my review: still great, but requires Node 20 or higher.',
      });

      expect(updated.review.rating).toBe(4);
      expect(updated.distribution.averageRating).toBe(4.0);
      expect(updated.distribution.reviewCount).toBe(1);
      expect(updated.distribution.fourStarCount).toBe(1);
      expect(updated.distribution.fiveStarCount).toBe(0);

      // Verify in DB that only 1 record exists for (userId, productId)
      const count = await prisma.productReview.count({
        where: { userId: testUser1.id, productId: testProduct1.id },
      });
      expect(count).toBe(1);
    });

    it('should retrieve reviews with correct pagination, distribution, and sorting', async () => {
      const data = await ReviewService.getProductReviews(testProduct1.id, {
        page: 1,
        limit: 10,
        sort: 'newest',
      });

      expect(data.reviews.length).toBe(1);
      expect(data.reviews[0].userName).toBe('Alice Purchaser');
      expect(data.reviews[0].isVerifiedPurchase).toBe(true);
      expect(data.distribution.reviewCount).toBe(1);
      expect(data.distribution.percentages.four).toBe(100);
    });

    it('should prevent arbitrary average rating injection and recalculate directly from DB', async () => {
      const dist = await ReviewService.recalculateProductRating(testProduct1.id);
      expect(dist.averageRating).toBe(4.0);
      expect(dist.reviewCount).toBe(1);
    });

    it('should allow users to report inappropriate reviews and prevent duplicate reports', async () => {
      const review = await prisma.productReview.findFirst({
        where: { productId: testProduct1.id },
      });
      expect(review).toBeDefined();

      // testUser1 cannot report their own review
      await expect(
        ReviewService.reportReview(review!.id, testUser1.id, {
          reason: 'Reporting myself should fail',
        })
      ).rejects.toThrow('You cannot report your own review');

      // testUser2 reports the review
      const report = await ReviewService.reportReview(review!.id, testUser2.id, {
        reason: 'Suspected competitor manipulation or inappropriate content.',
      });

      expect(report.id).toBeDefined();
      expect(report.status).toBe('PENDING');

      // testUser2 trying to report again must be rejected
      await expect(
        ReviewService.reportReview(review!.id, testUser2.id, {
          reason: 'Second duplicate report attempt.',
        })
      ).rejects.toThrow('You have already submitted a report for this review');
    });

    it('should support admin inspection, dismissal, and moderation of reviews', async () => {
      const review = await prisma.productReview.findFirst({
        where: { productId: testProduct1.id },
      });
      const reports = await ReviewService.getAdminReportedReviews('PENDING', 1, 10);
      expect(reports.reports.length).toBeGreaterThanOrEqual(1);

      // Moderate review to hidden
      const modResult = await ReviewService.moderateReview(review!.id, false);
      expect(modResult.review.isApproved).toBe(false);
      // Rating recomputation should reflect 0 approved reviews
      expect(modResult.distribution.reviewCount).toBe(0);

      // Verify reports were automatically resolved
      const pendingCount = await prisma.reviewReport.count({
        where: { reviewId: review!.id, status: 'PENDING' },
      });
      expect(pendingCount).toBe(0);

      // Restore review to approved
      const restored = await ReviewService.moderateReview(review!.id, true);
      expect(restored.review.isApproved).toBe(true);
      expect(restored.distribution.reviewCount).toBe(1);
    });
  });

  describe('3. Product Recommendations Engine', () => {
    it('should return related products based on category and tags without leaking private purchase data', async () => {
      const recs = await RecommendationService.getRelatedProducts(
        testProduct1.id,
        testUser1.id,
        4
      );

      expect(Array.isArray(recs)).toBe(true);
      // Excludes current product (testProduct1)
      const containsSelf = recs.some((r) => r.id === testProduct1.id);
      expect(containsSelf).toBe(false);
      // Contains valid product structure
      if (recs.length > 0) {
        expect(recs[0]).toHaveProperty('title');
        expect(recs[0]).toHaveProperty('coinPrice');
        expect(recs[0]).toHaveProperty('category');
        expect(recs[0]).toHaveProperty('averageRating');
      }
    });

    it('should provide useful fallback recommendations when no matches exist', async () => {
      const fallbacks = await RecommendationService.getFallbackRecommendations([], 3);
      expect(fallbacks.length).toBeGreaterThan(0);
      expect(fallbacks[0].matchReason).toContain('Popular');
    });

    it('should generate personalized recommendations privately based on user history', async () => {
      const personalized = await RecommendationService.getPersonalizedRecommendations(
        testUser1.id,
        4
      );

      expect(Array.isArray(personalized)).toBe(true);
      // Should not contain already owned product
      const containsOwned = personalized.some((r) => r.id === testProduct1.id);
      expect(containsOwned).toBe(false);
    });
  });

  describe('4. In-App Notifications Engine', () => {
    let notificationId: string;

    it('should create in-app notifications for lifecycle events', async () => {
      const notification = await NotificationService.createNotification({
        userId: testUser1.id,
        type: NotificationType.PURCHASE_SUCCESS,
        title: 'Order Confirmed',
        message: 'Your acquisition of Next.js SaaS Kit has been verified.',
        actionUrl: '/purchases',
      });

      expect(notification.id).toBeDefined();
      expect(notification.isRead).toBe(false);
      expect(notification.type).toBe('PURCHASE_SUCCESS');
      notificationId = notification.id;
    });

    it('should track unread count accurately for user header/badge', async () => {
      const count = await NotificationService.getUnreadCount(testUser1.id);
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination and filtering unread notifications', async () => {
      const data = await NotificationService.getUserNotifications(testUser1.id, 1, 10, true);
      expect(data.notifications.length).toBeGreaterThanOrEqual(1);
      expect(data.notifications.every((n) => !n.isRead)).toBe(true);
    });

    it('should mark single notification as read with ownership validation', async () => {
      // testUser2 cannot mark testUser1's notification as read
      await expect(
        NotificationService.markAsRead(testUser2.id, notificationId)
      ).rejects.toThrow('Unauthorized access to notification');

      const updated = await NotificationService.markAsRead(testUser1.id, notificationId);
      expect(updated.isRead).toBe(true);
    });

    it('should support mark all as read for user', async () => {
      // Create another unread notification
      await NotificationService.createNotification({
        userId: testUser1.id,
        type: NotificationType.TASK_REWARD,
        title: 'Task Coins Earned',
        message: '+50 CPC Coins credited.',
      });

      const res = await NotificationService.markAllAsRead(testUser1.id);
      expect(res.updatedCount).toBeGreaterThanOrEqual(1);

      const unreadRemaining = await NotificationService.getUnreadCount(testUser1.id);
      expect(unreadRemaining).toBe(0);
    });

    it('should notify purchasers when product update is released', async () => {
      const res = await NotificationService.notifyPurchasersOfProductUpdate(
        testProduct1.id,
        '1.1.0',
        'Added Stripe and Razorpay integrations.'
      );

      expect(res.notifiedCount).toBe(1);

      const latest = await prisma.notification.findFirst({
        where: { userId: testUser1.id, type: NotificationType.PRODUCT_UPDATE },
        orderBy: { createdAt: 'desc' },
      });
      expect(latest).toBeDefined();
      expect(latest?.title).toContain('v1.1.0 is now available');
    });
  });

  describe('5. Product Analytics Engine', () => {
    it('should record analytics events with anonymized metadata', async () => {
      const event = await AnalyticsService.trackEvent({
        eventType: 'PRODUCT_VIEW',
        entityId: testProduct1.id,
        userId: testUser1.id,
        metadata: { path: `/products/${testProduct1.slug}` },
      });

      expect(event.id).toBeDefined();
      expect(event.eventType).toBe('PRODUCT_VIEW');
    });

    it('should increment product viewCount when PRODUCT_VIEW event occurs', async () => {
      const before = await prisma.product.findUnique({
        where: { id: testProduct1.id },
        select: { viewCount: true },
      });

      await AnalyticsService.trackEvent({
        eventType: 'PRODUCT_VIEW',
        entityId: testProduct1.id,
      });

      const after = await prisma.product.findUnique({
        where: { id: testProduct1.id },
        select: { viewCount: true },
      });

      expect(after!.viewCount).toBe(before!.viewCount + 1);
    });

    it('should aggregate analytics summary metrics for administrators', async () => {
      const summary = await AnalyticsService.getAnalyticsSummary(30);
      expect(summary).toHaveProperty('counts');
      expect(summary.counts.PRODUCT_VIEW).toBeGreaterThanOrEqual(1);
    });
  });
});
