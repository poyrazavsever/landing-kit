'use strict';

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

function limiter({ limit, windowMin }, message, keyExtra = () => '') {
  return rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // ip + optional extra (site slug) so one busy site does not block another
    keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${keyExtra(req)}`,
    handler: (_req, res) => res.status(429).json({ error: 'rate_limited', message }),
  });
}

function contactLimiter(config) {
  return limiter(
    config.rateLimits.contact,
    'Çok fazla mesaj gönderildi. Lütfen biraz sonra tekrar deneyin.',
    (req) => req.params.slug,
  );
}

function loginLimiter(config) {
  return limiter(
    config.rateLimits.login,
    'Çok fazla giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.',
  );
}

module.exports = { contactLimiter, loginLimiter };
