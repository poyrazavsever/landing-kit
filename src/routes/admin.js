'use strict';

const express = require('express');
const { loginLimiter } = require('../middleware/rate-limit');
const {
  newCsrfToken,
  csrfProtect,
  requireAuth,
  requirePasswordChanged,
  requireSiteAccess,
  requireSuperadmin,
} = require('../middleware/auth');
const { verifyPassword } = require('../db/repo/users');
const { toItemDto } = require('../db/repo/items');
const { toMessageDto } = require('../db/repo/messages');
const { siteTheme } = require('../db/repo/sites');
const { parseItemInput, parseSiteInput } = require('../lib/admin-input');
const { imageUpload, saveImage, removeImage, UploadError } = require('../lib/upload');
const { str, isCollection, ValidationError } = require('../lib/validate');
const { collectionLabel, BRAND } = require('../lib/defaults');

const MIN_PASSWORD = 8;

function toUserDto(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    mustChangePassword: user.must_change_password === 1,
  };
}

function toAdminSite(site, repos) {
  const counts = Object.fromEntries(
    repos.items.countsByCollection(site.id).map((row) => [row.collection, row]),
  );
  // Collections defined on the site plus any that only exist as data.
  const keys = [...site.collections.map((c) => c.key)];
  Object.keys(counts).forEach((key) => !keys.includes(key) && keys.push(key));
  return {
    id: site.id,
    slug: site.slug,
    name: site.name,
    phone: site.phone,
    whatsapp: site.whatsapp,
    contact_email: site.contact_email,
    address: site.address,
    opening_hours: site.opening_hours,
    hours_note: site.hours_note,
    domains: site.domains,
    telegram_chat_id: site.telegram_chat_id,
    theme: siteTheme(site, BRAND),
    collections: keys.map((key) => ({
      key,
      label: site.collections.find((c) => c.key === key)?.label || collectionLabel(key),
      total: counts[key]?.total || 0,
      active: counts[key]?.active || 0,
    })),
    unreadMessages: repos.messages.unreadCount(site.id),
  };
}

function adminRoutes({ repos, config }) {
  const router = express.Router();
  const auth = requireAuth(repos);
  const siteAccess = requireSiteAccess(repos);
  const upload = imageUpload(config);

  // ---- Session ----------------------------------------------------------

  router.post('/login', loginLimiter(config), (req, res, next) => {
    const email = str(req.body?.email)?.toLowerCase();
    const password = req.body?.password;
    const user = email ? repos.users.findByEmail(email) : null;
    if (!verifyPassword(user, password)) {
      return res
        .status(401)
        .json({ error: 'invalid_login', message: 'E-posta ya da şifre hatalı.' });
    }
    // New session id on login (prevents session fixation).
    return req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.csrfToken = newCsrfToken();
      repos.users.touchLogin(user.id);
      const site = user.site_id ? repos.sites.findById(user.site_id) : null;
      return res.json({
        user: toUserDto(user),
        site: site ? site.slug : null,
        csrfToken: req.session.csrfToken,
      });
    });
  });

  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('lk.sid', { path: '/admin' });
      res.json({ ok: true });
    });
  });

  router.get('/me', auth, (req, res) => {
    if (!req.session.csrfToken) req.session.csrfToken = newCsrfToken();
    const sites =
      req.user.role === 'superadmin'
        ? repos.sites.list().map((s) => ({ slug: s.slug, name: s.name }))
        : [repos.sites.findById(req.user.site_id)]
            .filter(Boolean)
            .map((s) => ({ slug: s.slug, name: s.name }));
    res.json({ user: toUserDto(req.user), sites, csrfToken: req.session.csrfToken });
  });

  router.post('/password', auth, csrfProtect, (req, res) => {
    const { current, next: nextPassword } = req.body || {};
    if (!verifyPassword(req.user, current)) {
      throw new ValidationError({ current: 'Mevcut şifre hatalı.' });
    }
    if (
      typeof nextPassword !== 'string' ||
      nextPassword.length < MIN_PASSWORD ||
      nextPassword.length > 200
    ) {
      throw new ValidationError({ next: `Yeni şifre en az ${MIN_PASSWORD} karakter olmalı.` });
    }
    if (nextPassword === current) {
      throw new ValidationError({ next: 'Yeni şifre eskisiyle aynı olamaz.' });
    }
    repos.users.setPassword(req.user.id, nextPassword, { mustChange: false });
    res.json({ ok: true });
  });

  // Everything below needs a logged-in user with their own password.
  router.use(auth, requirePasswordChanged, csrfProtect);

  router.get('/sites', requireSuperadmin, (_req, res) => {
    res.json({ sites: repos.sites.list().map((s) => toAdminSite(s, repos)) });
  });

  // ---- Site info ----------------------------------------------------------

  router.get('/sites/:slug', siteAccess, (req, res) => res.json(toAdminSite(req.site, repos)));

  router.patch('/sites/:slug', siteAccess, (req, res) => {
    const fields = parseSiteInput(req.body, { superadmin: req.user.role === 'superadmin' });
    const site = repos.sites.update(req.site.id, fields);
    res.json(toAdminSite(site, repos));
  });

  // ---- Items --------------------------------------------------------------

  router.get('/sites/:slug/items', siteAccess, (req, res) => {
    const collection = String(req.query.collection || '');
    if (!isCollection(collection)) throw new ValidationError({ collection: 'Bölüm adı geçersiz.' });
    const items = repos.items
      .listAll(req.site.id, collection)
      .map((row) => toItemDto(row, { admin: true }));
    res.json({ collection, items });
  });

  router.post('/sites/:slug/items', siteAccess, (req, res) => {
    const data = parseItemInput(req.body);
    const item = repos.items.create(req.site.id, data);
    // A new collection key becomes a real section of the site automatically.
    if (!req.site.collections.some((c) => c.key === data.collection)) {
      repos.sites.update(req.site.id, { collections: [...req.site.collections, data.collection] });
    }
    res.status(201).json(toItemDto(item, { admin: true }));
  });

  router.patch('/sites/:slug/items/:id', siteAccess, (req, res) => {
    const existing = repos.items.find(req.site.id, Number(req.params.id));
    if (!existing)
      return res.status(404).json({ error: 'not_found', message: 'Kayıt bulunamadı.' });
    const fields = parseItemInput(req.body, { partial: true });
    delete fields.collection; // moving between collections is not supported
    const item = repos.items.update(req.site.id, existing.id, fields);
    if ('image' in fields && existing.image && existing.image !== fields.image) {
      removeImage(config, req.site.slug, existing.image);
    }
    return res.json(toItemDto(item, { admin: true }));
  });

  router.delete('/sites/:slug/items/:id', siteAccess, (req, res) => {
    const existing = repos.items.find(req.site.id, Number(req.params.id));
    if (!existing)
      return res.status(404).json({ error: 'not_found', message: 'Kayıt bulunamadı.' });
    repos.items.remove(req.site.id, existing.id);
    if (existing.image) removeImage(config, req.site.slug, existing.image);
    return res.json({ ok: true });
  });

  router.post('/sites/:slug/items/reorder', siteAccess, (req, res) => {
    const { collection, ids } = req.body || {};
    if (
      !isCollection(collection) ||
      !Array.isArray(ids) ||
      ids.length > 1000 ||
      !ids.every(Number.isInteger)
    ) {
      throw new ValidationError({ ids: 'Sıralama bilgisi geçersiz.' });
    }
    const items = repos.items.reorder(req.site.id, collection, ids);
    res.json({ collection, items: items.map((row) => toItemDto(row, { admin: true })) });
  });

  // ---- Uploads ------------------------------------------------------------

  router.post('/sites/:slug/uploads', siteAccess, (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const mb = Math.round(config.uploadMaxBytes / 1024 / 1024);
          return res
            .status(413)
            .json({ error: 'too_large', message: `Fotoğraf en fazla ${mb} MB olabilir.` });
        }
        if (err instanceof UploadError)
          return res.status(err.status).json({ error: err.code, message: err.message });
        return next(err);
      }
      try {
        const path = saveImage(config, req.site.slug, req.file);
        return res.status(201).json({ path });
      } catch (saveErr) {
        if (saveErr instanceof UploadError) {
          return res.status(saveErr.status).json({ error: saveErr.code, message: saveErr.message });
        }
        return next(saveErr);
      }
    });
  });

  // ---- Messages -----------------------------------------------------------

  router.get('/sites/:slug/messages', siteAccess, (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    res.json({
      unread: repos.messages.unreadCount(req.site.id),
      messages: repos.messages.list(req.site.id, { limit, offset }).map(toMessageDto),
    });
  });

  router.patch('/sites/:slug/messages/:id', siteAccess, (req, res) => {
    const ok = repos.messages.setRead(req.site.id, Number(req.params.id), Boolean(req.body?.read));
    if (!ok) return res.status(404).json({ error: 'not_found', message: 'Mesaj bulunamadı.' });
    return res.json(toMessageDto(repos.messages.find(req.site.id, Number(req.params.id))));
  });

  router.delete('/sites/:slug/messages/:id', siteAccess, (req, res) => {
    const ok = repos.messages.remove(req.site.id, Number(req.params.id));
    if (!ok) return res.status(404).json({ error: 'not_found', message: 'Mesaj bulunamadı.' });
    return res.json({ ok: true });
  });

  return router;
}

module.exports = { adminRoutes };
