import { Router } from 'express';
import { ticketController } from '../controllers/ticketController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateUser);

router.get('/my', ticketController.getMyTickets);
router.get('/:id', ticketController.getTicketById);

// Organizer Check-in & Scanner Endpoints
router.post('/check-in', authorizeRoles('ORGANIZER', 'ADMIN'), ticketController.verifyAndCheckInTicket);
router.get('/events/:eventId/stats', authorizeRoles('ORGANIZER', 'ADMIN'), ticketController.getEventCheckInStats);

export default router;
