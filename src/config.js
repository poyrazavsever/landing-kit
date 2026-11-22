'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

/** Loads .env from the project root once (Node >= 20.12 has process.loadEnvFile). */
function loadEnvFile() {
  const file = path.join(ROOT, '.env');
  if (fs.existsSync(file) && typeof process.loadEnvFile === 'function') process.loadEnvFile(file);
}

const bool = (value, fallback = false) =>
  value === undefined || value === ''
    ? fallback
    : ['1', 'true', 'yes'].includes(String(value).toLowerCase());
const num = (value, fallback) =>
  Number.isFinite(Number(value)) && value !== '' ? Number(value) : fallback;

/**
 * Builds the runtime config from environment variables.
 * Tests pass overrides instead of touching process.env.
 */
function createConfig(overrides = {}) {
  const env = process.env;
  const isProduction = (overrides.env || env.NODE_ENV) === 'production';
  const dataDir = path.resolve(ROOT, overrides.dataDir || env.DATA_DIR || './data');
  const port = num(env.PORT, 3000);
  const publicUrl = (overrides.publicUrl || env.PUBLIC_URL || `http://localhost:${port}`).replace(
    /\/+$/,
    '',
  );

  const config = {
    root: ROOT,
    env: isProduction ? 'production' : env.NODE_ENV || 'development',
    isProduction,
    port,
    publicUrl,
    publicOrigin: new URL(publicUrl).origin,
    dataDir,
    dbFile: path.join(dataDir, 'landing-kit.sqlite'),
    uploadsDir: path.join(dataDir, 'uploads'),
    guidesDir: path.join(dataDir, 'guides'),
    sessionSecret: env.SESSION_SECRET || '',
    trustProxy: num(env.TRUST_PROXY, 0),
    serveExamples: bool(env.SERVE_EXAMPLES, !isProduction),
    rateLimits: {
      contact: {
        limit: num(env.CONTACT_RATE_LIMIT, 5),
        windowMin: num(env.CONTACT_RATE_WINDOW_MIN, 10),
      },
      login: {
        limit: num(env.LOGIN_RATE_LIMIT, 10),
        windowMin: num(env.LOGIN_RATE_WINDOW_MIN, 15),
      },
    },
    uploadMaxBytes: num(env.UPLOAD_MAX_MB, 5) * 1024 * 1024,
    smtp: {
      host: env.SMTP_HOST || '',
      port: num(env.SMTP_PORT, 587),
      secure: bool(env.SMTP_SECURE),
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      from: env.SMTP_FROM || 'landing-kit <no-reply@localhost>',
    },
    telegram: {
      botToken: env.TELEGRAM_BOT_TOKEN || '',
      defaultChatId: env.TELEGRAM_DEFAULT_CHAT_ID || '',
    },
    support: {
      name: env.SUPPORT_NAME || '',
      phone: env.SUPPORT_PHONE || '',
      email: env.SUPPORT_EMAIL || '',
    },
    pdfBrowserPath: env.PDF_BROWSER_PATH || '',
    ...overrides,
  };

  if (config.isProduction && (!config.sessionSecret || config.sessionSecret.length < 32)) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters in production.');
  }
  if (!config.sessionSecret) config.sessionSecret = 'dev-only-insecure-secret-change-me';
  return config;
}

module.exports = { createConfig, loadEnvFile, ROOT };
