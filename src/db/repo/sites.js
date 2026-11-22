'use strict';

const { collectionLabel, defaultHours } = require('../../lib/defaults');

const parseJson = (text, fallback) => {
  try {
    return JSON.parse(text) ?? fallback;
  } catch {
    return fallback;
  }
};

function hydrate(row) {
  if (!row) return null;
  return {
    ...row,
    domains: parseJson(row.domains, []),
    opening_hours: parseJson(row.opening_hours, []),
    collections: parseJson(row.collections, []),
  };
}

const UPDATABLE = [
  'name',
  'domains',
  'contact_email',
  'whatsapp',
  'phone',
  'address',
  'opening_hours',
  'hours_note',
  'collections',
  'telegram_chat_id',
  'logo_path',
  'color_primary',
  'color_secondary',
  'font_family',
];
const JSON_COLUMNS = new Set(['domains', 'opening_hours', 'collections']);

function normalizeCollections(list) {
  return list.map((entry) =>
    typeof entry === 'string' ? { key: entry, label: collectionLabel(entry) } : entry,
  );
}

function sitesRepo(db) {
  const bySlug = db.prepare('SELECT * FROM sites WHERE slug = ?');
  const byId = db.prepare('SELECT * FROM sites WHERE id = ?');

  return {
    findBySlug: (slug) => hydrate(bySlug.get(slug)),
    findById: (id) => hydrate(byId.get(id)),
    list: () => db.prepare('SELECT * FROM sites ORDER BY name').all().map(hydrate),

    create(data) {
      const info = db
        .prepare(
          `INSERT INTO sites (slug, name, domains, contact_email, whatsapp, phone, address,
             opening_hours, collections, logo_path, color_primary, color_secondary, font_family)
           VALUES (@slug, @name, @domains, @contact_email, @whatsapp, @phone, @address,
             @opening_hours, @collections, @logo_path, @color_primary, @color_secondary, @font_family)`,
        )
        .run({
          slug: data.slug,
          name: data.name,
          domains: JSON.stringify(data.domains || []),
          contact_email: data.contact_email || null,
          whatsapp: data.whatsapp || null,
          phone: data.phone || null,
          address: data.address || null,
          opening_hours: JSON.stringify(data.opening_hours || defaultHours()),
          collections: JSON.stringify(normalizeCollections(data.collections || ['menu', 'campaigns'])),
          logo_path: data.logo_path || null,
          color_primary: data.color_primary || null,
          color_secondary: data.color_secondary || null,
          font_family: data.font_family || null,
        });
      return this.findById(info.lastInsertRowid);
    },

    /** Updates only whitelisted columns. JSON columns are serialized here. */
    update(id, fields) {
      const entries = Object.entries(fields).filter(([key]) => UPDATABLE.includes(key));
      if (entries.length === 0) return this.findById(id);
      const params = { id };
      const sets = entries.map(([key, value]) => {
        if (key === 'collections') value = normalizeCollections(value);
        params[key] = JSON_COLUMNS.has(key) ? JSON.stringify(value) : value === '' ? null : value;
        return `${key} = @${key}`;
      });
      db.prepare(
        `UPDATE sites SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = @id`,
      ).run(params);
      return this.findById(id);
    },

    remove: (id) => db.prepare('DELETE FROM sites WHERE id = ?').run(id).changes > 0,
  };
}

/** Theme with landing-kit defaults applied where the site has none. */
function siteTheme(site, brand) {
  return {
    logo: site.logo_path || null,
    primary: site.color_primary || brand.primary,
    secondary: site.color_secondary || brand.secondary,
    font: site.font_family || brand.font,
  };
}

/** The subset of a site that is safe to expose on the public API. */
function toPublicSite(site) {
  return {
    slug: site.slug,
    name: site.name,
    phone: site.phone,
    whatsapp: site.whatsapp,
    email: site.contact_email,
    address: site.address,
    hours: site.opening_hours,
    hoursNote: site.hours_note,
    collections: site.collections,
    theme: {
      logo: site.logo_path,
      primary: site.color_primary,
      secondary: site.color_secondary,
      font: site.font_family,
    },
  };
}

module.exports = { sitesRepo, toPublicSite, siteTheme };
