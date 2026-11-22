'use strict';

const crypto = require('node:crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function newCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * CSRF protection for admin writes (synchronizer token).
 * The token lives in the session and must come back in the X-CSRF-Token header.
 * Cookies are also SameSite=Strict, so this is a second layer.
 */
function csrfProtect(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const expected = req.session?.csrfToken;
  const given = req.get('x-csrf-token') || '';
  const ok =
    typeof expected === 'string' &&
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) {
    return res
      .status(403)
      .json({ error: 'csrf', message: 'Oturum doğrulanamadı. Sayfayı yenileyip tekrar deneyin.' });
  }
  return next();
}

/** Loads the logged-in user into req.user or answers 401. */
function requireAuth(repos) {
  return (req, res, next) => {
    const user = req.session?.userId ? repos.users.findById(req.session.userId) : null;
    if (!user) {
      return res.status(401).json({ error: 'unauthorized', message: 'Lütfen giriş yapın.' });
    }
    req.user = user;
    return next();
  };
}

/** Users with a one-time password must set their own password first. */
function requirePasswordChanged(req, res, next) {
  if (req.user.must_change_password) {
    return res.status(403).json({
      error: 'password_change_required',
      message: 'Devam etmeden önce kendi şifrenizi belirleyin.',
    });
  }
  return next();
}

/**
 * Resolves :slug and enforces tenant isolation: an owner can only touch their own site,
 * the superadmin (freelancer) can touch every site.
 */
function requireSiteAccess(repos) {
  return (req, res, next) => {
    const site = repos.sites.findBySlug(req.params.slug);
    const allowed =
      site && (req.user.role === 'superadmin' || Number(req.user.site_id) === Number(site.id));
    if (!allowed) {
      // Same answer for "does not exist" and "not yours": do not leak other customers.
      return res
        .status(403)
        .json({ error: 'forbidden', message: 'Bu siteye erişim yetkiniz yok.' });
    }
    req.site = site;
    return next();
  };
}

function requireSuperadmin(req, res, next) {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'forbidden', message: 'Bu işlem için yetkiniz yok.' });
  }
  return next();
}

module.exports = {
  newCsrfToken,
  csrfProtect,
  requireAuth,
  requirePasswordChanged,
  requireSiteAccess,
  requireSuperadmin,
};
