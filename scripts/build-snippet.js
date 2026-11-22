'use strict';

// Minifies public/landing-kit.js -> public/landing-kit.min.js (the file served at /landing-kit.js).
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { minify } = require('terser');

const src = path.join(__dirname, '..', 'public', 'landing-kit.js');
const out = path.join(__dirname, '..', 'public', 'landing-kit.min.js');

(async () => {
  const code = fs.readFileSync(src, 'utf8');
  const result = await minify(code, {
    compress: { passes: 2 },
    mangle: true,
    format: { comments: /^!/ },
  });
  fs.writeFileSync(out, result.code + '\n');
  const gz = zlib.gzipSync(result.code).length;
  console.log(`landing-kit.min.js: ${result.code.length} bytes (${gz} bytes gzip)`);
})();
