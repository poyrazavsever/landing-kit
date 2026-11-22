'use strict';

/**
 * Captures the screenshots used in README and docs/admin-rehberi.md.
 * Requires a running server with demo data (npm run seed:demo -- --reset --password demo12345).
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

const PHONE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'tr-TR',
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  fs.mkdirSync(opts.out, { recursive: true });
  const browser = await launchBrowser();
  const save = async (page, name) => {
    await wait(500);
    await page.screenshot({ path: path.join(opts.out, `${name}.png`) });
    console.log(`  ${name}.png`);
  };

  const phone = await browser.newContext(PHONE);
  const page = await phone.newPage();
  await page.goto(`${opts.url}/admin/en-iyi-etler`);
  await page.waitForSelector('input[name="email"]');
  await save(page, 'admin-giris');

  await page.fill('input[name="email"]', 'eniyietler@example.com');
  await page.fill('input[name="password"]', opts.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('a[href="#/c/menu"]');
  await save(page, 'admin-ana-sayfa');

  await page.click('a[href="#/c/menu"]');
  await page.waitForSelector('[data-testid="item-row"]');
  await save(page, 'admin-menu');

  await page.click('[data-testid="item-title"]');
  await page.waitForSelector('input[name="title"]');
  await save(page, 'admin-duzenle');

  await page.goto(`${opts.url}/admin/en-iyi-etler#/mesajlar`);
  await page.waitForSelector('[data-testid="message"]');
  await save(page, 'admin-mesajlar');

  await page.goto(`${opts.url}/admin/en-iyi-etler#/bilgiler`);
  await page.waitForSelector('[data-testid="hours-row"]');
  await save(page, 'admin-bilgiler');

  // Same panel, another customer's brand.
  const other = await (await browser.newContext(PHONE)).newPage();
  await other.goto(`${opts.url}/admin/yildiz-kuruyemis`);
  await other.waitForSelector('input[name="email"]');
  await save(other, 'admin-giris-baska-marka');

  // The En İyi Etler example page: desktop hero, menu section and a phone view.
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'tr-TR',
  });
  const desktop = await desktopContext.newPage();
  await desktop.goto(`${opts.url}/examples/en-iyi-etler/`);
  await desktop.waitForSelector('html.lk-ready');
  await save(desktop, 'ornek-sayfa');
  await desktop.evaluate(() => document.querySelector('#menu').scrollIntoView());
  await save(desktop, 'ornek-sayfa-menu');

  const mobile = await (await browser.newContext(PHONE)).newPage();
  await mobile.goto(`${opts.url}/examples/en-iyi-etler/`);
  await mobile.waitForSelector('html.lk-ready');
  await save(mobile, 'ornek-sayfa-mobil');

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
