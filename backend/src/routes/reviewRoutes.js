import { Router } from 'express';
import { reviewController } from '../controllers/reviewController.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createReviewSchema } from '../validators/reviewValidator.js';

const router = Router();

// Public: view event reviews
router.get('/events/:id/reviews', reviewController.getEventReviews);

// Authenticated: verified attendee reviews
router.post('/events/:id/reviews', authenticateUser, validateBody(createReviewSchema), reviewController.createReview);
router.delete('/reviews/:id', authenticateUser, reviewController.deleteReview);

export default router;
