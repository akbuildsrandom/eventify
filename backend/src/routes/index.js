import { Router } from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import venueRoutes from './venueRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import organizerRoutes from './organizerRoutes.js';
import adminRoutes from './adminRoutes.js';
import cronRoutes from './cronRoutes.js';
import prisma from '../config/prisma.js';
import { cache } from '../config/redis.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { isResendConfigured } from '../config/resend.js';
import razorpay from '../config/razorpay.js';

const router = Router();

// Platform Health & Integrations Status Check
router.get('/health', async (req, res) => {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = `unhealthy: ${err.message}`;
  }

  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
      redis: cache.isRemote ? 'connected (upstash)' : 'in-memory-fallback',
      razorpay: razorpay.isConfigured ? 'configured' : 'test-mode-simulation',
      cloudinary: isCloudinaryConfigured ? 'configured' : 'fallback-mode',
      resend: isResendConfigured ? 'configured' : 'simulation-mode',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/venues', venueRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/tickets', ticketRoutes);
router.use('/notifications', notificationRoutes);
router.use('/organizer', organizerRoutes);
router.use('/admin', adminRoutes);
router.use('/cron', cronRoutes);
router.use('/', reviewRoutes); // /events/:id/reviews & /reviews/:id

export default router;
