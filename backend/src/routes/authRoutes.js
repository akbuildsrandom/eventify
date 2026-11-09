import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/authValidator.js';

const router = Router();

router.post('/register', rateLimiters.register, validateBody(registerSchema), authController.register);
router.post('/login', rateLimiters.login, validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticateUser, authController.getMe);
router.put('/profile', authenticateUser, validateBody(updateProfileSchema), authController.updateProfile);
router.put('/change-password', authenticateUser, validateBody(changePasswordSchema), authController.changePassword);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

export default router;
