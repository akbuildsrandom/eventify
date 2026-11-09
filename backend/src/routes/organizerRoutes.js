import { Router } from 'express';
import { organizerController } from '../controllers/organizerController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.use(authorizeRoles('ORGANIZER', 'ADMIN'));

router.get('/dashboard', organizerController.getDashboardStats);
router.get('/events', organizerController.getMyEvents);
router.get('/attendees', organizerController.getEventAttendees);
router.get('/analytics', organizerController.getAnalytics);

export default router;
