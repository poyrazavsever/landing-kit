'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'public', 'landing-kit.js'), 'utf8');
const MINIFIED = path.join(__dirname, '..', 'public', 'landing-kit.min.js');

const PAGE = `<!doctype html><html><body>
  <h1 data-lk="name">Statik Ad</h1>
  <a id="tel" data-lk="phone" data-lk-href="phone" href="#">0000</a>
  <a id="wa" data-lk-href="whatsapp" href="#">WhatsApp</a>
  <a id="map" data-lk-href="maps" href="#">Harita</a>
  <ul id="hours" data-lk="hours"><li>Statik saat</li></ul>
  <p id="note" data-lk="hoursNote">statik not</p>
  <div id="menu" data-lk-list="menu">
    <p class="fallback">Statik menü</p>
    <template><article><img data-lk-field="image"><h3 data-lk-field="title"></h3>
      <p class="desc" data-lk-field="description"></p><span class="price" data-lk-field="price"></span></article></template>
  </div>
  <div id="camp" data-lk-list="campaigns" data-lk-empty="Kampanya yok"><template><b data-lk-field="title"></b></template></div>
  <form data-lk-form="contact">
    <input name="name"><input name="phone"><textarea name="message"></textarea>
    <input type="checkbox" name="kvkk" value="1"><button type="submit">Gönder</button>
  </form>
  <script src="https://api.example.com/landing-kit.js" data-site="berber-ahmet"></script>
</body></html>`;

const SITE = {
  slug: 'berber-ahmet',
  name: 'Berber Ahmet',
  phone: '0555 123 45 67',
  whatsapp: '0555 123 45 67',
  address: 'Örnek Sok. 1',
  hours: [
    { open: '09:00', close: '20:00', closed: false },
    { open: '09:00', close: '20:00', closed: false },
    { open: '09:00', close: '20:00', closed: false },
    { open: '09:00', close: '20:00', closed: false },
    { open: '09:00', close: '20:00', closed: false },
    { open: '10:00', close: '18:00', closed: false },
    { open: '09:00', close: '19:00', closed: true },
  ],
  hoursNote: null,
};

const ITEMS = {
  menu: [
    {
      id: 1,
      title: 'Saç kesimi',
      description: 'Yıkama dahil',
      price: 250,
      image: '/uploads/berber-ahmet/a.jpg',
    },
    { id: 2, title: 'Sakal', description: null, price: 1249.5, image: null },
  ],
  campaigns: [],
};

function respond(status, body) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
}

/** Loads the page in jsdom, stubs fetch, runs the snippet and waits for it to settle. */
async function run({ fetchImpl, code = SOURCE } = {}) {
  const dom = new JSDOM(PAGE, { url: 'https://berberahmet.com/', runScripts: 'outside-only' });
  const { window } = dom;
  const calls = [];
  window.fetch = (url, opts = {}) => {
    calls.push({ url, opts });
    return fetchImpl(url, opts);
  };
  window.eval(code);
  const root = window.document.documentElement;
  for (let i = 0; i < 100 && !/lk-(ready|offline)/.test(root.className); i++) {
    await new Promise((r) => setTimeout(r, 5));
  }
  return { window, document: window.document, calls };
}

const okApi = (url, opts) => {
  if (opts.method === 'POST') return respond(201, { ok: true });
  if (url.endsWith('/api/sites/berber-ahmet')) return respond(200, SITE);
  const collection = new URL(url).searchParams.get('collection');
  return respond(200, { collection, items: ITEMS[collection] || [] });
};

test('fills site fields, links and hours', async () => {
  const { document, calls } = await run({ fetchImpl: okApi });
  assert.ok(
    calls[0].url.startsWith('https://api.example.com/api/sites/berber-ahmet'),
    'API base from script src',
  );
  assert.equal(document.querySelector('h1').textContent, 'Berber Ahmet');
  assert.equal(document.getElementById('tel').getAttribute('href'), 'tel:05551234567');
  assert.equal(document.getElementById('wa').getAttribute('href'), 'https://wa.me/905551234567');
  assert.match(
    document.getElementById('map').getAttribute('href'),
    /google\.com\/maps.*%C3%96rnek/,
  );
  const hours = [...document.querySelectorAll('#hours li')].map((li) => li.textContent);
  assert.deepEqual(hours, [
    'Pazartesi–Cuma: 09:00–20:00',
    'Cumartesi: 10:00–18:00',
    'Pazar: Kapalı',
  ]);
  assert.equal(
    document.getElementById('note').textContent,
    'statik not',
    'empty values keep static text',
  );
  assert.ok(document.documentElement.classList.contains('lk-ready'));
});

test('renders list templates with TR price formatting and hides empty fields', async () => {
  const { document } = await run({ fetchImpl: okApi });
  const menu = document.getElementById('menu');
  assert.equal(menu.querySelector('.fallback'), null, 'static fallback replaced');
  const articles = menu.querySelectorAll('article');
  assert.equal(articles.length, 2);
  assert.equal(articles[0].getAttribute('data-lk-id'), '1');
  assert.equal(articles[0].querySelector('h3').textContent, 'Saç kesimi');
  assert.equal(
    articles[0].querySelector('img').src,
    'https://api.example.com/uploads/berber-ahmet/a.jpg',
  );
  assert.equal(articles[0].querySelector('img').alt, 'Saç kesimi');
  const price0 = articles[0].querySelector('.price').textContent.replace(/\s/g, ' ');
  const price1 = articles[1].querySelector('.price').textContent.replace(/\s/g, ' ');
  assert.match(price0, /^₺250$/);
  assert.match(price1, /^₺1\.249,50$/);
  assert.equal(articles[1].querySelector('.desc').hidden, true);
  assert.equal(articles[1].querySelector('img').hidden, true);
  assert.equal(document.querySelector('#camp .lk-empty').textContent, 'Kampanya yok');
});

test('item text is inserted as text, never as HTML', async () => {
  const evil = (url, opts) =>
    url.includes('collection=menu')
      ? respond(200, { items: [{ id: 9, title: '<img src=x onerror=alert(1)>', price: null }] })
      : okApi(url, opts);
  const { document } = await run({ fetchImpl: evil });
  const h3 = document.querySelector('#menu h3');
  assert.equal(h3.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(h3.querySelector('img'), null);
});

test('keeps static content when the API is down', async () => {
  const { document } = await run({
    fetchImpl: () => Promise.reject(new TypeError('Failed to fetch')),
  });
  assert.ok(document.documentElement.classList.contains('lk-offline'));
  assert.equal(document.querySelector('h1').textContent, 'Statik Ad');
  assert.ok(document.querySelector('#menu .fallback'));
  assert.equal(document.querySelector('#hours li').textContent, 'Statik saat');
});

test('contact form posts JSON with honeypot and shows success', async () => {
  const { window, document, calls } = await run({ fetchImpl: okApi });
  const form = document.querySelector('form');
  assert.ok(form.querySelector('input[name="website"]'), 'honeypot injected');
  form.elements.namedItem('name').value = 'Ali';
  form.elements.namedItem('phone').value = '05551112233';
  form.elements.namedItem('message').value = 'Randevu';
  form.elements.namedItem('kvkk').checked = true;
  form.dispatchEvent(new window.Event('submit', { cancelable: true }));
  await new Promise((r) => setTimeout(r, 30));

  const post = calls.find((c) => c.opts.method === 'POST');
  assert.equal(post.url, 'https://api.example.com/api/sites/berber-ahmet/contact');
  const body = JSON.parse(post.opts.body);
  assert.equal(body.name, 'Ali');
  assert.equal(body.kvkk, true);
  assert.equal(body.website, '');
  assert.equal(form.getAttribute('data-lk-state'), 'success');
  assert.match(form.querySelector('[data-lk-status]').textContent, /iletildi/);
  assert.equal(form.elements.namedItem('name').value, '', 'form reset');
});

test('contact form shows server validation errors on the fields', async () => {
  const failing = (url, opts) =>
    opts.method === 'POST'
      ? respond(400, {
          error: 'validation',
          errors: { kvkk: 'Devam etmek için aydınlatma metnini onaylayın.' },
        })
      : okApi(url, opts);
  const { window, document } = await run({ fetchImpl: failing });
  const form = document.querySelector('form');
  form.dispatchEvent(new window.Event('submit', { cancelable: true }));
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(form.getAttribute('data-lk-state'), 'error');
  assert.equal(form.elements.namedItem('kvkk').getAttribute('aria-invalid'), 'true');
  assert.match(form.querySelector('[data-lk-status]').textContent, /aydınlatma/);
  assert.equal(form.querySelector('button').disabled, false);
});

test('minified build behaves the same and stays small', async (t) => {
  if (!fs.existsSync(MINIFIED)) return t.skip('run npm run build');
  const code = fs.readFileSync(MINIFIED, 'utf8');
  assert.ok(code.length < 7000, `minified size ${code.length}`);
  const { document } = await run({ fetchImpl: okApi, code });
  assert.equal(document.querySelectorAll('#menu article').length, 2);
});
