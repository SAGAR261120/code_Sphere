import Notification from './notification.model.js';

export async function createNotification(userId, { type, title, message, actionUrl, metadata }) {
  try {
    await Notification.create({ userId, type, title, message, actionUrl, metadata });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

export async function getUserNotifications(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId }),
  ]);
  return {
    notifications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function markNotificationRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
}

export async function markAllRead(userId) {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ userId, isRead: false });
}
