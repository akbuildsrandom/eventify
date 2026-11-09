import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  // Prisma Unique Constraint Violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target || ['field'];
    return sendError(
      res,
      `A record with this ${Array.isArray(fields) ? fields.join(', ') : fields} already exists`,
      [{ code: err.code, fields }],
      409
    );
  }

  // Prisma Record Not Found
  if (err.code === 'P2025') {
    return sendError(res, 'The requested resource was not found', [], 404);
  }

  // Prisma Foreign Key Constraint Failure
  if (err.code === 'P2003') {
    return sendError(res, 'Related record was not found or invalid reference', [], 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token', [], 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired', [], 401);
  }

  // Custom HTTP status if provided
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  const errors = env.NODE_ENV === 'development' ? [{ stack: err.stack }] : [];

  return sendError(res, message, errors, statusCode);
};

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, [], 404);
};
