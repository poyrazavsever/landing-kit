'use strict';

/**
 * End-to-end: real Chromium, the React admin panel and a customer page on another origin.
 *   npm run build && npm run test:e2e
 * Skips when no Chromium/Chrome/Edge is available.
 */
/* global document, getComputedStyle */
process.env.BCRYPT_ROUNDS = '4';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const zlib = require('node:zlib');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createConfig } = require('../../src/config');
const { openDatabase } = require('../../src/db');
const { createRepos } = require('../../src/db/repo');
const { createApp } = require('../../src/app');
const { launchBrowser } = require('../../src/guide/browser');

const ADMIN_BUILT = fs.existsSync(
  path.join(__dirname, '..', '..', 'public', 'admin', 'index.html'),
);

/** Small valid PNG generated in memory (solid color). */
function png(width, height) {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) raw.set([179, 38, 30], y * (width * 3 + 1) + 1 + x * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const listen = (server) =>
  new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));

let browser;
let api;
let customer;
let apiUrl;
let customerUrl;
let dataDir;
let repos;

before(async () => {
  if (!ADMIN_BUILT) return;
  try {
    browser = await launchBrowser();
  } catch {
    return;
  }
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lk-e2e-'));
  repos = createRepos(openDatabase(':memory:'));
  api = http.createServer();
  const port = await listen(api);
  apiUrl = `http://127.0.0.1:${port}`;

  customer = http.createServer();
  const customerPort = await listen(customer);
  customerUrl = `http://127.0.0.1:${customerPort}`;

  const config = createConfig({
    dataDir,
    uploadsDir: path.join(dataDir, 'uploads'),
    publicUrl: apiUrl,
    publicOrigin: apiUrl,
    serveExamples: false,
  });
  const notifier = { channels: [], notifyNewMessage: async () => {} };
  api.on('request', createApp({ repos, config, notifier, logger: { error() {}, info() {} } }));

  const site = repos.sites.create({
    slug: 'e2e-ocakbasi',
    name: 'E2E Ocakbaşı',
    domains: [customerUrl],
    collections: ['menu', 'campaigns'],
    color_primary: '#B3261E',
    color_secondary: '#C8A24A',
    font_family: 'Playfair Display',
  });
  repos.items.create(site.id, { collection: 'menu', title: 'Adana Kebap', price_cents: 42000 });
  repos.items.create(site.id, { collection: 'menu', title: 'Ayran', price_cents: 6000 });
  repos.users.create({
    email: 'sahip@e2e.test',
    password: 'gecici-sifre-1',
    siteId: site.id,
    mustChange: true,
  });

  customer.on('request', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html><html lang="tr"><body>
      <h1 data-lk="name">Statik</h1>
      <div id="menu" data-lk-list="menu"><p>yedek</p><template><div class="item"><img data-lk-field="image"><b data-lk-field="title"></b> <span data-lk-field="price"></span></div></template></div>
      <form data-lk-form="contact" novalidate><input name="name"><input name="phone"><textarea name="message"></textarea>
      <input type="checkbox" name="kvkk" value="1"><button type="submit">Gönder</button></form>
      <script src="${apiUrl}/landing-kit.js" data-site="e2e-ocakbasi" defer></script></body></html>`);
  });
});

after(async () => {
  await browser?.close();
  api?.close();
  customer?.close();
  if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
});

test('business owner flow on a phone', async (t) => {
  if (!ADMIN_BUILT) return t.skip('admin panel not built (npm run build)');
  if (!browser) return t.skip('no Chromium, Chrome or Edge found');

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'tr-TR',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  // Branded login screen before anyone logs in.
  await page.goto(`${apiUrl}/admin/e2e-ocakbasi`);
  await page.getByRole('heading', { name: 'E2E Ocakbaşı' }).waitFor();
  const primary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
  );
  assert.equal(primary.toLowerCase(), '#b3261e', 'site color mapped onto shadcn --primary');

  // One-time password -> forced change.
  await page.getByLabel('E-posta adresiniz').fill('sahip@e2e.test');
  await page.getByLabel('Şifreniz').fill('gecici-sifre-1');
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await page.getByLabel('Size verilen geçici şifre').fill('gecici-sifre-1');
  await page.getByLabel('Yeni şifreniz').fill('kendi-sifrem-2026');
  await page.getByRole('button', { name: 'Şifremi kaydet' }).click();
  await page.getByRole('heading', { name: 'Merhaba!' }).waitFor();

  // Add a menu item with a photo from the gallery picker.
  await page.locator('a[href="#/c/menu"]').first().click();
  await page.getByRole('link', { name: 'Yeni ekle' }).click();
  await page.getByTestId('gallery-input').setInputFiles({
    name: 'antrikot.png',
    mimeType: 'image/png',
    buffer: png(64, 48),
  });
  await page.getByTestId('photo-preview').waitFor();
  await page.getByLabel('Başlık').fill('Dana Antrikot');
  await page.getByLabel('Fiyat (isteğe bağlı)').fill('890');
  await page.getByRole('button', { name: 'Ekle' }).click();
  await page.getByText('Eklendi. Sitede görünüyor.').waitFor();
  await page.getByTestId('item-row').nth(2).waitFor();

  // Reorder with the keyboard sensor: move "Dana Antrikot" from 3rd to 1st place.
  const handle = page.getByRole('button', { name: '"Dana Antrikot" sırasını değiştir' });
  await handle.focus();
  for (const key of ['Space', 'ArrowUp', 'ArrowUp', 'Space']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250); // let dnd-kit measure and animate between steps
  }
  await page.getByText('Sıralama kaydedildi.').waitFor();
  const order = await page.getByTestId('item-title').allTextContents();
  assert.deepEqual(order, ['Dana Antrikot', 'Adana Kebap', 'Ayran']);

  // Hide "Ayran" with its switch.
  await page.getByRole('switch', { name: '"Ayran" sitede görünsün' }).click();
  await page.getByText('"Ayran" gizlendi.').waitFor();

  // The customer's own page (another origin) shows the new order, price and photo.
  const site = await ctx.newPage();
  await site.goto(customerUrl);
  await site.waitForSelector('html.lk-ready');
  const titles = await site.locator('#menu .item b').allTextContents();
  assert.deepEqual(titles, ['Dana Antrikot', 'Adana Kebap']);
  assert.match(await site.locator('#menu .item span').first().textContent(), /₺890/);
  await site.locator('#menu img').first().scrollIntoViewIfNeeded();
  await site.waitForFunction(() => {
    const img = document.querySelector('#menu img');
    return img.complete && img.naturalWidth > 0;
  });

  // Visitor sends a reservation; it appears in the owner's inbox.
  await site.fill('input[name="name"]', 'Deneme Müşteri');
  await site.fill('input[name="phone"]', '0555 222 33 44');
  await site.fill('textarea[name="message"]', 'Cumartesi 20:00, 4 kişi');
  await site.check('input[name="kvkk"]');
  await site.click('button[type="submit"]');
  await site.waitForSelector('form[data-lk-state="success"]');

  await page
    .getByRole('link', { name: /Mesajlar/ })
    .last()
    .click();
  await page.getByTestId('message').first().waitFor();
  assert.match(await page.getByTestId('message').first().textContent(), /Deneme Müşteri/);

  // Deleting asks for confirmation first.
  await page.getByRole('button', { name: 'Deneme Müşteri kişisinin mesajını sil' }).click();
  await page.getByRole('alertdialog').waitFor();
  await page.getByRole('button', { name: 'Evet, sil' }).click();
  await page.getByText('Henüz mesaj yok').waitFor();

  assert.deepEqual(errors, [], 'no uncaught errors in the panel');
  await ctx.close();
});
