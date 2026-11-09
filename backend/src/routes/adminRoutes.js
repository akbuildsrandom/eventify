import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateUser);
router.use(authorizeRoles('ADMIN'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/events', adminController.getAllEvents);
router.patch('/events/:id/status', adminController.updateEventStatus);
router.get('/bookings', adminController.getAllBookings);
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
