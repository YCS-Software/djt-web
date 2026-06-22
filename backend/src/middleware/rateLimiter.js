/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Default rate limiter for API endpoints
 */
const defaultLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json(options.message);
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
    });
    res.status(429).json(options.message);
  },
});

/**
 * Rate limiter for report generation
 */
const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many report requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for webhook endpoints
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many webhook requests',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = defaultLimiter;
module.exports.authLimiter = authLimiter;
module.exports.reportLimiter = reportLimiter;
module.exports.webhookLimiter = webhookLimiter;
