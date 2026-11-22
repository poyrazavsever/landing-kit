/* landing-kit admin panel: small vanilla SPA with hash routing.
   All user content goes through textContent (never innerHTML) to stay XSS-safe. */
(function () {
  'use strict';

  var DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  var DEFAULT_LOGO = '/admin/landing-kit-mark.svg';
  var MAX_IMAGE_SIDE = 1600;
  var money = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  var state = {
    slug: decodeURIComponent(
      (location.pathname.match(/^\/admin\/([a-z0-9-]+)\/?$/) || [])[1] || '',
    ),
    user: null,
    sites: [],
    site: null,
    csrf: null,
  };

  var main = document.getElementById('main');
  var topbar = document.getElementById('topbar');

  // ---- Helpers --------------------------------------------------------------

  /** h('div.card', {onclick: fn}, child, 'text') -> element */
  function h(tag, attrs) {
    var parts = tag.split('.');
    var el = document.createElement(parts[0]);
    if (parts.length > 1) el.className = parts.slice(1).join(' ');
    var children = Array.prototype.slice.call(arguments, 2);
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
      children.unshift(attrs);
      attrs = null;
    }
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key.indexOf('on') === 0) el.addEventListener(key.slice(2), value);
      else if (key === 'text') el.textContent = value;
      else if (key in el && key !== 'list' && key !== 'form') el[key] = value;
      else el.setAttribute(key, value === true ? '' : value);
    });
    append(el, children);
    return el;
  }
  function append(el, children) {
    children.forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      if (Array.isArray(child)) return append(el, child);
      el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    });
  }

  function render() {
    main.textContent = '';
    append(main, Array.prototype.slice.call(arguments));
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  var toastTimer;
  function toast(text, isError) {
    var el = document.getElementById('toast');
    el.textContent = text;
    el.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.className = 'toast';
    }, 3200);
  }

  function api(method, url, body) {
    var opts = {
      method: method,
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    };
    if (state.csrf) opts.headers['X-CSRF-Token'] = state.csrf;
    if (body instanceof FormData) opts.body = body;
    else if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          if (res.ok) return data;
          var err = new Error(data.message || 'Bir hata oluştu.');
          err.status = res.status;
          err.code = data.error;
          err.errors = data.errors || {};
          throw err;
        });
    });
  }
  function siteApi(method, path, body) {
    return api(method, '/admin/api/sites/' + encodeURIComponent(state.slug) + path, body);
  }

  function handleError(err) {
    if (err.status === 401) return showLogin();
    if (err.code === 'password_change_required') return go('#/sifre');
    toast(err.message || 'Bağlantı hatası. İnternetinizi kontrol edin.', true);
  }

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  }

  function showErrors(form, errors) {
    form.querySelectorAll('.error').forEach(function (el) {
      el.remove();
    });
    form.querySelectorAll('[aria-invalid]').forEach(function (el) {
      el.removeAttribute('aria-invalid');
    });
    var first = null;
    Object.keys(errors || {}).forEach(function (name) {
      var field = form.querySelector('[name="' + name.split('.')[0] + '"]');
      var msg = h('p.error', { id: 'err-' + name.replace(/\W/g, '-'), text: errors[name] });
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', msg.id);
        (field.closest('.field') || field.parentNode).appendChild(msg);
        first = first || field;
      } else {
        form.insertBefore(msg, form.firstChild);
      }
    });
    if (first) first.focus();
  }

  // ---- Theming (siteye özel) -----------------------------------------------

  function hexToRgb(hex) {
    var m = String(hex || '').replace('#', '');
    if (m.length === 3) m = m.replace(/(.)/g, '$1$1');
    if (!/^[0-9a-f]{6}$/i.test(m)) return null;
    return [0, 2, 4].map(function (i) {
      return parseInt(m.slice(i, i + 2), 16);
    });
  }
  function luminance(rgb) {
    var c = rgb.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var l1 = luminance(a);
    var l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function toHex(rgb) {
    return (
      '#' +
      rgb
        .map(function (v) {
          return ('0' + Math.round(v).toString(16)).slice(-2);
        })
        .join('')
    );
  }
  /** Darkens a color until it reaches 4.5:1 on white, so brand-colored text stays readable. */
  function readableOnWhite(rgb) {
    var c = rgb.slice();
    for (var i = 0; i < 20 && contrast(c, [255, 255, 255]) < 4.5; i++) {
      c = c.map(function (v) {
        return v * 0.88;
      });
    }
    return c;
  }

  function applyTheme(site) {
    var theme = (site && site.theme) || {};
    var root = document.documentElement.style;
    var brand = hexToRgb(theme.primary);
    if (brand) {
      root.setProperty('--brand', toHex(brand));
      root.setProperty('--brand-ink', toHex(readableOnWhite(brand)));
      root.setProperty(
        '--on-brand',
        contrast(brand, [255, 255, 255]) >= contrast(brand, [14, 21, 37]) ? '#ffffff' : '#0e1525',
      );
      root.setProperty(
        '--brand-soft',
        toHex(
          brand.map(function (v) {
            return v + (255 - v) * 0.9;
          }),
        ),
      );
      document.querySelector('meta[name="theme-color"]').setAttribute('content', toHex(brand));
    }
    var accent = hexToRgb(theme.secondary);
    if (accent) root.setProperty('--brand-2', toHex(accent));
    if (theme.font) {
      root.setProperty(
        '--font',
        '"' +
          String(theme.font).replace(/["\\]/g, '') +
          '", Inter, "Segoe UI", system-ui, sans-serif',
      );
    }
    var logo = theme.logo || DEFAULT_LOGO;
    document.getElementById('brand-logo').src = logo;
    document.getElementById('brand-name').textContent = (site && site.name) || 'Yönetim Paneli';
    document.title = ((site && site.name) || 'landing-kit') + ' · Yönetim Paneli';
  }

  // ---- Screens ---------------------------------------------------------------

  function showLogin(message) {
    topbar.hidden = true;
    state.user = null;
    var site = state.site;
    var form = h(
      'form.card',
      { novalidate: true },
      h(
        'label.field',
        h('span', 'E-posta adresiniz'),
        h('input', {
          type: 'email',
          name: 'email',
          autocomplete: 'username',
          required: true,
          inputMode: 'email',
        }),
      ),
      h(
        'label.field',
        h('span', 'Şifreniz'),
        h('input', {
          type: 'password',
          name: 'password',
          autocomplete: 'current-password',
          required: true,
        }),
      ),
      h('button.btn.btn-block', { type: 'submit' }, 'Giriş yap'),
    );
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var button = form.querySelector('button');
      button.disabled = true;
      api('POST', '/admin/api/login', {
        email: form.email.value.trim(),
        password: form.password.value,
      })
        .then(function (data) {
          state.csrf = data.csrfToken;
          if (data.site && data.site !== state.slug && data.user.role !== 'superadmin') {
            location.href = '/admin/' + data.site;
            return;
          }
          return boot();
        })
        .catch(function (err) {
          button.disabled = false;
          showErrors(form, { password: err.message });
        });
    });
    render(
      h(
        'section.login',
        h('img.logo', { src: (site && site.theme && site.theme.logo) || DEFAULT_LOGO, alt: '' }),
        h('h1', (site && site.name) || 'Yönetim Paneli'),
        h('p.lead', message || 'Sitenizi güncellemek için giriş yapın.'),
        form,
        h(
          'p.login-foot',
          'Şifrenizi mi unuttunuz? Sitenizi kuran kişiye yazın, size yeni bir geçici şifre versin.',
        ),
      ),
    );
    form.email.focus();
  }

  function showPassword() {
    var forced = state.user && state.user.mustChangePassword;
    var form = h(
      'form.card',
      { novalidate: true },
      h(
        'label.field',
        h('span', forced ? 'Size verilen geçici şifre' : 'Şu anki şifreniz'),
        h('input', {
          type: 'password',
          name: 'current',
          autocomplete: 'current-password',
          required: true,
        }),
      ),
      h(
        'label.field',
        h('span', 'Yeni şifreniz'),
        h('input', {
          type: 'password',
          name: 'next',
          autocomplete: 'new-password',
          required: true,
          minLength: 8,
        }),
        h(
          'small.hint',
          'En az 8 karakter. Kolay hatırlayacağınız ama başkasının tahmin edemeyeceği bir şey seçin.',
        ),
      ),
      h('button.btn.btn-block', { type: 'submit' }, 'Şifremi kaydet'),
    );
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      api('POST', '/admin/api/password', { current: form.current.value, next: form.next.value })
        .then(function () {
          toast('Şifreniz değişti.');
          state.user.mustChangePassword = false;
          go('#/');
        })
        .catch(function (err) {
          if (err.status === 400) return showErrors(form, err.errors);
          handleError(err);
        });
    });
    render(
      forced ? null : h('a.back', { href: '#/' }, '← Ana sayfa'),
      h('h1', forced ? 'Önce kendi şifrenizi belirleyin' : 'Şifremi değiştir'),
      h('p.lead', forced ? 'Bu ilk girişiniz. Size verilen geçici şifreyi değiştirelim.' : ''),
      form,
    );
  }

  function showSitePicker() {
    applyTheme(null);
    render(
      h('h1', 'Siteler'),
      h('p.lead', 'Yönetmek istediğiniz işletmeyi seçin.'),
      state.sites.length
        ? h(
            'div.tiles',
            state.sites.map(function (s) {
              return h(
                'a.tile',
                { href: '/admin/' + s.slug },
                h('strong', s.name),
                h('span', '/' + s.slug),
              );
            }),
          )
        : h('p.empty', 'Henüz site yok. Sunucuda "npm run site:create" komutuyla ekleyin.'),
    );
  }

  function showHome() {
    var site = state.site;
    var tiles = site.collections.map(function (c) {
      return h(
        'a.tile',
        { href: '#/c/' + c.key },
        h('strong', c.label),
        h(
          'span',
          c.total ? c.active + ' görünür · ' + (c.total - c.active) + ' gizli' : 'Henüz kayıt yok',
        ),
      );
    });
    tiles.push(
      h(
        'a.tile.accent',
        { href: '#/mesajlar' },
        h(
          'strong',
          'Mesajlar ',
          site.unreadMessages ? h('span.badge.new', site.unreadMessages + ' yeni') : null,
        ),
        h('span', 'Siteden gelen iletişim formları'),
      ),
      h(
        'a.tile',
        { href: '#/bilgiler' },
        h('strong', 'İşletme bilgileri'),
        h('span', 'Telefon, adres, çalışma saatleri'),
      ),
      h(
        'a.tile',
        { href: '#/sifre' },
        h('strong', 'Şifremi değiştir'),
        h('span', 'Giriş şifrenizi yenileyin'),
      ),
    );
    render(
      state.user.role === 'superadmin' ? h('a.back', { href: '/admin/' }, '← Bütün siteler') : null,
      h('h1', 'Merhaba!'),
      h('p.lead', 'Ne yapmak istersiniz? Yaptığınız değişiklikler sitede hemen görünür.'),
      h('div.tiles', tiles),
    );
  }

  function collectionOf(key) {
    return (
      state.site.collections.find(function (c) {
        return c.key === key;
      }) || { key: key, label: key }
    );
  }

  function showCollection(key) {
    var col = collectionOf(key);
    render(
      h('a.back', { href: '#/' }, '← Ana sayfa'),
      h('h1', col.label),
      h('p.loading', 'Yükleniyor…'),
    );
    siteApi('GET', '/items?collection=' + encodeURIComponent(key))
      .then(function (data) {
        var items = data.items;
        var list = h('ul.items');

        function move(index, delta) {
          var target = index + delta;
          if (target < 0 || target >= items.length) return;
          var ids = items.map(function (i) {
            return i.id;
          });
          var tmp = ids[index];
          ids[index] = ids[target];
          ids[target] = tmp;
          siteApi('POST', '/items/reorder', { collection: key, ids: ids })
            .then(function () {
              toast('Sıralama kaydedildi.');
              showCollection(key);
            })
            .catch(handleError);
        }

        items.forEach(function (item, index) {
          var toggle = h(
            'button.btn.btn-secondary.btn-small',
            {
              type: 'button',
              onclick: function () {
                siteApi('PATCH', '/items/' + item.id, { active: !item.active })
                  .then(function () {
                    toast(
                      item.active
                        ? '"' + item.title + '" gizlendi.'
                        : '"' + item.title + '" artık sitede.',
                    );
                    showCollection(key);
                  })
                  .catch(handleError);
              },
            },
            item.active ? 'Gizle' : 'Göster',
          );
          list.appendChild(
            h(
              'li.card.item' + (item.active ? '' : '.is-hidden'),
              item.image
                ? h('img.thumb', { src: item.image, alt: '' })
                : h('div.thumb', { 'aria-hidden': 'true' }, item.title.charAt(0).toUpperCase()),
              h(
                'div',
                h('p.item-title', item.title),
                h(
                  'p.item-meta',
                  item.price !== null ? h('span', money.format(item.price)) : null,
                  item.active ? h('span.badge', 'Sitede') : h('span.badge.off', 'Gizli'),
                ),
              ),
              h(
                'div.item-actions',
                h('a.btn.btn-small', { href: '#/c/' + key + '/' + item.id }, 'Düzenle'),
                toggle,
                h(
                  'button.btn.btn-secondary.btn-small.btn-icon',
                  {
                    type: 'button',
                    'aria-label': '"' + item.title + '" yukarı taşı',
                    disabled: index === 0,
                    onclick: function () {
                      move(index, -1);
                    },
                  },
                  '↑',
                ),
                h(
                  'button.btn.btn-secondary.btn-small.btn-icon',
                  {
                    type: 'button',
                    'aria-label': '"' + item.title + '" aşağı taşı',
                    disabled: index === items.length - 1,
                    onclick: function () {
                      move(index, 1);
                    },
                  },
                  '↓',
                ),
              ),
            ),
          );
        });

        render(
          h('a.back', { href: '#/' }, '← Ana sayfa'),
          h('h1', col.label),
          h(
            'p.lead',
            items.length ? 'Sırayı oklarla değiştirebilirsiniz. Gizlenenler sitede görünmez.' : '',
          ),
          items.length ? list : h('p.empty', 'Burada henüz bir şey yok. İlk kaydı ekleyin.'),
          h('div.sticky-actions', h('a.btn', { href: '#/c/' + key + '/yeni' }, '+ Yeni ekle')),
        );
      })
      .catch(handleError);
  }

  /** Shrinks big phone photos before upload (keeps uploads fast on mobile data). */
  function shrinkImage(file) {
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !window.createImageBitmap)
        return resolve(file);
      createImageBitmap(file)
        .then(function (bitmap) {
          var scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
          if (scale === 1 && file.size < 1.5 * 1024 * 1024) return resolve(file);
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(bitmap.width * scale);
          canvas.height = Math.round(bitmap.height * scale);
          canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            function (blob) {
              resolve(blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : file);
            },
            'image/jpeg',
            0.85,
          );
        })
        .catch(function () {
          resolve(file);
        });
    });
  }

  function photoPicker(current, onChange) {
    var preview = h('img.photo-preview', {
      alt: 'Seçilen fotoğraf',
      src: current || undefined,
      hidden: !current,
    });
    var status = h('p.hint', { 'aria-live': 'polite' });
    var removeBtn = h(
      'button.btn.btn-danger.btn-small',
      {
        type: 'button',
        hidden: !current,
        onclick: function () {
          preview.hidden = true;
          removeBtn.hidden = true;
          onChange('');
        },
      },
      'Fotoğrafı kaldır',
    );

    function picker(label, capture) {
      var input = h('input.visually-hidden', { type: 'file', accept: 'image/*', tabIndex: -1 });
      if (capture) input.setAttribute('capture', 'environment');
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) return;
        status.textContent = 'Fotoğraf yükleniyor…';
        shrinkImage(file)
          .then(function (small) {
            var data = new FormData();
            data.append('image', small, small.name || 'foto.jpg');
            return siteApi('POST', '/uploads', data);
          })
          .then(function (res) {
            preview.src = res.path;
            preview.hidden = false;
            removeBtn.hidden = false;
            status.textContent = 'Fotoğraf yüklendi. Kaydetmeyi unutmayın.';
            onChange(res.path);
          })
          .catch(function (err) {
            status.textContent = '';
            handleError(err);
          });
        input.value = '';
      });
      var button = h(
        'button.btn.btn-secondary',
        {
          type: 'button',
          onclick: function () {
            input.click();
          },
        },
        label,
      );
      return [button, input];
    }

    return h(
      'div.field.photo',
      h('span.label', 'Fotoğraf'),
      preview,
      h(
        'div.photo-buttons',
        picker('Fotoğraf çek', true),
        picker('Galeriden seç', false),
        removeBtn,
      ),
      status,
    );
  }

  function showItemForm(key, id) {
    var col = collectionOf(key);
    var isNew = id === 'yeni';
    var load = isNew
      ? Promise.resolve({ title: '', description: '', price: null, image: '', active: true })
      : siteApi('GET', '/items?collection=' + encodeURIComponent(key)).then(function (data) {
          var found = data.items.find(function (i) {
            return String(i.id) === String(id);
          });
          if (!found) throw new Error('Kayıt bulunamadı.');
          return found;
        });

    load
      .then(function (item) {
        var image = item.image || '';
        var form = h(
          'form',
          { novalidate: true },
          h(
            'div.card',
            photoPicker(image, function (path) {
              image = path;
            }),
            h(
              'label.field',
              h('span', 'Başlık'),
              h('input', {
                type: 'text',
                name: 'title',
                value: item.title,
                required: true,
                maxLength: 120,
              }),
              h(
                'small.hint',
                key === 'campaigns' ? 'Örn: Hafta içi öğrenciye %10 indirim' : 'Örn: Adana Kebap',
              ),
            ),
            h(
              'label.field',
              h('span', 'Açıklama (isteğe bağlı)'),
              h(
                'textarea',
                { name: 'description', maxLength: 1000, rows: 3 },
                item.description || '',
              ),
            ),
            h(
              'label.field',
              h('span', 'Fiyat (isteğe bağlı)'),
              h(
                'div.price',
                h('input', {
                  type: 'text',
                  name: 'price',
                  inputMode: 'decimal',
                  value:
                    item.price === null || item.price === undefined
                      ? ''
                      : String(item.price).replace('.', ','),
                  placeholder: 'Örn: 150 veya 149,90',
                }),
              ),
            ),
            h(
              'label.switch',
              h('input', { type: 'checkbox', name: 'active', checked: item.active }),
              'Sitede göster',
            ),
          ),
          isNew
            ? null
            : h(
                'button.btn.btn-danger.btn-block',
                {
                  type: 'button',
                  onclick: function () {
                    if (
                      !confirm(
                        '"' +
                          item.title +
                          '" silinsin mi? Bu işlem geri alınamaz. Sadece saklamak istiyorsanız "Sitede göster" kutusunu kaldırın.',
                      )
                    )
                      return;
                    siteApi('DELETE', '/items/' + item.id)
                      .then(function () {
                        toast('Silindi.');
                        go('#/c/' + key);
                      })
                      .catch(handleError);
                  },
                },
                'Sil',
              ),
          h('div.sticky-actions', h('button.btn', { type: 'submit' }, isNew ? 'Ekle' : 'Kaydet')),
        );

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var body = {
            title: form.title.value,
            description: form.description.value,
            price: form.price.value,
            image: image,
            active: form.active.checked,
          };
          if (isNew) body.collection = key;
          var button = form.querySelector('[type="submit"]');
          button.disabled = true;
          (isNew ? siteApi('POST', '/items', body) : siteApi('PATCH', '/items/' + item.id, body))
            .then(function () {
              toast(isNew ? 'Eklendi. Sitede görünüyor.' : 'Kaydedildi.');
              go('#/c/' + key);
            })
            .catch(function (err) {
              button.disabled = false;
              if (err.status === 400) return showErrors(form, err.errors);
              handleError(err);
            });
        });

        render(
          h('a.back', { href: '#/c/' + key }, '← ' + col.label),
          h('h1', isNew ? 'Yeni ekle' : 'Düzenle'),
          form,
        );
      })
      .catch(handleError);
  }

  function showMessages() {
    render(
      h('a.back', { href: '#/' }, '← Ana sayfa'),
      h('h1', 'Mesajlar'),
      h('p.loading', 'Yükleniyor…'),
    );
    siteApi('GET', '/messages')
      .then(function (data) {
        state.site.unreadMessages = data.unread;
        var list = data.messages.map(function (m) {
          var digits = String(m.phone || '').replace(/[^\d+]/g, '');
          var wa = digits.replace(/^\+/, '').replace(/^0/, '90');
          return h(
            'article.card.msg' + (m.read ? '' : '.unread'),
            h(
              'div.msg-head',
              h(
                'strong',
                m.name,
                m.read ? null : h('span.badge.new', { style: 'margin-left:8px' }, 'Yeni'),
              ),
              h('time', { dateTime: m.created_at }, formatDate(m.created_at)),
            ),
            h('p.msg-body', m.message),
            h(
              'div.item-actions',
              m.phone ? h('a.btn.btn-small', { href: 'tel:' + digits }, 'Ara') : null,
              m.phone
                ? h(
                    'a.btn.btn-secondary.btn-small',
                    { href: 'https://wa.me/' + wa, target: '_blank', rel: 'noopener' },
                    'WhatsApp',
                  )
                : null,
              m.email
                ? h('a.btn.btn-secondary.btn-small', { href: 'mailto:' + m.email }, 'E-posta')
                : null,
              h(
                'button.btn.btn-secondary.btn-small',
                {
                  type: 'button',
                  onclick: function () {
                    siteApi('PATCH', '/messages/' + m.id, { read: !m.read })
                      .then(showMessages)
                      .catch(handleError);
                  },
                },
                m.read ? 'Okunmadı yap' : 'Okundu',
              ),
              h(
                'button.btn.btn-danger.btn-small',
                {
                  type: 'button',
                  onclick: function () {
                    if (!confirm(m.name + ' kişisinin mesajı silinsin mi?')) return;
                    siteApi('DELETE', '/messages/' + m.id)
                      .then(showMessages)
                      .catch(handleError);
                  },
                },
                'Sil',
              ),
            ),
            m.phone || m.email ? h('p.hint', [m.phone, m.email].filter(Boolean).join(' · ')) : null,
          );
        });
        render(
          h('a.back', { href: '#/' }, '← Ana sayfa'),
          h('h1', 'Mesajlar'),
          h(
            'p.lead',
            data.unread ? data.unread + ' okunmamış mesajınız var.' : 'Bütün mesajlar okundu.',
          ),
          list.length
            ? list
            : h('p.empty', 'Henüz mesaj yok. Sitenizdeki formdan gelen mesajlar burada görünür.'),
        );
      })
      .catch(handleError);
  }

  function showSiteInfo() {
    var site = state.site;
    var isSuper = state.user.role === 'superadmin';
    var hours = (
      site.opening_hours && site.opening_hours.length === 7
        ? site.opening_hours
        : DAYS.map(function () {
            return { open: '09:00', close: '19:00', closed: false };
          })
    ).map(function (d) {
      return { open: d.open, close: d.close, closed: d.closed };
    });

    function text(name, label, value, opts) {
      opts = opts || {};
      return h(
        'label.field',
        h('span', label),
        h(
          opts.multiline ? 'textarea' : 'input',
          {
            type: opts.multiline ? undefined : opts.type || 'text',
            name: name,
            value: opts.multiline ? undefined : value || '',
            inputMode: opts.inputMode,
            autocomplete: 'off',
            rows: opts.multiline ? 3 : undefined,
          },
          opts.multiline ? value || '' : null,
        ),
        opts.hint ? h('small.hint', opts.hint) : null,
      );
    }

    var hourRows = hours.map(function (d, i) {
      var open = h('input', {
        type: 'time',
        value: d.open,
        'aria-label': DAYS[i] + ' açılış',
        name: 'opening_hours',
      });
      var close = h('input', { type: 'time', value: d.close, 'aria-label': DAYS[i] + ' kapanış' });
      var closed = h('input', { type: 'checkbox', checked: d.closed });
      var row = h(
        'div.hours-row' + (d.closed ? '.closed' : ''),
        h('span.day', DAYS[i]),
        h('label.switch', closed, 'Kapalı'),
        open,
        close,
      );
      function sync() {
        d.open = open.value;
        d.close = close.value;
        d.closed = closed.checked;
        row.classList.toggle('closed', d.closed);
        open.disabled = close.disabled = d.closed;
      }
      [open, close, closed].forEach(function (el) {
        el.addEventListener('change', sync);
      });
      open.disabled = close.disabled = d.closed;
      return row;
    });

    var theme = site.theme || {};
    var superFields = isSuper
      ? h(
          'div.card',
          h('h2', { style: 'margin-top:0' }, 'Tema ve teknik ayarlar'),
          h('p.hint', 'Bu bölümü sadece siz (yönetici) görürsünüz.'),
          text(
            'domains',
            'İzinli alan adları (her satıra bir tane)',
            (site.domains || []).join('\n'),
            {
              multiline: true,
              hint: 'Örn: berberahmet.com veya http://localhost:5500',
            },
          ),
          text(
            'collections',
            'Bölümler (virgülle)',
            site.collections
              .map(function (c) {
                return c.key;
              })
              .join(', '),
            { hint: 'Örn: menu, campaigns, services, products, gallery' },
          ),
          h(
            'label.field',
            h('span', 'Ana renk'),
            h('input', { type: 'color', name: 'color_primary', value: theme.primary || '#1f4fff' }),
          ),
          h(
            'label.field',
            h('span', 'İkinci renk'),
            h('input', {
              type: 'color',
              name: 'color_secondary',
              value: theme.secondary || '#ffb020',
            }),
          ),
          text('font_family', 'Yazı tipi', theme.font || '', {
            hint: 'Cihazda yüklü olan bir yazı tipi adı. Örn: Poppins',
          }),
          text('logo_path', 'Logo yolu', theme.logo || '', {
            hint: '/uploads/... (aşağıdan yükleyebilirsiniz)',
          }),
          photoPicker(theme.logo, function (path) {
            document.querySelector('[name="logo_path"]').value = path;
          }),
          text('telegram_chat_id', 'Telegram chat id (isteğe bağlı)', site.telegram_chat_id || ''),
        )
      : null;

    var form = h(
      'form',
      { novalidate: true },
      h(
        'div.card',
        text('name', 'İşletme adı', site.name),
        text('phone', 'Telefon', site.phone, {
          type: 'tel',
          inputMode: 'tel',
          hint: 'Örn: 0555 123 45 67',
        }),
        text('whatsapp', 'WhatsApp numarası', site.whatsapp, { type: 'tel', inputMode: 'tel' }),
        text('contact_email', 'Mesajların geleceği e-posta', site.contact_email, {
          type: 'email',
          inputMode: 'email',
        }),
        text('address', 'Adres', site.address, { multiline: true }),
      ),
      h(
        'div.card',
        h('h2', { style: 'margin-top:0' }, 'Çalışma saatleri'),
        h('div.hours', hourRows),
        h(
          'div',
          { style: 'margin-top:16px' },
          text('hours_note', 'Not (isteğe bağlı)', site.hours_note, {
            hint: 'Örn: Bayramlarda kapalıyız.',
          }),
        ),
      ),
      superFields,
      h('div.sticky-actions', h('button.btn', { type: 'submit' }, 'Kaydet')),
    );

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var body = {
        name: form.name.value,
        phone: form.phone.value,
        whatsapp: form.whatsapp.value,
        contact_email: form.contact_email.value,
        address: form.address.value,
        hours_note: form.hours_note.value,
        opening_hours: hours,
      };
      if (isSuper) {
        body.domains = form.domains.value.split(/\s+/).filter(Boolean);
        body.collections = form.collections.value.split(/[\s,]+/).filter(Boolean);
        body.color_primary = form.color_primary.value;
        body.color_secondary = form.color_secondary.value;
        body.font_family = form.font_family.value;
        body.logo_path = form.logo_path.value;
        body.telegram_chat_id = form.telegram_chat_id.value;
      }
      siteApi('PATCH', '', body)
        .then(function (updated) {
          state.site = updated;
          applyTheme(updated);
          toast('Bilgiler kaydedildi.');
          go('#/');
        })
        .catch(function (err) {
          if (err.status === 400) return showErrors(form, err.errors);
          handleError(err);
        });
    });

    render(
      h('a.back', { href: '#/' }, '← Ana sayfa'),
      h('h1', 'İşletme bilgileri'),
      h('p.lead', 'Sitenizde görünen iletişim bilgileri ve çalışma saatleri.'),
      form,
    );
  }

  // ---- Router -----------------------------------------------------------------

  function route() {
    if (!state.user) return;
    if (state.user.mustChangePassword) return showPassword();
    if (!state.site) return showSitePicker();
    var parts = (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent);
    if (parts[0] === 'c' && parts[1] && parts[2]) return showItemForm(parts[1], parts[2]);
    if (parts[0] === 'c' && parts[1]) return showCollection(parts[1]);
    if (parts[0] === 'mesajlar') return showMessages();
    if (parts[0] === 'bilgiler') return showSiteInfo();
    if (parts[0] === 'sifre') return showPassword();
    // Refresh counts when returning home.
    return siteApi('GET', '')
      .then(function (site) {
        state.site = site;
        showHome();
      })
      .catch(handleError);
  }

  function boot() {
    return api('GET', '/admin/api/me')
      .then(function (me) {
        state.user = me.user;
        state.sites = me.sites;
        state.csrf = me.csrfToken;
        topbar.hidden = false;

        if (!state.slug) {
          if (me.user.role !== 'superadmin' && me.sites[0]) {
            location.replace('/admin/' + me.sites[0].slug);
            return;
          }
          state.site = null;
          return route();
        }
        if (me.user.mustChangePassword) return route();
        return siteApi('GET', '').then(function (site) {
          state.site = site;
          applyTheme(site);
          route();
        });
      })
      .catch(function (err) {
        if (err.status === 401) return showLogin();
        if (
          err.status === 403 &&
          state.user &&
          state.user.role !== 'superadmin' &&
          state.sites[0]
        ) {
          location.replace('/admin/' + state.sites[0].slug);
          return;
        }
        handleError(err);
      });
  }

  document.getElementById('logout').addEventListener('click', function () {
    api('POST', '/admin/api/logout').finally(function () {
      state.csrf = null;
      showLogin('Çıkış yaptınız.');
    });
  });
  window.addEventListener('hashchange', route);

  // Brand the login screen before anyone logs in (public site info).
  var publicSite = state.slug
    ? fetch('/api/sites/' + encodeURIComponent(state.slug))
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .catch(function () {
          return null;
        })
    : Promise.resolve(null);
  publicSite.then(function (site) {
    if (site) {
      state.site = { name: site.name, theme: site.theme, collections: [] };
      applyTheme(state.site);
    }
    boot();
  });
})();
