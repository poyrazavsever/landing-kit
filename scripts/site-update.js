'use strict';

/**
 * Updates technical settings of an existing site (things the owner cannot change).
 *
 *   npm run site:update -- --slug berber-ahmet --domains berberahmet.com --primary "#0F766E"
 *   npm run site:update -- --slug berber-ahmet --collections services,campaigns,gallery
 *   npm run site:update -- --slug berber-ahmet --telegram 123456789
 */
const { boot, args, fail, list } = require('./_cli');
const { parseSiteInput } = require('../src/lib/admin-input');

const opts = args({
  slug: { type: 'string' },
  name: { type: 'string' },
  domains: { type: 'string' },
  collections: { type: 'string' },
  primary: { type: 'string' },
  secondary: { type: 'string' },
  font: { type: 'string' },
  logo: { type: 'string' },
  telegram: { type: 'string' },
  email: { type: 'string' },
});

const { db, repos } = boot();
const site = repos.sites.findBySlug(opts.slug || '');
if (!site) fail(`Site bulunamadı: ${opts.slug}`);

const body = {};
if (opts.name !== undefined) body.name = opts.name;
if (opts.domains !== undefined) body.domains = list(opts.domains);
if (opts.collections !== undefined) body.collections = list(opts.collections);
if (opts.primary !== undefined) body.color_primary = opts.primary;
if (opts.secondary !== undefined) body.color_secondary = opts.secondary;
if (opts.font !== undefined) body.font_family = opts.font;
if (opts.logo !== undefined) body.logo_path = opts.logo;
if (opts.telegram !== undefined) body.telegram_chat_id = opts.telegram;
if (opts.email !== undefined) body.contact_email = opts.email;
if (!Object.keys(body).length) fail('Değiştirilecek bir alan verin (ör. --domains, --primary).');

try {
  const fields = parseSiteInput(body, { superadmin: true });
  const updated = repos.sites.update(site.id, fields);
  console.log(`\n  ✓ ${updated.name} güncellendi: ${Object.keys(fields).join(', ')}\n`);
} catch (err) {
  fail(err.errors ? Object.values(err.errors).join(' ') : err.message);
} finally {
  db.close();
}
