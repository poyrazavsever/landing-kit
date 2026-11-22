'use strict';

process.env.BCRYPT_ROUNDS = '4'; // fast hashing in tests

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createConfig } = require('../src/config');
const { openDatabase } = require('../src/db');
const { createRepos } = require('../src/db/repo');
const { createApp } = require('../src/app');

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/** Fresh app + in-memory database + temp data dir for one test file. */
function setup(overrides = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lk-test-'));
  const config = createConfig({
    dataDir,
    uploadsDir: path.join(dataDir, 'uploads'),
    guidesDir: path.join(dataDir, 'guides'),
    publicUrl: 'http://api.test',
    publicOrigin: 'http://api.test',
    serveExamples: false,
    ...overrides,
  });
  const repos = createRepos(openDatabase(':memory:'));
  const sent = [];
  const notifier = {
    channels: [],
    async notifyNewMessage(site, message) {
      sent.push({ site, message });
    },
  };
  const logger = { info() {}, error() {}, warn() {} };
  const app = createApp({ repos, config, notifier, logger });

  const siteA = repos.sites.create({
    slug: 'site-a',
    name: 'Site A',
    domains: ['site-a.com', 'http://localhost:5500'],
    contact_email: 'a@example.com',
    collections: ['menu', 'campaigns'],
  });
  const siteB = repos.sites.create({ slug: 'site-b', name: 'Site B', domains: ['site-b.com'] });
  const ownerA = repos.users.create({
    email: 'a@example.com',
    password: 'password-a',
    siteId: siteA.id,
    mustChange: false,
  });
  const ownerB = repos.users.create({
    email: 'b@example.com',
    password: 'password-b',
    siteId: siteB.id,
    mustChange: false,
  });

  const cleanup = () => fs.rmSync(dataDir, { recursive: true, force: true });
  return { app, repos, config, sent, siteA, siteB, ownerA, ownerB, cleanup };
}

/** Logs in with a supertest agent and returns { agent, csrf }. */
async function login(request, app, email, password) {
  const agent = request.agent(app);
  const res = await agent.post('/admin/api/login').send({ email, password });
  if (res.status !== 200)
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, csrf: res.body.csrfToken };
}

module.exports = { setup, login, PNG_1PX };
