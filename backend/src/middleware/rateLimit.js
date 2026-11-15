'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMITED' },
  skip: () => config.isTest,
});

const aiLimiter = rateLimit({
  windowMs: config.rateLimit.aiWindowMs,
  max: config.rateLimit.aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ai:${req.user?.id || req.ip}`,
  message: { error: 'AI rate limit exceeded. Please wait before sending more requests.', code: 'AI_RATE_LIMITED' },
  skip: () => config.isTest,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts.', code: 'AUTH_RATE_LIMITED' },
  skip: () => config.isTest,
});

module.exports = { globalLimiter, aiLimiter, authLimiter };
