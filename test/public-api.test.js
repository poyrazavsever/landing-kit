'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setup } = require('./helpers');

let ctx;
before(() => {
  ctx = setup();
  const { repos, siteA } = ctx;
  repos.items.create(siteA.id, { collection: 'menu', title: 'Kebap', price_cents: 32000 });
  repos.items.create(siteA.id, { collection: 'menu', title: 'Gizli', active: false });
  repos.items.create(siteA.id, { collection: 'menu', title: 'Ayran', price_cents: 3550 });
  repos.items.create(siteA.id, { collection: 'campaigns', title: 'Kampanya' });
});
after(() => ctx.cleanup());

test('GET /healthz reports ok', async () => {
  const res = await request(ctx.app).get('/healthz');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
});

test('GET /api/sites/:slug returns public fields only', async () => {
  const res = await request(ctx.app).get('/api/sites/site-a');
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Site A');
  assert.equal(res.body.email, 'a@example.com');
  assert.equal(res.body.hours.length, 7);
  assert.equal(res.body.domains, undefined, 'domains must not leak');
  assert.equal(res.body.telegram_chat_id, undefined);
  assert.equal(res.body.id, undefined);
});

test('unknown site is 404', async () => {
  const res = await request(ctx.app).get('/api/sites/yok-boyle-site');
  assert.equal(res.status, 404);
});

test('items: only active, sorted, with TL price', async () => {
  const res = await request(ctx.app).get('/api/sites/site-a/items?collection=menu');
  assert.equal(res.status, 200);
  assert.deepEqual(
    res.body.items.map((i) => i.title),
    ['Kebap', 'Ayran'],
  );
  assert.equal(res.body.items[0].price, 320);
  assert.equal(res.body.items[1].price, 35.5);
  assert.equal(res.body.items[0].active, undefined, 'admin fields hidden');
});

test('items: invalid collection is rejected', async () => {
  const res = await request(ctx.app).get('/api/sites/site-a/items?collection=../../etc');
  assert.equal(res.status, 400);
});

test('items: collections of one site never include another site', async () => {
  const res = await request(ctx.app).get('/api/sites/site-b/items?collection=menu');
  assert.deepEqual(res.body.items, []);
});

test('CORS: allowed origins get headers (bare host covers https + www)', async () => {
  for (const origin of ['https://site-a.com', 'https://www.site-a.com', 'http://localhost:5500']) {
    const res = await request(ctx.app).get('/api/sites/site-a').set('Origin', origin);
    assert.equal(res.headers['access-control-allow-origin'], origin, origin);
  }
});

test('CORS: other origins get no allow header and preflight is refused', async () => {
  const res = await request(ctx.app).get('/api/sites/site-a').set('Origin', 'https://site-b.com');
  assert.equal(res.headers['access-control-allow-origin'], undefined);

  const pre = await request(ctx.app)
    .options('/api/sites/site-a/contact')
    .set('Origin', 'https://evil.example')
    .set('Access-Control-Request-Method', 'POST');
  assert.equal(pre.status, 403);

  const ok = await request(ctx.app)
    .options('/api/sites/site-a/contact')
    .set('Origin', 'https://site-a.com')
    .set('Access-Control-Request-Method', 'POST');
  assert.equal(ok.status, 204);
  assert.equal(ok.headers['access-control-allow-origin'], 'https://site-a.com');
});

test('security headers are set', async () => {
  const res = await request(ctx.app).get('/api/sites/site-a');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.ok(res.headers['content-security-policy']);
  assert.equal(res.headers['x-powered-by'], undefined);
});

test('snippet is served as JavaScript', async () => {
  const res = await request(ctx.app).get('/landing-kit.js');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /javascript/);
  assert.ok(res.text.includes('data-lk'));
});
