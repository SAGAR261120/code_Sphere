import { prisma } from '@/lib/prisma';
import { AnalyticsEventInput } from '@/lib/validations/interaction.schema';

export class AnalyticsService {
  /**
   * Tracks an analytics event.
   * Increments product counters when appropriate (e.g., views, downloads).
   */
  static async trackEvent(input: AnalyticsEventInput & { userId?: string }) {
    const { eventType, entityId, metadata, userId } = input;

    const event = await prisma.analyticsEvent.create({
      data: {
        eventType,
        userId: userId || null,
        entityId: entityId || null,
        metadata: metadata || {},
      },
    });

    // If event is PRODUCT_VIEW and has entityId, increment viewCount on product
    if (eventType === 'PRODUCT_VIEW' && entityId) {
      try {
        await prisma.product.update({
          where: { id: entityId },
          data: { viewCount: { increment: 1 } },
        });
      } catch (e) {
        // Non-blocking if product id is invalid
      }
    }

    return event;
  }

  /**
   * Admin: Retrieves aggregated analytics over a specified number of days.
   */
  static async getAnalyticsSummary(days = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const [eventsByType, totalViews, recentEvents] = await Promise.all([
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: {
          createdAt: { gte: sinceDate },
        },
        _count: {
          _all: true,
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: 'PRODUCT_VIEW',
          createdAt: { gte: sinceDate },
        },
      }),
      prisma.analyticsEvent.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const counts: Record<string, number> = {
      SEARCH: 0,
      PRODUCT_VIEW: 0,
      PURCHASE_INTENT: 0,
      PURCHASE: 0,
      DOWNLOAD: 0,
      TASK_ENGAGE: 0,
    };

    eventsByType.forEach((e) => {
      counts[e.eventType] = e._count._all;
    });

    return {
      timeframeDays: days,
      counts,
      totalViews,
      recentEvents,
    };
  }
}
