import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { authenticateUser } from '../middleware/auth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { createBookingSchema } from '../validators/bookingValidator.js';

const router = Router();

router.use(authenticateUser);

router.post('/', rateLimiters.booking, validateBody(createBookingSchema), bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);
router.get('/:id', bookingController.getBookingById);
router.post('/:id/cancel', bookingController.cancelBooking);

export default router;
