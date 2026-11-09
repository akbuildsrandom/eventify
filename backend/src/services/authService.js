import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateRandomToken,
  hashToken,
} from '../utils/tokens.js';
import { sendEmail } from '../config/resend.js';
import { env } from '../config/env.js';

export const authService = {
  async register({ name, email, password, role = 'CUSTOMER', phone }) {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      const err = new Error('An account with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        phone,
        isVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        phone: true,
        createdAt: true,
      },
    });

    // Create Email Verification Token
    const { token: verifyToken, tokenHash } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send Verification Email
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your Eventify account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #6d28d9;">Welcome to Eventify, ${user.name}!</h2>
          <p>Thank you for joining Eventify. Please verify your email address by clicking the button below:</p>
          <p style="margin: 32px 0;">
            <a href="${verifyUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Verify Email Address
            </a>
          </p>
          <p style="color: #64748b; font-size: 14px;">This link will expire in 24 hours.</p>
        </div>
      `,
    });

    return { user, verifyToken };
  },

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const { token: rawRefreshToken, tokenHash } = generateRefreshToken();

    // Store hashed refresh token in database (7-day expiry)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
      phone: user.phone,
    };

    return {
      user: userPayload,
      accessToken,
      refreshToken: rawRefreshToken,
    };
  },

  async refreshTokens(rawRefreshToken) {
    if (!rawRefreshToken) {
      const err = new Error('Refresh token is required');
      err.statusCode = 401;
      throw err;
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || new Date() > storedToken.expiresAt) {
      const err = new Error('Refresh token expired or revoked. Please log in again.');
      err.statusCode = 401;
      throw err;
    }

    // Revoke used token (Refresh Token Rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new token pair
    const user = storedToken.user;
    const newAccessToken = generateAccessToken(user);
    const { token: newRawRefreshToken, tokenHash: newHash } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
      },
    };
  },

  async logout(rawRefreshToken) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return true;
  },

  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return true to avoid user enumeration
      return true;
    }

    const { token: rawToken, tokenHash } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your Eventify password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #6d28d9;">Reset Password Request</h2>
          <p>We received a request to reset your password. Click the button below to choose a new password:</p>
          <p style="margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return true;
  },

  async resetPassword({ token, password }) {
    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord || resetRecord.usedAt || new Date() > resetRecord.expiresAt) {
      const err = new Error('Invalid or expired password reset token');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all existing refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return true;
  },

  async verifyEmail(token) {
    const tokenHash = hashToken(token);
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || new Date() > record.expiresAt) {
      const err = new Error('Invalid or expired email verification token');
      err.statusCode = 400;
      throw err;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { isVerified: true },
      }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return true;
  },
};
