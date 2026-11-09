import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createPaymentOrderSchema, verifyPaymentSchema } from '../validators/paymentValidator.js';

const router = Router();

// Webhook endpoint (unauthenticated, signature-verified)
router.post('/webhook', paymentController.handleWebhook);

// Authenticated customer payment flows
router.post('/create-order', authenticateUser, validateBody(createPaymentOrderSchema), paymentController.createPaymentOrder);
router.post('/verify', authenticateUser, validateBody(verifyPaymentSchema), paymentController.verifyPayment);

export default router;
