'use strict';

/**
 * Creates the freelancer's superadmin account (sees and manages every site).
 *
 *   npm run admin:create -- --email ben@ornek.com
 */
const { boot, args, fail } = require('./_cli');
const { isEmail } = require('../src/lib/validate');
const { generatePassword } = require('../src/db/repo/users');

const opts = args({ email: { type: 'string' } });
if (!isEmail(opts.email)) fail('--email zorunlu ve geçerli olmalı.');

const { config, db, repos } = boot();
if (repos.users.findByEmail(opts.email)) fail(`${opts.email} adresiyle bir kullanıcı zaten var.`);

const password = generatePassword(16);
repos.users.create({ email: opts.email, password, role: 'superadmin', mustChange: true });
db.close();

console.log(`
  ✓ Yönetici hesabı oluşturuldu

  Panel        : ${config.publicUrl}/admin/
  Kullanıcı    : ${opts.email}
  Geçici şifre : ${password}
  (İlk girişte kendi şifrenizi belirleyeceksiniz.)
`);
