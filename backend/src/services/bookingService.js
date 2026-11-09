import prisma from '../config/prisma.js';
import { env } from '../config/env.js';

export const bookingService = {
  /**
   * Atomically reserve tickets and create a PENDING booking
   */
  async createReservation(userId, { eventId, items, idempotencyKey }) {
    // 1. Check Idempotency Key
    if (idempotencyKey) {
      const existingBooking = await prisma.booking.findUnique({
        where: { idempotencyKey },
        include: {
          bookingItems: { include: { ticketType: true } },
          event: { include: { venue: true } },
          payments: true,
        },
      });

      if (existingBooking) {
        // If still pending and not expired, return existing
        if (existingBooking.status === 'PENDING' && new Date() < existingBooking.expiresAt) {
          return existingBooking;
        }
        if (existingBooking.status === 'CONFIRMED') {
          return existingBooking;
        }
      }
    }

    // 2. Validate Event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    });

    if (!event) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    if (event.status !== 'PUBLISHED') {
      const err = new Error(`Cannot purchase tickets for an event with status: ${event.status}`);
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    if (now > event.endDate) {
      const err = new Error('This event has already ended');
      err.statusCode = 400;
      throw err;
    }

    // 3. Validate requested items against ticket types
    const ticketTypeMap = new Map();
    for (const tt of event.ticketTypes) {
      ticketTypeMap.set(tt.id, tt);
    }

    let calculatedTotal = 0;
    const itemsToProcess = [];

    for (const item of items) {
      const tt = ticketTypeMap.get(item.ticketTypeId);
      if (!tt) {
        const err = new Error(`Ticket type ${item.ticketTypeId} does not belong to this event`);
        err.statusCode = 400;
        throw err;
      }

      // Check sales window
      if (now < tt.salesStart) {
        const err = new Error(`Sales have not started yet for ${tt.name}`);
        err.statusCode = 400;
        throw err;
      }
      if (now > tt.salesEnd) {
        const err = new Error(`Sales have ended for ${tt.name}`);
        err.statusCode = 400;
        throw err;
      }

      // Check max per order
      if (item.quantity > tt.maxPerOrder) {
        const err = new Error(`Cannot purchase more than ${tt.maxPerOrder} tickets for ${tt.name} per order`);
        err.statusCode = 400;
        throw err;
      }

      const unitPrice = Number(tt.price);
      const subtotal = unitPrice * item.quantity;
      calculatedTotal += subtotal;

      itemsToProcess.push({
        ticketTypeId: tt.id,
        quantity: item.quantity,
        unitPrice,
        subtotal,
        name: tt.name,
      });
    }

    // 4. Atomic PostgreSQL Transaction
    const timeoutMinutes = env.TICKET_RESERVATION_TIMEOUT_MINUTES || 10;
    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    const booking = await prisma.$transaction(async (tx) => {
      // Step A: Conditionally update availableQuantity for each ticket type atomically
      for (const item of itemsToProcess) {
        // Atomic conditional update ensures no race conditions or negative inventory
        const rowsUpdated = await tx.$executeRaw`
          UPDATE "TicketType"
          SET "availableQuantity" = "availableQuantity" - ${item.quantity},
              "updatedAt" = NOW()
          WHERE "id" = ${item.ticketTypeId}
            AND "availableQuantity" >= ${item.quantity}
        `;

        if (rowsUpdated === 0) {
          const err = new Error(`Insufficient tickets remaining for "${item.name}". Reservation failed.`);
          err.statusCode = 409;
          throw err;
        }
      }

      // Step B: Create Booking
      const newBooking = await tx.booking.create({
        data: {
          userId,
          eventId,
          totalAmount: calculatedTotal,
          status: 'PENDING',
          expiresAt,
          idempotencyKey,
          bookingItems: {
            create: itemsToProcess.map((item) => ({
              ticketTypeId: item.ticketTypeId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          bookingItems: {
            include: { ticketType: true },
          },
          event: {
            include: { venue: true },
          },
        },
      });

      return newBooking;
    });

    return booking;
  },

  /**
   * Release reserved inventory for an expired or cancelled booking
   */
  async releaseBookingInventory(bookingId, reason = 'EXPIRED') {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { bookingItems: true },
      });

      if (!booking || booking.status !== 'PENDING') {
        return false;
      }

      // Release inventory atomically for each item
      for (const item of booking.bookingItems) {
        await tx.$executeRaw`
          UPDATE "TicketType"
          SET "availableQuantity" = "availableQuantity" + ${item.quantity},
              "updatedAt" = NOW()
          WHERE "id" = ${item.ticketTypeId}
        `;
      }

      // Update status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: reason === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED',
        },
      });

      return true;
    });
  },

  /**
   * Clean up all expired pending bookings across the platform
   */
  async cleanupExpiredReservations() {
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      select: { id: true },
    });

    let cleanedCount = 0;
    for (const b of expiredBookings) {
      const released = await this.releaseBookingInventory(b.id, 'EXPIRED');
      if (released) cleanedCount++;
    }

    return { cleanedCount };
  },

  /**
   * Customer cancels their own pending booking
   */
  async cancelBooking(userId, bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    if (booking.userId !== userId) {
      const err = new Error('Not authorized to cancel this booking');
      err.statusCode = 403;
      throw err;
    }

    if (booking.status !== 'PENDING') {
      const err = new Error(`Cannot cancel a booking with status: ${booking.status}`);
      err.statusCode = 400;
      throw err;
    }

    await this.releaseBookingInventory(bookingId, 'CANCELLED');
    return true;
  },

  /**
   * Get user's bookings with full details
   */
  async getUserBookings(userId) {
    return await prisma.booking.findMany({
      where: { userId },
      include: {
        event: {
          include: { venue: true },
        },
        bookingItems: {
          include: { ticketType: true },
        },
        payments: true,
        tickets: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get single booking details
   */
  async getBookingById(bookingId, userId, userRole = 'CUSTOMER') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          include: { venue: true, organizer: { select: { id: true, name: true, email: true } } },
        },
        bookingItems: {
          include: { ticketType: true },
        },
        payments: true,
        tickets: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    // Role check: customer can only view own; organizer can view for their event; admin can view all
    if (userRole === 'CUSTOMER' && booking.userId !== userId) {
      const err = new Error('Not authorized to view this booking');
      err.statusCode = 403;
      throw err;
    }

    if (userRole === 'ORGANIZER' && booking.event.organizerId !== userId) {
      const err = new Error('Not authorized to view this booking');
      err.statusCode = 403;
      throw err;
    }

    return booking;
  },
};
