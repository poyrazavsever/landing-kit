'use strict';

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const { publicRoutes } = require('./routes/public');
const { adminRoutes } = require('./routes/admin');
const { SqliteSessionStore } = require('./lib/session-store');
const { ValidationError } = require('./lib/validate');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');

/**
 * Builds the Express app. Everything it needs is injected so tests can run it
 * against an in-memory database without a network port.
 */
function createApp({ repos, config, notifier, logger = console }) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      // Images and the snippet are embedded on customer domains.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'connect-src': ["'self'"],
        },
      },
    }),
  );
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));

  app.get('/healthz', (_req, res) => {
    try {
      repos.db.prepare('SELECT 1').get();
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  app.use('/api', publicRoutes({ repos, config, notifier, logger }));

  // Admin API: cookie session stored in SQLite.
  app.use(
    '/admin/api',
    session({
      name: 'lk.sid',
      secret: config.sessionSecret,
      store: new SqliteSessionStore(repos.db),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/admin',
      },
    }),
    (_req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    },
    adminRoutes({ repos, config }),
  );

  // Admin panel (static SPA). /admin/<slug> serves the same page branded for that site.
  app.use('/admin', express.static(path.join(PUBLIC_DIR, 'admin'), { index: 'index.html' }));
  app.get('/admin/:slug', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin', 'index.html')));

  // The dependency-free client snippet.
  app.get('/landing-kit.js', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.sendFile(path.join(PUBLIC_DIR, 'landing-kit.js'));
  });

  app.use(
    '/uploads',
    express.static(config.uploadsDir, {
      maxAge: '7d',
      immutable: true,
      fallthrough: false,
      setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
    }),
  );

  if (config.serveExamples) app.use('/examples', express.static(EXAMPLES_DIR));

  app.get('/', (_req, res) => res.redirect('/admin/'));

  app.use((req, res) => res.status(404).json({ error: 'not_found', message: 'Bulunamadı.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err instanceof ValidationError) {
      return res
        .status(400)
        .json({ error: 'validation', message: 'Lütfen hataları düzeltin.', errors: err.errors });
    }
    if (err.status === 404 || err.statusCode === 404) {
      return res.status(404).json({ error: 'not_found', message: 'Bulunamadı.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'too_large', message: 'İstek çok büyük.' });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'bad_json', message: 'Geçersiz istek.' });
    }
    logger.error?.(err);
    return res.status(500).json({ error: 'server_error', message: 'Beklenmeyen bir hata oluştu.' });
  });

  return app;
}

module.exports = { createApp };
