'use strict';

/**
 * Launches a headless Chromium for PDF rendering. Tries, in order:
 *   1. PDF_BROWSER_PATH (any Chrome/Chromium/Edge executable)
 *   2. Playwright's own Chromium (npx playwright install chromium)
 *   3. An installed Google Chrome or Microsoft Edge
 */
async function launchBrowser({ executablePath } = {}) {
  const { chromium } = require('playwright');
  const attempts = [];
  const explicit = executablePath || process.env.PDF_BROWSER_PATH;
  if (explicit) attempts.push({ executablePath: explicit });
  attempts.push({}, { channel: 'chrome' }, { channel: 'msedge' });

  const errors = [];
  for (const options of attempts) {
    try {
      return await chromium.launch({ headless: true, ...options });
    } catch (err) {
      errors.push(err.message.split('\n')[0]);
    }
  }
  throw new Error(
    'Tarayıcı bulunamadı. "npx playwright install chromium" çalıştırın ya da .env içinde PDF_BROWSER_PATH ayarlayın. ' +
      `(${errors.join(' | ')})`,
  );
}

module.exports = { launchBrowser };
