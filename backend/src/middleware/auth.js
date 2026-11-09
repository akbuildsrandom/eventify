import { verifyAccessToken } from '../utils/tokens.js';
import { sendError } from '../utils/apiResponse.js';
import prisma from '../config/prisma.js';

export const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Check Authorization header fallback
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', [], 401);
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return sendError(res, 'Session expired or invalid token. Please log in again.', [], 401);
    }

    // Verify user still exists in database and is not suspended
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        avatar: true,
        phone: true,
      },
    });

    if (!user) {
      return sendError(res, 'User account no longer exists', [], 401);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return sendError(res, 'Authentication failure', [error.message], 401);
  }
};

export const optionalAuthenticateUser = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isVerified: true,
            avatar: true,
          },
        });
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch {
    next();
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', [], 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Role "${req.user.role}" does not have required permissions.`,
        [],
        403
      );
    }

    next();
  };
};
