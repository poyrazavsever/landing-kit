'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Fonts bundled with landing-kit (self-hosted via @fontsource, Turkish glyphs included).
 * Used by the PDF guide; the admin panel bundles the same families through Vite.
 */
const BUNDLED = {
  inter: { pkg: 'inter', family: 'Inter Variable' },
  'bricolage grotesque': { pkg: 'bricolage-grotesque', family: 'Bricolage Grotesque Variable' },
  'playfair display': { pkg: 'playfair-display', family: 'Playfair Display Variable' },
};

/** Site font name -> bundled family name (or the name itself for system fonts). */
function fontFamily(name) {
  const clean = String(name || '').replace(/["\\<>;{}]/g, '');
  return BUNDLED[clean.toLowerCase()]?.family || clean;
}

/**
 * @font-face rules with the latin + latin-ext subsets inlined as data URIs,
 * so Chromium renders the PDF with the real fonts and no network access.
 */
function fontFaceCss(names) {
  const css = [];
  for (const name of new Set(names.map((n) => String(n || '').toLowerCase()))) {
    const entry = BUNDLED[name];
    if (!entry) continue;
    let dir;
    try {
      dir = path.dirname(require.resolve(`@fontsource-variable/${entry.pkg}/package.json`));
    } catch {
      continue;
    }
    const source = fs.readFileSync(path.join(dir, 'wght.css'), 'utf8');
    for (const block of source.match(/@font-face\s*{[^}]*}/g) || []) {
      const file = block.match(/url\(\.\/files\/([^)]+-(latin|latin-ext)-wght-normal\.woff2)\)/);
      if (!file) continue;
      const data = fs.readFileSync(path.join(dir, 'files', file[1])).toString('base64');
      css.push(
        block.replace(
          /src:[^;]+;/,
          `src: url(data:font/woff2;base64,${data}) format('woff2-variations');`,
        ),
      );
    }
  }
  return css.join('\n');
}

module.exports = { fontFamily, fontFaceCss };
