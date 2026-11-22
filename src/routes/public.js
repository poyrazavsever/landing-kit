'use strict';

const express = require('express');
const { siteCors, isOriginAllowed } = require('../middleware/site-cors');
const { contactLimiter } = require('../middleware/rate-limit');
const { toPublicSite } = require('../db/repo/sites');
const { toItemDto } = require('../db/repo/items');
const { isCollection } = require('../lib/validate');
const { parseContact } = require('../lib/contact');

/** True for classic <form> posts (no JavaScript), so we can redirect instead of returning JSON. */
const wantsRedirect = (req) =>
  req.is('application/x-www-form-urlencoded') &&
  !String(req.get('accept')).includes('application/json');

function publicRoutes({ repos, config, notifier, logger }) {
  /** Redirect target for no-JS posts; only origins in the site's allow-list (no open redirect). */
  function backTo(req, status) {
    const target = req.body?.redirect || req.get('referer');
    try {
      const url = new URL(target);
      if (!isOriginAllowed(req.site, url.origin, config)) return null;
      url.hash = `lk-${status}`;
      return url.toString();
    } catch {
      return null;
    }
  }

  const router = express.Router();
  const withSite = siteCors({ repos, config });

  router.options('/sites/:slug{/*rest}', withSite);

  router.get('/sites/:slug', withSite, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.json(toPublicSite(req.site));
  });

  router.get('/sites/:slug/items', withSite, (req, res) => {
    const collection = String(req.query.collection || '');
    if (!isCollection(collection)) {
      return res
        .status(400)
        .json({ error: 'invalid_collection', message: 'collection parametresi geçersiz.' });
    }
    res.set('Cache-Control', 'no-cache');
    const items = repos.items.listActive(req.site.id, collection).map((row) => toItemDto(row));
    res.json({ collection, items });
  });

  router.post('/sites/:slug/contact', withSite, contactLimiter(config), (req, res) => {
    const result = parseContact(req.body);

    // Honeypot: pretend success so bots learn nothing, but store and notify nothing.
    if (result.spam) {
      logger.info?.(`[contact] honeypot hit on ${req.site.slug}`);
      return wantsRedirect(req) && backTo(req, 'sent')
        ? res.redirect(303, backTo(req, 'sent'))
        : res.status(201).json({ ok: true });
    }
    if (result.errors) {
      if (wantsRedirect(req) && backTo(req, 'error'))
        return res.redirect(303, backTo(req, 'error'));
      return res.status(400).json({
        error: 'validation',
        message: 'Lütfen formdaki hataları düzeltin.',
        errors: result.errors,
      });
    }

    const message = repos.messages.create(req.site.id, result.data);
    // Notifications run in the background; a broken SMTP must not lose the message.
    notifier.notifyNewMessage(req.site, message).catch((err) => logger.error?.(err));

    if (wantsRedirect(req) && backTo(req, 'sent')) return res.redirect(303, backTo(req, 'sent'));
    return res.status(201).json({ ok: true, message: 'Mesajınız iletildi. Teşekkürler!' });
  });

  return router;
}

module.exports = { publicRoutes };
