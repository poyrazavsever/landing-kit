'use strict';

/**
 * Makes a dated backup of the SQLite database and the uploads folder.
 *
 *   npm run backup                      -> data/backups/2026-11-22_1830/
 *   npm run backup -- --out /mnt/yedek  -> /mnt/yedek/2026-11-22_1830/
 *   npm run backup -- --keep 14         -> also deletes all but the newest 14 backups
 *
 * Uses SQLite's online backup API, so it is safe while the server is running.
 */
const fs = require('node:fs');
const path = require('node:path');
const { boot, args, fail } = require('./_cli');

const opts = args({
  out: { type: 'string' },
  keep: { type: 'string' },
});

const { config, db } = boot();
const root = path.resolve(opts.out || path.join(config.dataDir, 'backups'));
// Local time, e.g. 2026-11-22_0300
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
const target = path.join(root, stamp);
fs.mkdirSync(target, { recursive: true });

(async () => {
  try {
    await db.backup(path.join(target, 'landing-kit.sqlite'));
    if (fs.existsSync(config.uploadsDir)) {
      fs.cpSync(config.uploadsDir, path.join(target, 'uploads'), { recursive: true });
    }
  } catch (err) {
    fail(`Yedek alınamadı: ${err.message}`);
  } finally {
    db.close();
  }

  if (opts.keep) {
    const keep = Number(opts.keep);
    if (!Number.isInteger(keep) || keep < 1) fail('--keep pozitif bir sayı olmalı.');
    const old = fs
      .readdirSync(root)
      .filter((name) => /^\d{4}-\d{2}-\d{2}_\d{4}$/.test(name))
      .sort()
      .slice(0, -keep);
    old.forEach((name) => fs.rmSync(path.join(root, name), { recursive: true, force: true }));
    if (old.length) console.log(`  ${old.length} eski yedek silindi.`);
  }

  console.log(`\n  ✓ Yedek alındı: ${target}\n`);
})();
