'use strict';

/**
 * Per-site CORS allow-list.
 *
 * sites.domains entries can be a bare host ("berberahmet.com", allows https://berberahmet.com and
 * https://www.berberahmet.com) or a full origin ("http://localhost:5500", matched exactly).
 * The install's own PUBLIC_URL origin is always allowed (examples, admin preview).
 */
function allowedOrigins(site, config) {
  const origins = new Set([config.publicOrigin]);
  for (const raw of site.domains || []) {
    const entry = String(raw).trim().toLowerCase().replace(/\/+$/, '');
    if (!entry) continue;
    if (/^https?:\/\//.test(entry)) {
      try {
        origins.add(new URL(entry).origin);
      } catch {
        // ignore malformed entries
      }
    } else {
      const host = entry.replace(/^www\./, '');
      origins.add(`https://${host}`);
      origins.add(`https://www.${host}`);
    }
  }
  return origins;
}

function isOriginAllowed(site, origin, config) {
  return allowedOrigins(site, config).has(String(origin).toLowerCase());
}

/**
 * Loads :slug into req.site (404 if unknown) and applies CORS headers for allowed origins.
 * Disallowed origins get no CORS headers (the browser blocks the read) and writes are refused.
 */
function siteCors({ repos, config }) {
  return (req, res, next) => {
    const site = repos.sites.findBySlug(req.params.slug);
    if (!site) return res.status(404).json({ error: 'site_not_found', message: 'Site bulunamadı.' });
    req.site = site;

    const origin = req.get('origin');
    res.vary('Origin');
    if (!origin) return next();

    const allowed = isOriginAllowed(site, origin, config);
    if (allowed) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.status(allowed ? 204 : 403).end();
    if (!allowed && req.method !== 'GET' && req.method !== 'HEAD') {
      return res
        .status(403)
        .json({ error: 'origin_not_allowed', message: 'Bu alan adından istek kabul edilmiyor.' });
    }
    return next();
  };
}

module.exports = { siteCors, allowedOrigins, isOriginAllowed };
