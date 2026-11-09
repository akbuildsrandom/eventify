import prisma from '../config/prisma.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const organizerController = {
  /**
   * High-level organizer dashboard metrics
   */
  async getDashboardStats(req, res, next) {
    try {
      const organizerId = req.user.id;

      // 1. Get organizer events
      const events = await prisma.event.findMany({
        where: { organizerId },
        include: {
          ticketTypes: true,
          bookings: {
            where: { status: 'CONFIRMED' },
            include: { bookingItems: true, tickets: true },
          },
        },
      });

      const totalEvents = events.length;
      let totalTicketsSold = 0;
      let totalAvailableTickets = 0;
      let totalRevenue = 0;
      let totalConfirmedBookings = 0;

      for (const ev of events) {
        for (const tt of ev.ticketTypes) {
          totalAvailableTickets += tt.availableQuantity;
        }
        for (const b of ev.bookings) {
          totalConfirmedBookings++;
          totalRevenue += Number(b.totalAmount);
          for (const item of b.bookingItems) {
            totalTicketsSold += item.quantity;
          }
        }
      }

      const upcomingEventsCount = events.filter(
        (e) => e.status === 'PUBLISHED' && new Date(e.startDate) >= new Date()
      ).length;

      // 2. Aggregate sales/revenue by event for Recharts
      const eventSalesChart = events.map((e) => {
        const rev = e.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
        const sold = e.bookings.reduce((sum, b) => {
          return sum + b.bookingItems.reduce((iSum, item) => iSum + item.quantity, 0);
        }, 0);
        return {
          id: e.id,
          name: e.title.length > 20 ? e.title.slice(0, 18) + '...' : e.title,
          fullTitle: e.title,
          revenue: rev,
          ticketsSold: sold,
        };
      });

      // 3. Category distribution
      const categoryDistributionMap = {};
      for (const ev of events) {
        for (const b of ev.bookings) {
          for (const item of b.bookingItems) {
            const cat = ev.category;
            categoryDistributionMap[cat] = (categoryDistributionMap[cat] || 0) + item.quantity;
          }
        }
      }
      const categoryDistributionChart = Object.entries(categoryDistributionMap).map(([category, count]) => ({
        category,
        count,
      }));

      return sendSuccess(res, 'Organizer dashboard metrics retrieved', {
        metrics: {
          totalEvents,
          totalTicketsSold,
          totalAvailableTickets,
          totalRevenue,
          totalConfirmedBookings,
          upcomingEventsCount,
        },
        charts: {
          eventSales: eventSalesChart,
          categoryDistribution: categoryDistributionChart,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all events belonging to the organizer
   */
  async getMyEvents(req, res, next) {
    try {
      const organizerId = req.user.id;
      const events = await prisma.event.findMany({
        where: { organizerId },
        include: {
          venue: true,
          ticketTypes: true,
          _count: {
            select: { bookings: true, reviews: true },
          },
          bookings: {
            where: { status: 'CONFIRMED' },
            select: { totalAmount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const enriched = events.map((e) => {
        const totalRevenue = e.bookings.reduce((acc, b) => acc + Number(b.totalAmount), 0);
        const totalCapacity = e.ticketTypes.reduce((acc, t) => acc + t.totalQuantity, 0);
        const totalAvailable = e.ticketTypes.reduce((acc, t) => acc + t.availableQuantity, 0);
        const totalSold = totalCapacity - totalAvailable;

        return {
          ...e,
          revenue: totalRevenue,
          ticketsSold: totalSold,
          ticketsAvailable: totalAvailable,
          totalCapacity,
        };
      });

      return sendSuccess(res, 'Organizer events retrieved', { events: enriched });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get attendees across organizer's events with search and filters
   */
  async getEventAttendees(req, res, next) {
    try {
      const organizerId = req.user.id;
      const { eventId, search, status } = req.query;

      const where = {
        booking: {
          event: {
            organizerId,
            ...(eventId ? { id: eventId } : {}),
          },
          status: 'CONFIRMED',
        },
      };

      if (status) {
        where.status = status; // VALID, USED
      }

      if (search) {
        where.OR = [
          { ticketCode: { contains: search, mode: 'insensitive' } },
          { booking: { user: { name: { contains: search, mode: 'insensitive' } } } },
          { booking: { user: { email: { contains: search, mode: 'insensitive' } } } },
        ];
      }

      const tickets = await prisma.ticket.findMany({
        where,
        include: {
          ticketType: true,
          booking: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
              event: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const attendees = tickets.map((t) => ({
        ticketId: t.id,
        ticketCode: t.ticketCode,
        ticketType: t.ticketType.name,
        ticketPrice: t.ticketType.price,
        ticketStatus: t.status,
        checkedInAt: t.checkedInAt,
        attendeeName: t.booking.user.name,
        attendeeEmail: t.booking.user.email,
        attendeePhone: t.booking.user.phone,
        eventId: t.booking.event.id,
        eventTitle: t.booking.event.title,
        bookingId: t.bookingId,
        bookedAt: t.createdAt,
      }));

      return sendSuccess(res, 'Attendees retrieved successfully', { attendees });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Detailed analytics reports
   */
  async getAnalytics(req, res, next) {
    try {
      const organizerId = req.user.id;

      // Group tickets by sales date
      const confirmedBookings = await prisma.booking.findMany({
        where: {
          event: { organizerId },
          status: 'CONFIRMED',
        },
        include: {
          bookingItems: { include: { ticketType: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by Day (YYYY-MM-DD)
      const dailyMap = {};
      for (const b of confirmedBookings) {
        const day = b.createdAt.toISOString().slice(0, 10);
        if (!dailyMap[day]) {
          dailyMap[day] = { date: day, revenue: 0, tickets: 0 };
        }
        dailyMap[day].revenue += Number(b.totalAmount);
        for (const item of b.bookingItems) {
          dailyMap[day].tickets += item.quantity;
        }
      }

      const dailyTrend = Object.values(dailyMap);

      return sendSuccess(res, 'Analytics aggregated successfully', {
        dailyTrend,
        totalBookings: confirmedBookings.length,
      });
    } catch (err) {
      next(err);
    }
  },
};
