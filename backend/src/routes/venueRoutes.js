import { Router } from 'express';
import { venueController } from '../controllers/venueController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { venueInputSchema } from '../validators/eventValidator.js';

const router = Router();

router.get('/', venueController.getAllVenues);
router.post(
  '/',
  authenticateUser,
  authorizeRoles('ORGANIZER', 'ADMIN'),
  validateBody(venueInputSchema),
  venueController.createVenue
);

export default router;
