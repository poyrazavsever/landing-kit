'use strict';

/**
 * "Şifremi unuttum" flow: the business owner calls the freelancer, who runs
 *
 *   npm run user:reset -- --email sahibi@ornek.com
 *
 * and reads the new one-time password to them. Existing sessions of that user are ended.
 */
const { boot, args, fail } = require('./_cli');
const { generatePassword } = require('../src/db/repo/users');

const opts = args({ email: { type: 'string' } });
if (!opts.email) fail('--email zorunlu.');

const { config, db, repos } = boot();
const user = repos.users.findByEmail(opts.email);
if (!user) fail(`Kullanıcı bulunamadı: ${opts.email}`);

const password = generatePassword();
repos.users.setPassword(user.id, password, { mustChange: true });
// End all sessions of this user (sessions store the user id inside JSON data).
const removed = db
  .prepare("DELETE FROM sessions WHERE json_extract(data, '$.userId') = ?")
  .run(user.id).changes;
const site = user.site_id ? repos.sites.findById(user.site_id) : null;
db.close();

console.log(`
  ✓ Şifre sıfırlandı (${removed} açık oturum kapatıldı)

  Panel        : ${config.publicUrl}/admin/${site ? site.slug : ''}
  Kullanıcı    : ${user.email}
  Geçici şifre : ${password}
  (İlk girişte yeni şifre belirlenecek.)
`);
