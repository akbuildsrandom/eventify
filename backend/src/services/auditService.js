import prisma from '../config/prisma.js';

export const auditService = {
  async log({ userId, action, entityType, entityId, metadata = {} }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          metadata,
        },
      });
    } catch (err) {
      console.warn('[Audit Log Warning] Failed to record audit log:', err.message);
      return null;
    }
  },

  async getAuditLogs({ page = 1, limit = 20, entityType, action }) {
    const skip = (page - 1) * limit;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
