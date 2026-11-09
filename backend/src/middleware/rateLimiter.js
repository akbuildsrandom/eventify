import { cache } from '../config/redis.js';
import { sendError } from '../utils/apiResponse.js';

export const createRateLimiter = ({
  windowSeconds = 60,
  maxRequests = 60,
  prefix = 'rl',
  message = 'Too many requests. Please slow down and try again later.',
}) => {
  return async (req, res, next) => {
    try {
      // Use user ID if authenticated, else client IP address
      const identifier = req.user?.id || req.ip || req.headers['x-forwarded-for'] || 'anonymous';
      const key = `${prefix}:${identifier}`;

      const client = cache.client;
      const count = await client.incr(key);

      if (count === 1) {
        await client.expire(key, windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));

      if (count > maxRequests) {
        res.setHeader('Retry-After', windowSeconds);
        return sendError(res, message, [{ retryAfter: `${windowSeconds}s` }], 429);
      }

      next();
    } catch (err) {
      // Degrade gracefully if rate limiting hits an error
      console.warn(`[RateLimiter Warning] Error processing ${prefix}:`, err.message);
      next();
    }
  };
};

export const rateLimiters = {
  login: createRateLimiter({
    windowSeconds: 60,
    maxRequests: 10, // Generous for local development/testing, strict in prod
    prefix: 'rl:login',
    message: 'Too many login attempts. Please wait 1 minute before trying again.',
  }),
  register: createRateLimiter({
    windowSeconds: 600, // 10 minutes
    maxRequests: 15,
    prefix: 'rl:register',
    message: 'Too many account registrations from this IP. Please try again later.',
  }),
  search: createRateLimiter({
    windowSeconds: 60,
    maxRequests: 60,
    prefix: 'rl:search',
    message: 'Too many search queries. Please wait a moment.',
  }),
  booking: createRateLimiter({
    windowSeconds: 60,
    maxRequests: 20,
    prefix: 'rl:booking',
    message: 'Too many reservation attempts. Please wait 1 minute.',
  }),
  general: createRateLimiter({
    windowSeconds: 60,
    maxRequests: 200,
    prefix: 'rl:general',
    message: 'Request rate limit exceeded.',
  }),
};
