'use strict';

require('./helpers');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { migrate } = require('../src/db/migrate');
const { parsePrice, isSlug, isChecked } = require('../src/lib/validate');
const { createNotifier, loadChannels } = require('../src/notify');
const { allowedOrigins } = require('../src/middleware/site-cors');
const { guideBodyHtml } = require('../src/guide/pdf');

test('parsePrice handles Turkish and plain formats', () => {
  assert.equal(parsePrice('150'), 15000);
  assert.equal(parsePrice('149,90'), 14990);
  assert.equal(parsePrice('149.90'), 14990);
  assert.equal(parsePrice('1.250,50'), 125050);
  assert.equal(parsePrice('₺ 99'), 9900);
  assert.equal(parsePrice(''), null);
  assert.equal(parsePrice(null), null);
  assert.ok(Number.isNaN(parsePrice('12abc')));
  assert.ok(Number.isNaN(parsePrice('-5')));
});

test('slug and checkbox helpers', () => {
  assert.ok(isSlug('berber-ahmet'));
  assert.ok(!isSlug('Berber Ahmet'));
  assert.ok(!isSlug('-x'));
  assert.ok(!isSlug('../x'));
  assert.ok(isChecked('on') && isChecked(true) && isChecked('1'));
  assert.ok(!isChecked('false') && !isChecked(undefined) && !isChecked(''));
});

test('migrations run once and are recorded', () => {
  const db = new Database(':memory:');
  const first = migrate(db);
  assert.ok(first.includes('001_init.sql'));
  assert.deepEqual(migrate(db), []);
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => r.name);
  for (const t of ['sites', 'items', 'messages', 'users', 'sessions'])
    assert.ok(tables.includes(t), t);
});

test('new migration files are picked up in order', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lk-mig-'));
  fs.writeFileSync(path.join(dir, '002_b.sql'), 'CREATE TABLE b (id INTEGER);');
  fs.writeFileSync(path.join(dir, '001_a.sql'), 'CREATE TABLE a (id INTEGER);');
  const db = new Database(':memory:');
  assert.deepEqual(migrate(db, dir), ['001_a.sql', '002_b.sql']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('notify: channels are discovered from files', () => {
  const names = loadChannels().map((c) => c.name);
  assert.deepEqual(names, ['email', 'telegram']);
});

test('notify: a failing channel does not stop the others', async () => {
  const delivered = [];
  const channels = [
    {
      name: 'broken',
      isEnabled: () => true,
      send: async () => {
        throw new Error('down');
      },
    },
    { name: 'ok', isEnabled: () => true, send: async ({ message }) => delivered.push(message.id) },
    { name: 'off', isEnabled: () => false, send: async () => delivered.push('never') },
  ];
  const notifier = createNotifier({}, { channels, logger: { error() {} } });
  const result = await notifier.notifyNewMessage({ slug: 's' }, { id: 7 });
  assert.deepEqual(delivered, [7]);
  assert.deepEqual(result, [
    { channel: 'broken', status: 'rejected' },
    { channel: 'ok', status: 'fulfilled' },
  ]);
});

test('notify: email and telegram are disabled without configuration', () => {
  const [email, telegram] = loadChannels();
  const config = { smtp: { host: '' }, telegram: { botToken: '', defaultChatId: '' } };
  assert.equal(email.isEnabled(config, { contact_email: 'a@b.co' }), false);
  assert.equal(telegram.isEnabled(config, {}), false);
  assert.equal(
    telegram.isEnabled(
      { telegram: { botToken: 't', defaultChatId: '' } },
      { telegram_chat_id: '1' },
    ),
    true,
  );
});

test('CORS origins: bare host expands to https and www', () => {
  const origins = allowedOrigins(
    { domains: ['Ornek.com', 'http://localhost:5500/', 'bad url'] },
    { publicOrigin: 'https://api.ornek.com' },
  );
  assert.ok(origins.has('https://ornek.com'));
  assert.ok(origins.has('https://www.ornek.com'));
  assert.ok(origins.has('http://localhost:5500'));
  assert.ok(origins.has('https://api.ornek.com'));
  assert.ok(!origins.has('http://ornek.com'));
});

test('guide body is built from docs/admin-rehberi.md with inlined images', () => {
  const html = guideBodyHtml();
  assert.match(html, /<h2[^>]*>1\. Panele giriş<\/h2>/);
  assert.match(html, /src="data:image\/png;base64,/);
});
