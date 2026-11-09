import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { generateQRCodeDataURL } from '../utils/qrcode.js';

export const ticketService = {
  /**
   * Internal generator called during payment confirmation transaction
   */
  async generateTicketsForBooking(tx, booking) {
    const generated = [];

    for (const item of booking.bookingItems) {
      for (let i = 0; i < item.quantity; i++) {
        const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
        const eventPrefix = booking.eventId.slice(0, 4).toUpperCase();
        const ticketCode = `EVT-${eventPrefix}-${randomPart}`;

        // QR code payload contains only public verifiable ticket metadata
        const qrPayload = {
          ticketCode,
          eventId: booking.eventId,
          ticketTypeId: item.ticketTypeId,
          type: item.ticketType.name,
        };

        const qrCode = await generateQRCodeDataURL(qrPayload);

        const ticket = await tx.ticket.create({
          data: {
            bookingId: booking.id,
            ticketTypeId: item.ticketTypeId,
            ticketCode,
            qrCode,
            status: 'VALID',
          },
          include: {
            ticketType: true,
          },
        });

        generated.push(ticket);
      }
    }

    return generated;
  },

  /**
   * Get tickets belonging to user
   */
  async getUserTickets(userId) {
    return await prisma.ticket.findMany({
      where: {
        booking: { userId },
      },
      include: {
        ticketType: true,
        booking: {
          include: {
            event: {
              include: { venue: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get single digital ticket details
   */
  async getTicketById(ticketId, userId, userRole = 'CUSTOMER') {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        ticketType: true,
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            event: {
              include: {
                venue: true,
                organizer: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      const err = new Error('Ticket not found');
      err.statusCode = 404;
      throw err;
    }

    // Role check: customer can view own; organizer can view for their event; admin can view all
    if (userRole === 'CUSTOMER' && ticket.booking.userId !== userId) {
      const err = new Error('Not authorized to access this ticket');
      err.statusCode = 403;
      throw err;
    }

    if (userRole === 'ORGANIZER' && ticket.booking.event.organizerId !== userId) {
      const err = new Error('Not authorized to view ticket from another organizer\'s event');
      err.statusCode = 403;
      throw err;
    }

    return ticket;
  },

  /**
   * Atomic ticket check-in verification for organizers
   */
  async verifyAndCheckInTicket(organizerId, { ticketCode, eventId }, userRole = 'ORGANIZER') {
    if (!ticketCode || !eventId) {
      const err = new Error('Ticket code and Event ID are required for verification');
      err.statusCode = 400;
      throw err;
    }

    // Verify organizer owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, organizerId: true },
    });

    if (!event) {
      const err = new Error('Target event not found');
      err.statusCode = 404;
      throw err;
    }

    if (userRole !== 'ADMIN' && event.organizerId !== organizerId) {
      const err = new Error('You can only verify tickets for your own events');
      err.statusCode = 403;
      throw err;
    }

    // Find ticket by code
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        ticketType: true,
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            event: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!ticket) {
      return {
        valid: false,
        status: 'INVALID',
        message: 'Invalid ticket. No ticket found matching this code.',
      };
    }

    // Check if ticket belongs to the correct event
    if (ticket.booking.eventId !== eventId) {
      return {
        valid: false,
        status: 'WRONG_EVENT',
        message: `This ticket is registered for a different event: "${ticket.booking.event.title}"`,
        ticketInfo: {
          ticketCode: ticket.ticketCode,
          assignedEvent: ticket.booking.event.title,
        },
      };
    }

    // Check if ticket is cancelled
    if (ticket.status === 'CANCELLED') {
      return {
        valid: false,
        status: 'CANCELLED',
        message: 'This ticket has been cancelled or refunded.',
      };
    }

    // Check if already checked in
    if (ticket.status === 'USED') {
      return {
        valid: false,
        status: 'ALREADY_USED',
        message: `Ticket already used. Checked in on ${new Date(ticket.checkedInAt).toLocaleString('en-IN')}`,
        ticketInfo: {
          ticketCode: ticket.ticketCode,
          attendeeName: ticket.booking.user.name,
          ticketType: ticket.ticketType.name,
          checkedInAt: ticket.checkedInAt,
        },
      };
    }

    // Atomic database update: only update if status is currently VALID
    // Prevents concurrent scanners from checking in the same ticket twice!
    const updatedCount = await prisma.$executeRaw`
      UPDATE "Ticket"
      SET "status" = 'USED',
          "checkedInAt" = NOW()
      WHERE "id" = ${ticket.id}
        AND "status" = 'VALID'
    `;

    if (updatedCount === 0) {
      return {
        valid: false,
        status: 'ALREADY_USED',
        message: 'Concurrent check-in detected. Ticket was just checked in by another scanner.',
      };
    }

    return {
      valid: true,
      status: 'CHECKED_IN',
      message: 'Ticket verified successfully! Welcome to the event.',
      attendee: {
        name: ticket.booking.user.name,
        email: ticket.booking.user.email,
        phone: ticket.booking.user.phone,
        ticketType: ticket.ticketType.name,
        ticketCode: ticket.ticketCode,
        checkedInAt: new Date(),
      },
    };
  },

  /**
   * Get check-in statistics for an event
   */
  async getEventCheckInStats(organizerId, eventId, userRole = 'ORGANIZER') {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizerId: true },
    });

    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    if (userRole !== 'ADMIN' && event.organizerId !== organizerId) {
      const err = new Error('Not authorized to access check-in stats for this event');
      err.statusCode = 403;
      throw err;
    }

    const [totalTickets, checkedInTickets, ticketsByType] = await Promise.all([
      prisma.ticket.count({
        where: { booking: { eventId, status: 'CONFIRMED' } },
      }),
      prisma.ticket.count({
        where: { booking: { eventId, status: 'CONFIRMED' }, status: 'USED' },
      }),
      prisma.ticket.groupBy({
        by: ['ticketTypeId', 'status'],
        where: { booking: { eventId, status: 'CONFIRMED' } },
        _count: { id: true },
      }),
    ]);

    const checkInRate = totalTickets > 0 ? ((checkedInTickets / totalTickets) * 100).toFixed(1) : 0;

    return {
      totalTickets,
      checkedInTickets,
      remainingTickets: totalTickets - checkedInTickets,
      checkInRate: parseFloat(checkInRate),
      ticketsByType,
    };
  },
};
