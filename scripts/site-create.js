'use strict';

/**
 * Creates a new customer site and its owner account.
 *
 *   npm run site:create -- --slug berber-ahmet --name "Berber Ahmet" --email sahibi@ornek.com
 *
 * Optional: --domains berberahmet.com,www.berberahmet.com --collections services,campaigns
 *           --phone "0555 123 45 67" --whatsapp "0555 123 45 67" --address "..."
 *           --primary "#0F766E" --secondary "#F59E0B" --font "Poppins" --logo ./logo.png
 *           --no-guide (skip the PDF guide)
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { boot, args, fail, list } = require('./_cli');
const { isSlug, isEmail, isPhone, isColor, isFont, isCollection } = require('../src/lib/validate');
const { generatePassword } = require('../src/db/repo/users');

const opts = args({
  slug: { type: 'string' },
  name: { type: 'string' },
  email: { type: 'string' },
  domains: { type: 'string' },
  collections: { type: 'string' },
  phone: { type: 'string' },
  whatsapp: { type: 'string' },
  address: { type: 'string' },
  primary: { type: 'string' },
  secondary: { type: 'string' },
  font: { type: 'string' },
  logo: { type: 'string' },
  'no-guide': { type: 'boolean', default: false },
});

if (!isSlug(opts.slug)) fail('--slug zorunlu: küçük harf, rakam ve tire (ör. berber-ahmet).');
if (!opts.name) fail('--name zorunlu (ör. --name "Berber Ahmet").');
if (!isEmail(opts.email)) fail('--email zorunlu ve geçerli olmalı (işletme sahibinin giriş adresi).');
for (const key of ['phone', 'whatsapp']) {
  if (opts[key] && !isPhone(opts[key])) fail(`--${key} geçersiz.`);
}
for (const key of ['primary', 'secondary']) {
  if (opts[key] && !isColor(opts[key])) fail(`--${key} #RRGGBB biçiminde olmalı.`);
}
if (opts.font && !isFont(opts.font)) fail('--font geçersiz.');
const collections = opts.collections ? list(opts.collections) : ['menu', 'campaigns'];
if (!collections.every(isCollection)) fail('--collections sadece küçük harf, rakam, - ve _ içerebilir.');

const { config, db, repos } = boot();

if (repos.sites.findBySlug(opts.slug)) fail(`"${opts.slug}" adlı bir site zaten var.`);
if (repos.users.findByEmail(opts.email)) fail(`${opts.email} adresiyle bir kullanıcı zaten var.`);

function copyLogo(file, slug) {
  if (!file) return null;
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) fail('--logo PNG, JPG, WEBP veya SVG olmalı.');
  if (!fs.existsSync(file)) fail(`Logo dosyası bulunamadı: ${file}`);
  const dir = path.join(config.uploadsDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  const name = `logo-${crypto.randomBytes(4).toString('hex')}${ext === '.jpeg' ? '.jpg' : ext}`;
  fs.copyFileSync(file, path.join(dir, name));
  return `/uploads/${slug}/${name}`;
}

const password = generatePassword();
const site = db.transaction(() => {
  const created = repos.sites.create({
    slug: opts.slug,
    name: opts.name,
    domains: list(opts.domains),
    contact_email: opts.email,
    phone: opts.phone,
    whatsapp: opts.whatsapp,
    address: opts.address,
    collections,
    color_primary: opts.primary,
    color_secondary: opts.secondary,
    font_family: opts.font,
    logo_path: copyLogo(opts.logo, opts.slug),
  });
  repos.users.create({ email: opts.email, password, role: 'owner', siteId: created.id, mustChange: true });
  return created;
})();

const adminUrl = `${config.publicUrl}/admin/${site.slug}`;
console.log(`
  ✓ Site oluşturuldu: ${site.name} (${site.slug})

  Panel adresi : ${adminUrl}
  Kullanıcı    : ${opts.email}
  Geçici şifre : ${password}
  (Bu şifre bir kez gösterilir. İlk girişte işletme sahibi kendi şifresini belirler.)

  Sayfaya eklenecek satır:
  <script src="${config.publicUrl}/landing-kit.js" data-site="${site.slug}" defer></script>
`);
if (!site.domains.length) {
  console.log('  Not: --domains vermediniz. Sitenin alan adını eklemezseniz form başka alan adından çalışmaz.');
  console.log(`  Sonradan eklemek için: npm run site:update -- --slug ${site.slug} --domains alanadi.com\n`);
}

db.close();

if (!opts['no-guide']) {
  Promise.resolve()
    .then(() => require('../src/guide/pdf').generateGuide({ slug: site.slug, username: opts.email }))
    .then((file) => console.log(`  PDF rehber: ${file}\n`))
    .catch((err) => {
      console.warn(`  PDF rehber oluşturulamadı (${err.message}).`);
      console.warn(`  Daha sonra deneyin: npm run guide:pdf -- --slug ${site.slug}\n`);
    });
}
