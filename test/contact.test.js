'use strict';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setup } = require('./helpers');

let ctx;
before(() => {
  // High limit here; the rate limit itself is tested with a separate app below.
  ctx = setup({
    rateLimits: { contact: { limit: 100, windowMin: 10 }, login: { limit: 100, windowMin: 15 } },
  });
});
after(() => ctx.cleanup());
beforeEach(() => {
  ctx.repos.db.prepare('DELETE FROM messages').run();
  ctx.sent.length = 0;
});

const valid = {
  name: 'Ayşe',
  phone: '0555 123 45 67',
  message: 'Cumartesi için masa ayırabilir miyiz?',
  kvkk: true,
};
const count = () => ctx.repos.db.prepare('SELECT COUNT(*) AS n FROM messages').get().n;
const post = (body, origin = 'https://site-a.com') =>
  request(ctx.app).post('/api/sites/site-a/contact').set('Origin', origin).send(body);

test('valid message is stored and notified', async () => {
  const res = await post(valid);
  assert.equal(res.status, 201);
  assert.equal(res.body.ok, true);
  assert.equal(count(), 1);
  const row = ctx.repos.db.prepare('SELECT * FROM messages').get();
  assert.equal(row.name, 'Ayşe');
  assert.equal(row.kvkk_consent, 1);
  assert.equal(row.is_read, 0);
  assert.equal(ctx.sent.length, 1);
  assert.equal(ctx.sent[0].site.slug, 'site-a');
});

test('KVKK consent is required server-side', async () => {
  for (const kvkk of [undefined, false, '', 'false', '0']) {
    const res = await post({ ...valid, kvkk });
    assert.equal(res.status, 400, `kvkk=${kvkk}`);
    assert.ok(res.body.errors.kvkk);
  }
  assert.equal(count(), 0);
});

test('honeypot: pretends success but stores and notifies nothing', async () => {
  const res = await post({ ...valid, website: 'http://spam.example' });
  assert.equal(res.status, 201);
  assert.equal(count(), 0);
  assert.equal(ctx.sent.length, 0);
});

test('validation: name, message and a way to reach back are required', async () => {
  let res = await post({ kvkk: true });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.name);
  assert.ok(res.body.errors.message);
  assert.ok(res.body.errors.phone);

  res = await post({ ...valid, phone: 'abc' });
  assert.ok(res.body.errors.phone);

  res = await post({ ...valid, phone: '', email: 'not-an-email' });
  assert.ok(res.body.errors.email);

  res = await post({ ...valid, message: 'x'.repeat(2001) });
  assert.ok(res.body.errors.message);

  res = await post({ ...valid, name: { $gt: '' } });
  assert.equal(res.status, 400);
  assert.equal(count(), 0);
});

test('email-only contact is accepted', async () => {
  const res = await post({ ...valid, phone: '', email: 'ayse@example.com' });
  assert.equal(res.status, 201);
});

test('posts from origins outside the allow-list are refused', async () => {
  const res = await post(valid, 'https://site-b.com');
  assert.equal(res.status, 403);
  assert.equal(count(), 0);
});

test('SQL-looking input is stored as plain text', async () => {
  const res = await post({ ...valid, name: "Robert'); DROP TABLE messages;--" });
  assert.equal(res.status, 201);
  assert.equal(count(), 1);
});

test('no-JS form post redirects back to the page', async () => {
  const res = await request(ctx.app)
    .post('/api/sites/site-a/contact')
    .set('Origin', 'https://site-a.com')
    .set('Referer', 'https://site-a.com/iletisim')
    .type('form')
    .send({ name: 'Ali', phone: '05551112233', message: 'Merhaba', kvkk: 'on' });
  assert.equal(res.status, 303);
  assert.equal(res.headers.location, 'https://site-a.com/iletisim#lk-sent');
  assert.equal(count(), 1);
});

test('no-JS redirect never goes to a foreign origin', async () => {
  const res = await request(ctx.app)
    .post('/api/sites/site-a/contact')
    .set('Origin', 'https://site-a.com')
    .type('form')
    .send({
      name: 'Ali',
      phone: '05551112233',
      message: 'Merhaba',
      kvkk: 'on',
      redirect: 'https://evil.example/',
    });
  assert.notEqual(res.status, 303);
  assert.equal(res.status, 201);
});

test('contact form is rate limited per IP and site', async () => {
  const limited = setup({
    rateLimits: { contact: { limit: 2, windowMin: 10 }, login: { limit: 10, windowMin: 15 } },
  });
  try {
    const send = () =>
      request(limited.app)
        .post('/api/sites/site-a/contact')
        .set('Origin', 'https://site-a.com')
        .send(valid);
    assert.equal((await send()).status, 201);
    assert.equal((await send()).status, 201);
    const third = await send();
    assert.equal(third.status, 429);
    assert.equal(third.body.error, 'rate_limited');
  } finally {
    limited.cleanup();
  }
});
