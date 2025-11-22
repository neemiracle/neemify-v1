/**
 * @file Rate limiting middleware
 * @module middleware/rate-limit
 *
 * Implements rate limiting based on license features
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';

/**
 * Dynamic rate limiter based on license features
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: async (req: Request) => {
    // If authenticated, use license-specific rate limit
    if (req.context?.license?.features?.api_rate_limit) {
      return req.context.license.features.api_rate_limit;
    }
    // Default rate limit
    return config.rateLimit.maxRequests;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  keyGenerator: (req: Request) => {
    // Rate limit by user if authenticated, otherwise by IP
    return req.context?.user?.id || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
  skipSuccessfulRequests: true,
});
