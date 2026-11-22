'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setup, login } = require('./helpers');

let ctx;
let a; // owner of site-a
let itemB; // an item that belongs to site-b

before(async () => {
  ctx = setup();
  itemB = ctx.repos.items.create(ctx.siteB.id, { collection: 'menu', title: 'B item' });
  a = await login(request, ctx.app, 'a@example.com', 'password-a');
});
after(() => ctx.cleanup());

test('wrong password is rejected with a generic message', async () => {
  const res = await request(ctx.app)
    .post('/admin/api/login')
    .send({ email: 'a@example.com', password: 'nope' });
  assert.equal(res.status, 401);
  const unknown = await request(ctx.app)
    .post('/admin/api/login')
    .send({ email: 'x@example.com', password: 'nope' });
  assert.equal(unknown.status, 401);
  assert.equal(res.body.message, unknown.body.message, 'no user enumeration');
});

test('admin API requires a session', async () => {
  const res = await request(ctx.app).get('/admin/api/sites/site-a');
  assert.equal(res.status, 401);
});

test('session cookie is httpOnly and SameSite=Strict', async () => {
  const res = await request(ctx.app)
    .post('/admin/api/login')
    .send({ email: 'a@example.com', password: 'password-a' });
  const cookie = res.headers['set-cookie'].join(';');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
});

test('writes without the CSRF token are refused', async () => {
  const res = await a.agent
    .post('/admin/api/sites/site-a/items')
    .send({ collection: 'menu', title: 'X' });
  assert.equal(res.status, 403);
  assert.equal(res.body.error, 'csrf');
  const wrong = await a.agent
    .post('/admin/api/sites/site-a/items')
    .set('X-CSRF-Token', 'x'.repeat(a.csrf.length))
    .send({ collection: 'menu', title: 'X' });
  assert.equal(wrong.status, 403);
});

test('owner can manage items of their own site', async () => {
  const create = await a.agent
    .post('/admin/api/sites/site-a/items')
    .set('X-CSRF-Token', a.csrf)
    .send({ collection: 'menu', title: 'Lahmacun', price: '95,50', description: 'İnce' });
  assert.equal(create.status, 201);
  assert.equal(create.body.price_cents, 9550);
  const id = create.body.id;

  const second = await a.agent
    .post('/admin/api/sites/site-a/items')
    .set('X-CSRF-Token', a.csrf)
    .send({ collection: 'menu', title: 'Ayran', price: '35' });

  const hide = await a.agent
    .patch(`/admin/api/sites/site-a/items/${id}`)
    .set('X-CSRF-Token', a.csrf)
    .send({ active: false });
  assert.equal(hide.body.active, false);

  let pub = await request(ctx.app).get('/api/sites/site-a/items?collection=menu');
  assert.deepEqual(
    pub.body.items.map((i) => i.title),
    ['Ayran'],
  );

  await a.agent
    .patch(`/admin/api/sites/site-a/items/${id}`)
    .set('X-CSRF-Token', a.csrf)
    .send({ active: true });
  const reorder = await a.agent
    .post('/admin/api/sites/site-a/items/reorder')
    .set('X-CSRF-Token', a.csrf)
    .send({ collection: 'menu', ids: [second.body.id, id] });
  assert.equal(reorder.status, 200);
  pub = await request(ctx.app).get('/api/sites/site-a/items?collection=menu');
  assert.deepEqual(
    pub.body.items.map((i) => i.title),
    ['Ayran', 'Lahmacun'],
  );

  const bad = await a.agent
    .patch(`/admin/api/sites/site-a/items/${id}`)
    .set('X-CSRF-Token', a.csrf)
    .send({ price: '12abc' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.errors.price);

  const del = await a.agent
    .delete(`/admin/api/sites/site-a/items/${id}`)
    .set('X-CSRF-Token', a.csrf);
  assert.equal(del.status, 200);
});

test('a new collection key becomes part of the site (collections are data)', async () => {
  const res = await a.agent
    .post('/admin/api/sites/site-a/items')
    .set('X-CSRF-Token', a.csrf)
    .send({ collection: 'faq', title: 'Paket servis var mı?' });
  assert.equal(res.status, 201);
  const site = await a.agent.get('/admin/api/sites/site-a');
  assert.ok(site.body.collections.some((c) => c.key === 'faq' && c.label === 'Sık Sorulanlar'));
});

test('tenant isolation: owner A cannot read or change site B', async () => {
  const t = a.csrf;
  const checks = [
    a.agent.get('/admin/api/sites/site-b'),
    a.agent
      .patch('/admin/api/sites/site-b')
      .set('X-CSRF-Token', t)
      .send({ phone: '0555 000 00 00' }),
    a.agent.get('/admin/api/sites/site-b/items?collection=menu'),
    a.agent
      .post('/admin/api/sites/site-b/items')
      .set('X-CSRF-Token', t)
      .send({ collection: 'menu', title: 'hack' }),
    a.agent
      .patch(`/admin/api/sites/site-b/items/${itemB.id}`)
      .set('X-CSRF-Token', t)
      .send({ title: 'hack' }),
    a.agent.delete(`/admin/api/sites/site-b/items/${itemB.id}`).set('X-CSRF-Token', t),
    a.agent.get('/admin/api/sites/site-b/messages'),
    a.agent.get('/admin/api/sites/does-not-exist'),
  ];
  for (const res of await Promise.all(checks)) assert.equal(res.status, 403, res.req.path);

  // Using their own slug with another site's item id must not work either.
  const viaOwnSlug = await a.agent
    .patch(`/admin/api/sites/site-a/items/${itemB.id}`)
    .set('X-CSRF-Token', t)
    .send({ title: 'hack' });
  assert.equal(viaOwnSlug.status, 404);
  const delViaOwn = await a.agent
    .delete(`/admin/api/sites/site-a/items/${itemB.id}`)
    .set('X-CSRF-Token', t);
  assert.equal(delViaOwn.status, 404);
  const reorder = await a.agent
    .post('/admin/api/sites/site-a/items/reorder')
    .set('X-CSRF-Token', t)
    .send({ collection: 'menu', ids: [itemB.id] });
  assert.equal(reorder.status, 200);

  assert.equal(ctx.repos.items.find(ctx.siteB.id, itemB.id).title, 'B item');
  assert.equal(ctx.repos.items.find(ctx.siteB.id, itemB.id).sort_order, 0);
});

test('tenant isolation: messages are scoped per site', async () => {
  const msgB = ctx.repos.messages.create(ctx.siteB.id, {
    name: 'B',
    phone: '05551112233',
    message: 'gizli',
    kvkk: true,
  });
  const list = await a.agent.get('/admin/api/sites/site-a/messages');
  assert.ok(!list.body.messages.some((m) => m.id === msgB.id));
  const read = await a.agent
    .patch(`/admin/api/sites/site-a/messages/${msgB.id}`)
    .set('X-CSRF-Token', a.csrf)
    .send({ read: true });
  assert.equal(read.status, 404);
  const del = await a.agent
    .delete(`/admin/api/sites/site-a/messages/${msgB.id}`)
    .set('X-CSRF-Token', a.csrf);
  assert.equal(del.status, 404);
});

test('owner can read and mark messages', async () => {
  const msg = ctx.repos.messages.create(ctx.siteA.id, {
    name: 'Ali',
    phone: '05551112233',
    message: 'Selam',
    kvkk: true,
  });
  let list = await a.agent.get('/admin/api/sites/site-a/messages');
  assert.ok(list.body.unread >= 1);
  const res = await a.agent
    .patch(`/admin/api/sites/site-a/messages/${msg.id}`)
    .set('X-CSRF-Token', a.csrf)
    .send({ read: true });
  assert.equal(res.body.read, true);
});

test('owner edits site info but not theme or domains', async () => {
  const hours = Array.from({ length: 7 }, (_, i) => ({
    open: '10:00',
    close: '18:00',
    closed: i === 6,
  }));
  const ok = await a.agent.patch('/admin/api/sites/site-a').set('X-CSRF-Token', a.csrf).send({
    phone: '0555 111 22 33',
    whatsapp: '+90 555 111 22 33',
    opening_hours: hours,
    hours_note: 'Bayramda kapalı',
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.phone, '0555 111 22 33');
  assert.equal(ok.body.opening_hours[0].open, '10:00');

  const pub = await request(ctx.app).get('/api/sites/site-a');
  assert.equal(pub.body.hoursNote, 'Bayramda kapalı');

  const theme = await a.agent
    .patch('/admin/api/sites/site-a')
    .set('X-CSRF-Token', a.csrf)
    .send({ color_primary: '#ff0000' });
  assert.equal(theme.status, 400);
  const domains = await a.agent
    .patch('/admin/api/sites/site-a')
    .set('X-CSRF-Token', a.csrf)
    .send({ domains: ['evil.com'] });
  assert.equal(domains.status, 400);

  const badHours = await a.agent
    .patch('/admin/api/sites/site-a')
    .set('X-CSRF-Token', a.csrf)
    .send({ opening_hours: [{ open: '25:00', close: 'x' }] });
  assert.equal(badHours.status, 400);
});

test('one-time password must be changed before anything else', async () => {
  ctx.repos.users.create({
    email: 'new@example.com',
    password: 'temp-pass-1',
    siteId: ctx.siteA.id,
    mustChange: true,
  });
  const n = await login(request, ctx.app, 'new@example.com', 'temp-pass-1');
  const blocked = await n.agent.get('/admin/api/sites/site-a');
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.error, 'password_change_required');

  const short = await n.agent
    .post('/admin/api/password')
    .set('X-CSRF-Token', n.csrf)
    .send({ current: 'temp-pass-1', next: 'short' });
  assert.equal(short.status, 400);
  const change = await n.agent
    .post('/admin/api/password')
    .set('X-CSRF-Token', n.csrf)
    .send({ current: 'temp-pass-1', next: 'my-own-password' });
  assert.equal(change.status, 200);
  const allowed = await n.agent.get('/admin/api/sites/site-a');
  assert.equal(allowed.status, 200);
});

test('superadmin can manage every site and the theme', async () => {
  ctx.repos.users.create({
    email: 'boss@example.com',
    password: 'boss-password',
    role: 'superadmin',
    mustChange: false,
  });
  const s = await login(request, ctx.app, 'boss@example.com', 'boss-password');
  const list = await s.agent.get('/admin/api/sites');
  assert.equal(list.status, 200);
  assert.equal(list.body.sites.length, 2);
  const res = await s.agent
    .patch('/admin/api/sites/site-b')
    .set('X-CSRF-Token', s.csrf)
    .send({
      color_primary: '#0F766E',
      font_family: 'Poppins',
      domains: ['site-b.com', 'http://localhost:5500'],
    });
  assert.equal(res.status, 200);
  assert.equal(res.body.theme.primary, '#0F766E');

  const owners = await a.agent.get('/admin/api/sites');
  assert.equal(owners.status, 403, 'owners cannot list all sites');
});

test('logout ends the session', async () => {
  const s = await login(request, ctx.app, 'b@example.com', 'password-b');
  await s.agent.post('/admin/api/logout');
  const res = await s.agent.get('/admin/api/me');
  assert.equal(res.status, 401);
});

test('admin panel (React build) is served for /admin and /admin/<slug>', async (t) => {
  if (!fs.existsSync(path.join(__dirname, '..', 'public', 'admin', 'index.html'))) {
    return t.skip('admin panel not built (npm run build:admin)');
  }
  for (const url of ['/admin/', '/admin/site-a']) {
    const res = await request(ctx.app).get(url);
    assert.equal(res.status, 200, url);
    assert.match(res.text, /<div id="root"><\/div>/);
  }
  const page = await request(ctx.app).get('/admin/site-a');
  const asset = page.text.match(/src="(\/admin\/assets\/[^"]+\.js)"/)[1];
  const js = await request(ctx.app).get(asset);
  assert.equal(js.status, 200);
  assert.match(js.headers['content-type'], /javascript/);
  const logo = await request(ctx.app).get('/admin/landing-kit-mark.svg');
  assert.equal(logo.status, 200);
});
