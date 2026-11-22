'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setup, login, PNG_1PX } = require('./helpers');

let ctx;
let a;
before(async () => {
  ctx = setup({ uploadMaxBytes: 1024 });
  a = await login(request, ctx.app, 'a@example.com', 'password-a');
});
after(() => ctx.cleanup());

const upload = (buffer, filename, contentType, slug = 'site-a') =>
  a.agent
    .post(`/admin/api/sites/${slug}/uploads`)
    .set('X-CSRF-Token', a.csrf)
    .attach('image', buffer, { filename, contentType });

test('valid PNG is stored under uploads/<slug>/ with a random name', async () => {
  const res = await upload(PNG_1PX, '../../../evil name.png', 'image/png');
  assert.equal(res.status, 201);
  assert.match(res.body.path, /^\/uploads\/site-a\/[a-z0-9]+-[a-f0-9]{16}\.png$/);
  const file = path.join(ctx.config.uploadsDir, 'site-a', path.basename(res.body.path));
  assert.ok(fs.existsSync(file));

  const served = await request(ctx.app).get(res.body.path);
  assert.equal(served.status, 200);
  assert.match(served.headers['content-security-policy'], /sandbox/);
});

test('files over the size limit are rejected', async () => {
  const big = Buffer.concat([PNG_1PX, Buffer.alloc(2048)]);
  const res = await upload(big, 'big.png', 'image/png');
  assert.equal(res.status, 413);
});

test('non-image types are rejected', async () => {
  const res = await upload(Buffer.from('<svg onload="alert(1)"/>'), 'x.svg', 'image/svg+xml');
  assert.equal(res.status, 415);
  const html = await upload(Buffer.from('<html></html>'), 'x.html', 'text/html');
  assert.equal(html.status, 415);
});

test('content must match the declared type (magic bytes)', async () => {
  const res = await upload(Buffer.from('this is not really a png file'), 'fake.png', 'image/png');
  assert.equal(res.status, 415);
});

test('missing file is a validation error', async () => {
  const res = await a.agent
    .post('/admin/api/sites/site-a/uploads')
    .set('X-CSRF-Token', a.csrf)
    .field('x', 'y');
  assert.equal(res.status, 400);
});

test('cannot upload into another site', async () => {
  const res = await upload(PNG_1PX, 'x.png', 'image/png', 'site-b');
  assert.equal(res.status, 403);
  assert.ok(!fs.existsSync(path.join(ctx.config.uploadsDir, 'site-b')));
});

test('item image must be an upload path or https URL', async () => {
  const bad = await a.agent
    .post('/admin/api/sites/site-a/items')
    .set('X-CSRF-Token', a.csrf)
    .send({ collection: 'menu', title: 'X', image: 'javascript:alert(1)' });
  assert.equal(bad.status, 400);
  const traversal = await a.agent
    .post('/admin/api/sites/site-a/items')
    .set('X-CSRF-Token', a.csrf)
    .send({ collection: 'menu', title: 'X', image: '/uploads/../../etc/passwd.png' });
  assert.equal(traversal.status, 400);
});
