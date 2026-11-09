import prisma from '../config/prisma.js';
import { auditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const adminController = {
  /**
   * System-wide platform metrics
   */
  async getDashboardStats(req, res, next) {
    try {
      const [
        totalUsers,
        totalOrganizers,
        totalEvents,
        totalPublishedEvents,
        totalBookings,
        confirmedPayments,
        recentActivities,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ORGANIZER' } }),
        prisma.event.count(),
        prisma.event.count({ where: { status: 'PUBLISHED' } }),
        prisma.booking.count(),
        prisma.payment.aggregate({
          where: { status: 'SUCCESS' },
          _sum: { amount: true },
          _count: { id: true },
        }),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
      ]);

      const platformRevenue = confirmedPayments._sum.amount ? Number(confirmedPayments._sum.amount) : 0;
      const totalConfirmedTickets = await prisma.ticket.count({
        where: { booking: { status: 'CONFIRMED' } },
      });

      return sendSuccess(res, 'Admin dashboard metrics retrieved', {
        metrics: {
          totalUsers,
          totalOrganizers,
          totalEvents,
          totalPublishedEvents,
          totalBookings,
          totalConfirmedTickets,
          platformRevenue,
        },
        recentActivities,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all users with search, role filter, and server-side pagination
   */
  async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const { search, role } = req.query;

      const where = {};
      if (role && role !== 'ALL') {
        where.role = role;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isVerified: true,
            avatar: true,
            phone: true,
            createdAt: true,
            _count: {
              select: { bookings: true, events: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return sendSuccess(res, 'Users retrieved successfully', users, 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Change user role (e.g. promote to ORGANIZER)
   */
  async updateUserRole(req, res, next) {
    try {
      const targetUserId = req.params.id;
      const { role } = req.body;

      if (!['CUSTOMER', 'ORGANIZER', 'ADMIN'].includes(role)) {
        return sendError(res, 'Invalid role specified', [], 400);
      }

      // Safeguard: Do not allow modifying own role
      if (req.user.id === targetUserId) {
        return sendError(res, 'You cannot change your own administrative role', [], 400);
      }

      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
      });

      await auditService.log({
        userId: req.user.id,
        action: 'USER_ROLE_UPDATED',
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { newRole: role, updatedUserEmail: updated.email },
      });

      return sendSuccess(res, `User role successfully updated to ${role}`, { user: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all events across platform with moderation controls
   */
  async getAllEvents(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const { search, status, category } = req.query;

      const where = {};
      if (status && status !== 'ALL') where.status = status;
      if (category && category !== 'ALL') where.category = category;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { organizer: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const skip = (page - 1) * limit;

      const [total, events] = await Promise.all([
        prisma.event.count({ where }),
        prisma.event.findMany({
          where,
          include: {
            organizer: { select: { id: true, name: true, email: true } },
            venue: true,
            ticketTypes: true,
            _count: { select: { bookings: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return sendSuccess(res, 'All platform events retrieved', events, 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update event status (e.g., moderation / suspension / cancellation)
   */
  async updateEventStatus(req, res, next) {
    try {
      const eventId = req.params.id;
      const { status } = req.body;

      if (!['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'].includes(status)) {
        return sendError(res, 'Invalid event status', [], 400);
      }

      const updated = await prisma.event.update({
        where: { id: eventId },
        data: { status },
      });

      await auditService.log({
        userId: req.user.id,
        action: 'EVENT_STATUS_MODERATED',
        entityType: 'EVENT',
        entityId: eventId,
        metadata: { newStatus: status, eventTitle: updated.title },
      });

      return sendSuccess(res, `Event status updated to ${status}`, { event: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * View all platform bookings
   */
  async getAllBookings(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const { status } = req.query;

      const where = {};
      if (status && status !== 'ALL') where.status = status;

      const skip = (page - 1) * limit;

      const [total, bookings] = await Promise.all([
        prisma.booking.count({ where }),
        prisma.booking.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            event: { select: { id: true, title: true } },
            bookingItems: { include: { ticketType: true } },
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return sendSuccess(res, 'Platform bookings retrieved', bookings, 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '25', 10);
      const data = await auditService.getAuditLogs({
        page,
        limit,
        entityType: req.query.entityType,
        action: req.query.action,
      });

      return sendSuccess(res, 'Audit logs retrieved', data.logs, 200, data.pagination);
    } catch (err) {
      next(err);
    }
  },
};
