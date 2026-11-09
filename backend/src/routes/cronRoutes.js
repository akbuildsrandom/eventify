import { Router } from 'express';
import { bookingService } from '../services/bookingService.js';
import prisma from '../config/prisma.js';
import { sendEmail } from '../config/resend.js';
import { env } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = Router();

// Middleware to verify CRON_SECRET or Vercel Cron header
const verifyCronAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cronSecretHeader = req.headers['x-cron-secret'];

  const providedSecret = cronSecretHeader || (authHeader && authHeader.replace('Bearer ', ''));

  if (!providedSecret || providedSecret !== env.CRON_SECRET) {
    // If running in development without CRON_SECRET, allow for local testing
    if (env.NODE_ENV === 'development') {
      return next();
    }
    return sendError(res, 'Unauthorized cron execution request', [], 401);
  }
  next();
};

router.use(verifyCronAuth);

/**
 * Periodically release inventory from expired PENDING bookings
 */
router.all('/cleanup-reservations', async (req, res, next) => {
  try {
    const result = await bookingService.cleanupExpiredReservations();
    return sendSuccess(res, 'Expired reservations cleaned successfully', result);
  } catch (err) {
    next(err);
  }
});

/**
 * Send automated event reminders (24 hours before event)
 */
router.all('/reminders', async (req, res, next) => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find confirmed bookings for events starting between 24 and 25 hours from now
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        event: {
          startDate: {
            gte: in24Hours,
            lt: in25Hours,
          },
        },
      },
      include: {
        user: true,
        event: { include: { venue: true } },
      },
    });

    let emailsDispatched = 0;

    for (const b of upcomingBookings) {
      // Idempotency check: don't send multiple reminder notifications to the same user
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: b.userId,
          type: 'REMINDER',
          title: { contains: b.event.title },
        },
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId: b.userId,
            title: `Reminder: ${b.event.title} is tomorrow!`,
            message: `Your event is scheduled for tomorrow at ${new Date(b.event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} at ${b.event.venue?.name || 'the venue'}. Don't forget your tickets!`,
            type: 'REMINDER',
          },
        });

        await sendEmail({
          to: b.user.email,
          subject: `Event Reminder: ${b.event.title} is tomorrow!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #6d28d9;">Event Reminder ⏰</h2>
              <p>Hi ${b.user.name}, this is a friendly reminder that <strong>${b.event.title}</strong> is happening in 24 hours.</p>
              <p><strong>Venue:</strong> ${b.event.venue?.name || 'TBA'}, ${b.event.venue?.city || ''}</p>
              <p>Have your digital pass QR codes ready on your phone when arriving for swift check-in!</p>
            </div>
          `,
        });

        emailsDispatched++;
      }
    }

    return sendSuccess(res, 'Reminders processed successfully', {
      bookingsEvaluated: upcomingBookings.length,
      emailsDispatched,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
