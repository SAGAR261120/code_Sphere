import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { ApiError } from '@/lib/api-response';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}

export class NotificationService {
  /**
   * Creates an in-app notification record.
   */
  static async createNotification(params: CreateNotificationParams) {
    const { userId, type, title, message, actionUrl } = params;

    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl: actionUrl || null,
        isRead: false,
      },
    });
  }

  /**
   * Retrieves paginated notifications for a user, with optional unread-only filter.
   */
  static async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, totalItems, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    };
  }

  /**
   * Returns current unread notification count for user header/badge.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Marks a single notification as read, validating ownership.
   */
  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    if (notification.userId !== userId) {
      throw new ApiError(403, 'Unauthorized access to notification', 'FORBIDDEN');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Marks all notifications as read for a user.
   */
  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updatedCount: result.count };
  }

  /**
   * Notifies all entitled purchasers of a product when an update is released.
   */
  static async notifyPurchasersOfProductUpdate(
    productId: string,
    newVersion: string,
    changelogSnippet?: string
  ) {
    const [product, entitlements] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, title: true, slug: true },
      }),
      prisma.purchaseEntitlement.findMany({
        where: { productId, isRevoked: false },
        select: { userId: true },
      }),
    ]);

    if (!product || entitlements.length === 0) {
      return { notifiedCount: 0 };
    }

    const uniqueUserIds = [...new Set(entitlements.map((e) => e.userId))];

    const data = uniqueUserIds.map((userId) => ({
      userId,
      type: NotificationType.PRODUCT_UPDATE,
      title: `${product.title} v${newVersion} is now available!`,
      message: changelogSnippet
        ? `A new update has been released: ${changelogSnippet.slice(0, 120)}...`
        : `Version ${newVersion} is available for download in your library.`,
      actionUrl: `/products/${product.slug}`,
      isRead: false,
    }));

    const result = await prisma.notification.createMany({
      data,
    });

    return { notifiedCount: result.count };
  }
}
