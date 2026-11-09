import prisma from '../config/prisma.js';
import razorpay from '../config/razorpay.js';
import { ticketService } from './ticketService.js';
import { sendEmail } from '../config/resend.js';

export const paymentService = {
  /**
   * Create Razorpay Order for a PENDING booking
   */
  async createPaymentOrder(userId, bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        user: true,
      },
    });

    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    if (booking.userId !== userId) {
      const err = new Error('Not authorized to pay for this booking');
      err.statusCode = 403;
      throw err;
    }

    if (booking.status !== 'PENDING') {
      const err = new Error(`Cannot initiate payment. Booking status is ${booking.status}`);
      err.statusCode = 400;
      throw err;
    }

    if (new Date() > booking.expiresAt) {
      const err = new Error('Reservation has expired. Please reserve tickets again.');
      err.statusCode = 400;
      throw err;
    }

    // Create Razorpay Order
    const receipt = `rcpt_${booking.id.replace(/-/g, '').slice(0, 20)}`;
    const order = await razorpay.createOrder(
      Number(booking.totalAmount),
      receipt,
      {
        bookingId: booking.id,
        userId: booking.userId,
        eventTitle: booking.event.title.slice(0, 30),
      }
    );

    // Record Payment record in DB
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        amount: booking.totalAmount,
        provider: 'RAZORPAY',
        providerOrderId: order.id,
        status: 'PENDING',
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      keyId: razorpay.keyId,
      bookingId: booking.id,
      paymentId: payment.id,
      isTestMode: true,
      isConfigured: razorpay.isConfigured,
    };
  },

  /**
   * Verify Payment Signature and confirm booking
   */
  async verifyPayment(userId, { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    // 1. Verify Signature
    const isValidSignature = razorpay.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      // Record payment failure
      await prisma.payment.updateMany({
        where: { providerOrderId: razorpayOrderId },
        data: { status: 'FAILED' },
      });
      const err = new Error('Invalid payment signature. Payment verification failed.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Confirm booking and generate tickets in transaction
    const confirmedData = await this.confirmBookingPayment({
      bookingId,
      providerOrderId: razorpayOrderId,
      providerPaymentId: razorpayPaymentId,
    });

    return confirmedData;
  },

  /**
   * Internal reusable confirmation workflow
   */
  async confirmBookingPayment({ bookingId, providerOrderId, providerPaymentId }) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          bookingItems: { include: { ticketType: true } },
          event: { include: { venue: true } },
          user: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // If already confirmed (e.g. verified by webhook earlier), return existing
      if (booking.status === 'CONFIRMED') {
        const tickets = await tx.ticket.findMany({
          where: { bookingId },
          include: { ticketType: true },
        });
        return { booking, tickets, alreadyProcessed: true };
      }

      // Update payment record
      await tx.payment.updateMany({
        where: { providerOrderId },
        data: {
          providerPaymentId,
          status: 'SUCCESS',
        },
      });

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
        },
      });

      // Generate Digital Tickets
      const generatedTickets = await ticketService.generateTicketsForBooking(tx, booking);

      // Create confirmation notification
      await tx.notification.create({
        data: {
          userId: booking.userId,
          title: `Booking Confirmed: ${booking.event.title}`,
          message: `Your booking #${booking.id.slice(0, 8)} is confirmed! ${generatedTickets.length} tickets have been issued.`,
          type: 'BOOKING',
        },
      });

      // Send transactional confirmation email asynchronously
      setTimeout(async () => {
        try {
          await sendEmail({
            to: booking.user.email,
            subject: `Tickets Confirmed: ${booking.event.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #6d28d9;">Booking Confirmed! 🎉</h2>
                <p>Hi ${booking.user.name}, your tickets for <strong>${booking.event.title}</strong> have been confirmed.</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(booking.event.startDate).toLocaleDateString('en-IN')}</p>
                  <p style="margin: 4px 0;"><strong>Venue:</strong> ${booking.event.venue?.name || 'TBA'}, ${booking.event.venue?.city || ''}</p>
                  <p style="margin: 4px 0;"><strong>Tickets:</strong> ${generatedTickets.length} pass(es)</p>
                  <p style="margin: 4px 0;"><strong>Total Paid:</strong> ₹${Number(booking.totalAmount).toLocaleString('en-IN')}</p>
                </div>
                <p>View or download your digital tickets from your Eventify dashboard anytime.</p>
              </div>
            `,
          });
        } catch (mailErr) {
          console.warn('[Mail Warning] Could not send confirmation email:', mailErr.message);
        }
      }, 0);

      return {
        booking: updatedBooking,
        tickets: generatedTickets,
        alreadyProcessed: false,
      };
    });
  },

  /**
   * Process Razorpay Webhook Event
   */
  async processWebhook(rawBody, signature, eventData) {
    // 1. Verify Webhook Signature
    const isValid = razorpay.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      const err = new Error('Invalid webhook signature');
      err.statusCode = 400;
      throw err;
    }

    const eventId = eventData.event_id || eventData.id || `evt_${Date.now()}`;
    const eventType = eventData.event;

    // 2. Idempotency Check in DB
    const existing = await prisma.paymentWebhookEvent.findUnique({
      where: { providerEventId: eventId },
    });

    if (existing) {
      return { status: 'already_processed', eventId };
    }

    // Save webhook event record
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: 'RAZORPAY',
        providerEventId: eventId,
        eventType,
      },
    });

    // 3. Handle Events
    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const paymentEntity = eventData.payload?.payment?.entity;
      const notes = paymentEntity?.notes || eventData.payload?.order?.entity?.notes || {};
      const bookingId = notes.bookingId;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (bookingId) {
        await this.confirmBookingPayment({
          bookingId,
          providerOrderId: orderId,
          providerPaymentId: paymentId,
        });
      }
    }

    await prisma.paymentWebhookEvent.update({
      where: { providerEventId: eventId },
      data: { processedAt: new Date() },
    });

    return { status: 'processed', eventId };
  },
};
