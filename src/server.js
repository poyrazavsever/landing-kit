'use strict';

const { createConfig, loadEnvFile } = require('./config');
const { openDatabase } = require('./db');
const { createRepos } = require('./db/repo');
const { createNotifier } = require('./notify');
const { createApp } = require('./app');

loadEnvFile();
const config = createConfig();
const db = openDatabase(config.dbFile);
const repos = createRepos(db);
const notifier = createNotifier(config);
const app = createApp({ repos, config, notifier });

const server = app.listen(config.port, () => {
  const channels = notifier.channels.map((c) => c.name).join(', ');
  console.log(`landing-kit running on ${config.publicUrl} (port ${config.port}, ${config.env})`);
  console.log(`  database: ${config.dbFile}`);
  console.log(`  notify channels available: ${channels}`);
});

function shutdown(signal) {
  console.log(`${signal} received, closing...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
