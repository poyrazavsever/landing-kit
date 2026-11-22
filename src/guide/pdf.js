'use strict';

const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('qrcode');
const { marked } = require('marked');
const { createConfig, loadEnvFile, ROOT } = require('../config');
const { openDatabase } = require('../db');
const { createRepos } = require('../db/repo');
const { siteTheme } = require('../db/repo/sites');
const { BRAND } = require('../lib/defaults');
const { guideHtml, esc } = require('./template');
const { launchBrowser } = require('./browser');

const GUIDE_MD = path.join(ROOT, 'docs', 'admin-rehberi.md');
const DOCS_DIR = path.join(ROOT, 'docs');
const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function dataUri(file) {
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type || !fs.existsSync(file)) return null;
  return `data:${type};base64,${fs.readFileSync(file).toString('base64')}`;
}

/** Site logo from uploads/ (or examples/), falling back to the landing-kit mark. */
function logoDataUri(site, config) {
  const logo = site.logo_path || '';
  let file = null;
  if (logo.startsWith('/uploads/'))
    file = path.join(config.uploadsDir, logo.slice('/uploads/'.length));
  else if (logo.startsWith('/examples/')) file = path.join(ROOT, logo);
  const resolved = file && path.resolve(file);
  const safe =
    resolved &&
    (resolved.startsWith(path.resolve(config.uploadsDir)) ||
      resolved.startsWith(path.join(ROOT, 'examples')));
  return (safe && dataUri(resolved)) || dataUri(path.join(ROOT, 'brand', 'landing-kit-mark.svg'));
}

/** docs/admin-rehberi.md -> HTML with images inlined (the PDF has no file access). */
function guideBodyHtml(markdown = fs.readFileSync(GUIDE_MD, 'utf8')) {
  const renderer = new marked.Renderer();
  renderer.image = ({ href, text }) => {
    const src = dataUri(path.resolve(DOCS_DIR, href));
    return src ? `<img src="${src}" alt="${esc(text)}" />` : '';
  };
  // The markdown is trusted (shipped in the repo), raw HTML is not expected in it.
  return marked.parse(markdown, { renderer });
}

/**
 * Renders data/guides/<slug>-admin-rehberi.pdf in the customer's brand.
 * Returns the absolute file path.
 */
async function generateGuide({ slug, username, out, config, repos } = {}) {
  let db;
  if (!config) {
    loadEnvFile();
    config = createConfig();
  }
  if (!repos) {
    db = openDatabase(config.dbFile);
    repos = createRepos(db);
  }
  try {
    const site = repos.sites.findBySlug(slug);
    if (!site) throw new Error(`Site bulunamadı: ${slug}`);
    const owner =
      username || repos.users.listForSite(site.id).find((u) => u.role === 'owner')?.email;
    const panelUrl = `${config.publicUrl}/admin/${site.slug}`;
    const theme = siteTheme(site, BRAND);
    const html = guideHtml({
      site,
      theme,
      logo: logoDataUri(site, config),
      panelUrl,
      username: owner,
      qrSvg: await QRCode.toString(panelUrl, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }),
      support: config.support,
      bodyHtml: guideBodyHtml(),
      date: new Date().toLocaleDateString('tr-TR', { dateStyle: 'long' }),
    });

    const file = path.resolve(out || path.join(config.guidesDir, `${site.slug}-admin-rehberi.pdf`));
    fs.mkdirSync(path.dirname(file), { recursive: true });

    const browser = await launchBrowser({ executablePath: config.pdfBrowserPath });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.pdf({
        path: file,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `<div style="width:100%;font-size:8px;color:#4B5568;padding:0 16mm;display:flex;justify-content:space-between;font-family:sans-serif">
          <span>${esc(site.name)} · Yönetim Paneli Rehberi</span><span class="pageNumber"></span></div>`,
      });
    } finally {
      await browser.close();
    }
    return file;
  } finally {
    if (db) db.close();
  }
}

module.exports = { generateGuide, guideBodyHtml };
