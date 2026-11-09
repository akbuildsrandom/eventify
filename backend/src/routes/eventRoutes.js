import { Router } from 'express';
import { eventController } from '../controllers/eventController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { upload } from '../middleware/upload.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createEventSchema, updateEventSchema, eventQuerySchema } from '../validators/eventValidator.js';

const router = Router();

router.get('/', rateLimiters.search, validateQuery(eventQuerySchema), eventController.getEvents);
router.get('/:id', eventController.getEventByIdOrSlug);

// Organizer & Admin Protected Routes
router.post(
  '/',
  authenticateUser,
  authorizeRoles('ORGANIZER', 'ADMIN'),
  validateBody(createEventSchema),
  eventController.createEvent
);

router.put(
  '/:id',
  authenticateUser,
  authorizeRoles('ORGANIZER', 'ADMIN'),
  validateBody(updateEventSchema),
  eventController.updateEvent
);

router.patch(
  '/:id/publish',
  authenticateUser,
  authorizeRoles('ORGANIZER', 'ADMIN'),
  eventController.publishEvent
);

router.patch(
  '/:id/cancel',
  authenticateUser,
  authorizeRoles('ORGANIZER', 'ADMIN'),
  eventController.cancelEvent
);

router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles('ORGANIZER', 'ADMIN'),
  eventController.deleteDraftEvent
);

router.post(
  '/upload-banner',
  authenticateUser,
  authorizeRoles('ORGANIZER', 'ADMIN'),
  upload.single('banner'),
  eventController.uploadBanner
);

export default router;
