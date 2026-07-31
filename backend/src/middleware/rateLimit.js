const rateLimit = require('express-rate-limit');
const config = require('../config');

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });
}

const globalLimiter = createLimiter({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: 'Too many requests, please try again later',
});

const authLimiter = createLimiter({
  windowMs: config.rateLimitWindowMs,
  max: config.authRateLimitMax,
  message: 'Too many authentication attempts, please try again later',
});

module.exports = { globalLimiter, authLimiter };
