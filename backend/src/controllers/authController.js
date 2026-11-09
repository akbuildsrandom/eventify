import { authService } from '../services/authService.js';
import { userService } from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

const isProd = env.NODE_ENV === 'production';

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  // Access token cookie (15m)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
  });

  // Refresh token cookie (7d)
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth' });
};

export const authController = {
  async register(req, res, next) {
    try {
      const { user, verifyToken } = await authService.register(req.body);
      return sendSuccess(
        res,
        'Registration successful! Please check your email to verify your account.',
        { user, verifyToken: env.NODE_ENV === 'development' ? verifyToken : undefined },
        201
      );
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body);
      setAuthCookies(res, { accessToken, refreshToken });
      return sendSuccess(res, 'Login successful', { user, accessToken });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const data = await authService.refreshTokens(rawRefreshToken);
      setAuthCookies(res, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      return sendSuccess(res, 'Token refreshed successfully', {
        user: data.user,
        accessToken: data.accessToken,
      });
    } catch (err) {
      clearAuthCookies(res);
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
      await authService.logout(rawRefreshToken);
      clearAuthCookies(res);
      return sendSuccess(res, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user.id);
      return sendSuccess(res, 'User profile retrieved', { user: profile });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const updated = await userService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, 'Profile updated successfully', { user: updated });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      await userService.changePassword(req.user.id, req.body);
      return sendSuccess(res, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      await authService.forgotPassword(req.body.email);
      return sendSuccess(res, 'If that email exists, a password reset link has been sent');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      await authService.resetPassword(req.body);
      return sendSuccess(res, 'Password has been reset successfully. You may now log in.');
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const token = req.query.token || req.body.token;
      if (!token) {
        return sendError(res, 'Verification token is required', [], 400);
      }
      await authService.verifyEmail(token);
      return sendSuccess(res, 'Email verified successfully! You can now log in.');
    } catch (err) {
      next(err);
    }
  },
};
