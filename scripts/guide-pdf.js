'use strict';

/**
 * Generates the branded admin guide PDF for a customer.
 *
 *   npm run guide:pdf -- --slug berber-ahmet
 *   npm run guide:pdf -- --slug berber-ahmet --out ./berber-rehber.pdf
 */
const { args, fail } = require('./_cli');
const { generateGuide } = require('../src/guide/pdf');

const opts = args({
  slug: { type: 'string' },
  out: { type: 'string' },
  username: { type: 'string' },
});
if (!opts.slug) fail('--slug zorunlu (ör. --slug berber-ahmet).');

generateGuide({ slug: opts.slug, out: opts.out, username: opts.username })
  .then((file) => console.log(`\n  ✓ PDF rehber hazır: ${file}\n`))
  .catch((err) => fail(err.message));
