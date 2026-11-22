/*! landing-kit.js | MIT | https://github.com/poyrazavsever/landing-kit */
(function () {
  'use strict';
  var script = document.currentScript || document.querySelector('script[data-site]');
  if (!script || !script.getAttribute('data-site')) return;

  var api = (script.getAttribute('data-api') || new URL(script.src, location.href).origin).replace(
    /\/+$/,
    '',
  );
  var base = api + '/api/sites/' + encodeURIComponent(script.getAttribute('data-site'));
  var DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  // ₺150 for whole amounts, ₺149,90 otherwise (Turkish format).
  var money = {
    format: function (value) {
      var whole = Math.round(value * 100) % 100 === 0;
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2,
      }).format(value);
    },
  };

  function all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function get(path) {
    return fetch(base + path, { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function emit(target, name, detail) {
    target.dispatchEvent(new CustomEvent('lk:' + name, { bubbles: true, detail: detail }));
  }
  function abs(url) {
    return url && url.charAt(0) === '/' ? api + url : url;
  }
  function digits(v) {
    return String(v || '').replace(/[^\d+]/g, '');
  }
  function whatsapp(v) {
    var d = digits(v).replace(/^\+/, '');
    if (d.charAt(0) === '0') d = '90' + d.slice(1);
    else if (d.length === 10) d = '90' + d;
    return 'https://wa.me/' + d;
  }
  var HREF = {
    phone: function (v) {
      return 'tel:' + digits(v);
    },
    whatsapp: whatsapp,
    email: function (v) {
      return 'mailto:' + v;
    },
    maps: function (v) {
      return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v);
    },
  };

  /** "Pazartesi–Cuma: 09:00–19:00" lines, consecutive identical days grouped. */
  function hourLines(hours) {
    var groups = [];
    (hours || []).forEach(function (h, i) {
      var label = h.closed ? 'Kapalı' : h.open + '–' + h.close;
      var last = groups[groups.length - 1];
      if (last && last.label === label) last.to = i;
      else groups.push({ from: i, to: i, label: label });
    });
    return groups.map(function (g) {
      return (g.from === g.to ? DAYS[g.from] : DAYS[g.from] + '–' + DAYS[g.to]) + ': ' + g.label;
    });
  }

  function renderHours(el, site) {
    var lines = hourLines(site.hours);
    if (!lines.length) return;
    el.textContent = '';
    var list = el.tagName === 'UL' || el.tagName === 'OL';
    lines.forEach(function (line, i) {
      if (list) {
        var li = document.createElement('li');
        li.textContent = line;
        el.appendChild(li);
      } else {
        if (i) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(line));
      }
    });
  }

  function fillSite(site) {
    all('[data-lk]').forEach(function (el) {
      var key = el.getAttribute('data-lk');
      if (key === 'hours') return renderHours(el, site);
      var value = site[key];
      if (value !== null && value !== undefined && value !== '') el.textContent = value;
    });
    all('[data-lk-href]').forEach(function (el) {
      var key = el.getAttribute('data-lk-href');
      var value = site[key === 'maps' ? 'address' : key];
      if (value && HREF[key]) el.setAttribute('href', HREF[key](value));
    });
  }

  function renderItem(tpl, item) {
    var frag = tpl.content.cloneNode(true);
    all('[data-lk-field]', frag).forEach(function (el) {
      var key = el.getAttribute('data-lk-field');
      var value = item[key];
      if (key === 'price' && value !== null && value !== undefined) value = money.format(value);
      if (value === null || value === undefined || value === '') {
        el.hidden = true;
        return;
      }
      if (el.tagName === 'IMG') {
        el.src = abs(value);
        if (!el.getAttribute('alt')) el.alt = item.title || '';
        if (!el.getAttribute('loading')) el.setAttribute('loading', 'lazy');
      } else if (key === 'image') {
        el.style.backgroundImage = 'url("' + abs(value).replace(/["\\]/g, '') + '")';
      } else {
        el.textContent = value;
      }
    });
    if (frag.firstElementChild) frag.firstElementChild.setAttribute('data-lk-id', item.id);
    return frag;
  }

  /** Replaces the static fallback content of a [data-lk-list] with live items. */
  function fillList(el) {
    var tpl = el.querySelector('template');
    if (!tpl) return Promise.resolve();
    var collection = el.getAttribute('data-lk-list');
    return get('/items?collection=' + encodeURIComponent(collection)).then(function (data) {
      var limit = Number(el.getAttribute('data-lk-limit')) || data.items.length;
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node !== tpl) el.removeChild(node);
      });
      data.items.slice(0, limit).forEach(function (item) {
        el.appendChild(renderItem(tpl, item));
      });
      if (!data.items.length && el.getAttribute('data-lk-empty')) {
        var p = document.createElement('p');
        p.className = 'lk-empty';
        p.textContent = el.getAttribute('data-lk-empty');
        el.appendChild(p);
      }
      el.setAttribute('data-lk-state', 'loaded');
      emit(el, 'list', { collection: collection, items: data.items });
    });
  }

  function status(form, kind, text) {
    var box = form.querySelector('[data-lk-status]');
    if (!box) {
      box = document.createElement('p');
      box.setAttribute('data-lk-status', '');
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      form.appendChild(box);
    }
    box.className = 'lk-status lk-' + kind;
    box.textContent = text;
    form.setAttribute('data-lk-state', kind);
  }

  function bindForm(form) {
    if (form.__lk) return;
    form.__lk = true;
    if (!form.querySelector('[name="website"]')) {
      // Honeypot: invisible to people, tempting for bots.
      var hp = document.createElement('input');
      hp.type = 'text';
      hp.name = 'website';
      hp.tabIndex = -1;
      hp.autocomplete = 'off';
      hp.setAttribute('aria-hidden', 'true');
      hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
      form.appendChild(hp);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) {
        data[k] = v;
      });
      var kvkk = form.querySelector('[name="kvkk"]');
      if (kvkk) data.kvkk = kvkk.checked;
      var button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      all('[aria-invalid]', form).forEach(function (el) {
        el.removeAttribute('aria-invalid');
      });
      status(form, 'sending', form.getAttribute('data-lk-sending') || 'Gönderiliyor…');

      fetch(base + '/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (r) {
          return r
            .json()
            .catch(function () {
              return {};
            })
            .then(function (body) {
              if (!r.ok) throw body;
              return body;
            });
        })
        .then(function () {
          form.reset();
          status(
            form,
            'success',
            form.getAttribute('data-lk-success') || 'Mesajınız iletildi. Teşekkürler!',
          );
          emit(form, 'sent', data);
        })
        .catch(function (err) {
          var errors = (err && err.errors) || {};
          Object.keys(errors).forEach(function (name) {
            var field = form.querySelector('[name="' + name + '"]');
            if (field) field.setAttribute('aria-invalid', 'true');
          });
          var first = errors[Object.keys(errors)[0]];
          var text =
            first ||
            (err && err.message) ||
            form.getAttribute('data-lk-error') ||
            'Mesaj gönderilemedi. Lütfen bizi telefonla arayın.';
          status(form, 'error', text);
          emit(form, 'error', err);
        })
        .then(function () {
          if (button) button.disabled = false;
        });
    });
  }

  function load() {
    var root = document.documentElement;
    all('[data-lk-form="contact"]').forEach(bindForm);
    var jobs = [
      get('').then(function (site) {
        fillSite(site);
        window.LandingKit.site = site;
      }),
    ].concat(all('[data-lk-list]').map(fillList));
    return Promise.all(jobs).then(
      function () {
        root.classList.add('lk-ready');
        emit(document, 'loaded', window.LandingKit.site);
      },
      function (err) {
        // API unreachable: the static fallback content simply stays on the page.
        root.classList.add('lk-offline');
        emit(document, 'error', err);
      },
    );
  }

  window.LandingKit = { reload: load, site: null, api: api };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
