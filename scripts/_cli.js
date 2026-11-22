'use strict';

// Shared helpers for the npm run scripts.
const { parseArgs } = require('node:util');
const { createConfig, loadEnvFile } = require('../src/config');
const { openDatabase } = require('../src/db');
const { createRepos } = require('../src/db/repo');

function boot() {
  loadEnvFile();
  const config = createConfig();
  const db = openDatabase(config.dbFile);
  return { config, db, repos: createRepos(db) };
}

function args(options) {
  try {
    return parseArgs({ options, allowPositionals: false, strict: true }).values;
  } catch (err) {
    fail(err.message);
  }
}

function fail(message) {
  console.error(`\n  Hata: ${message}\n`);
  process.exit(1);
}

/** "a, b ,c" -> ['a','b','c'] */
const list = (value) =>
  String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

module.exports = { boot, args, fail, list };
