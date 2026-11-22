'use strict';

/**
 * Captures the admin panel screenshots used in README and docs/admin-rehberi.md.
 * Requires a running server with demo data (npm run seed:demo -- --password demo12345).
 *
 *   node scripts/docs-screenshots.js --url http://localhost:3000 --password demo12345
 */
/* global document */
const path = require('node:path');
const fs = require('node:fs');
const { parseArgs } = require('node:util');
const { launchBrowser } = require('../src/guide/browser');

const { values: opts } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://localhost:3000' },
    password: { type: 'string', default: 'demo12345' },
    out: { type: 'string', default: path.join(__dirname, '..', 'docs', 'images') },
  },
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  fs.mkdirSync(opts.out, { recursive: true });
  const browser = await launchBrowser();
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'tr-TR',
  });
  const page = await phone.newPage();
  const shot = async (name) => {
    await wait(400);
    await page.screenshot({ path: path.join(opts.out, `${name}.png`) });
    console.log(`  ${name}.png`);
  };

  await page.goto(`${opts.url}/admin/cinaralti-lokanta`);
  await page.waitForSelector('input[name="email"]');
  await shot('admin-giris');

  await page.fill('input[name="email"]', 'lokanta@example.com');
  await page.fill('input[name="password"]', opts.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.tiles');
  await shot('admin-ana-sayfa');

  await page.click('a[href="#/c/menu"]');
  await page.waitForSelector('.items');
  await shot('admin-menu');

  await page.click('.item-actions a.btn');
  await page.waitForSelector('input[name="title"]');
  await shot('admin-duzenle');

  await page.goto(`${opts.url}/admin/cinaralti-lokanta#/mesajlar`);
  await page.waitForSelector('.msg');
  await shot('admin-mesajlar');

  await page.goto(`${opts.url}/admin/cinaralti-lokanta#/bilgiler`);
  await page.waitForSelector('.hours');
  await shot('admin-bilgiler');

  // Same panel, another customer's brand.
  const fresh = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    locale: 'tr-TR',
  });
  const other = await fresh.newPage();
  await other.goto(`${opts.url}/admin/yildiz-kuruyemis`);
  await other.waitForSelector('input[name="email"]');
  await wait(400);
  await other.screenshot({ path: path.join(opts.out, 'admin-giris-baska-marka.png') });
  console.log('  admin-giris-baska-marka.png');

  // Example landing page on desktop.
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    locale: 'tr-TR',
  });
  const landing = await desktop.newPage();
  await landing.goto(`${opts.url}/examples/restoran/`);
  await landing.waitForSelector('html.lk-ready');
  await landing.evaluate(() => document.querySelector('#menu').scrollIntoView());
  await wait(400);
  await landing.screenshot({ path: path.join(opts.out, 'ornek-restoran.png') });
  console.log('  ornek-restoran.png');

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
