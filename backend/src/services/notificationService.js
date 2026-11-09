import prisma from '../config/prisma.js';

export const notificationService = {
  async createNotification({ userId, title, message, type = 'SYSTEM' }) {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  },

  async getUserNotifications(userId, limit = 20) {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  },

  async markAsRead(userId, notificationId) {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
