'use strict';

/**
 * Loads three fictional demo businesses for the example pages in examples/.
 *
 *   npm run seed:demo                  -> creates them (skips existing ones)
 *   npm run seed:demo -- --reset       -> deletes and recreates them
 *   npm run seed:demo -- --password x  -> use one known password for all demo owners (local demos only)
 */
const { boot, args } = require('../scripts/_cli');
const { generatePassword } = require('../src/db/repo/users');

const opts = args({
  reset: { type: 'boolean', default: false },
  password: { type: 'string' },
});

const weekdays = (open, close, sunday = null) =>
  Array.from({ length: 7 }, (_, i) =>
    i === 6
      ? sunday
        ? { open: sunday[0], close: sunday[1], closed: false }
        : { open, close, closed: true }
      : { open, close, closed: false },
  );

const DEMOS = [
  {
    site: {
      slug: 'cinaralti-lokanta',
      name: 'Çınaraltı Lokantası',
      contact_email: 'lokanta@example.com',
      phone: '0555 010 20 30',
      whatsapp: '0555 010 20 30',
      address: 'Örnek Mahallesi, Çınar Sokak No:1, Ankara',
      opening_hours: weekdays('11:00', '22:00', ['12:00', '21:00']),
      collections: ['menu', 'campaigns'],
      color_primary: '#7C2D12',
      color_secondary: '#F59E0B',
      font_family: 'Georgia',
    },
    owner: 'lokanta@example.com',
    items: {
      menu: [
        ['Adana Kebap', 'Odun ateşinde, közlenmiş biber ve domatesle.', '320', 'kebap'],
        ['Lahmacun', 'İnce hamur, bol yeşillik ve limonla.', '95', 'lahmacun'],
        ['Mercimek Çorbası', 'Günlük, tereyağlı.', '80', 'mercimek'],
        ['Künefe', 'Hatay peyniriyle, sıcak servis.', '160', 'kunefe'],
        ['Ayran', 'Yayık ayranı.', '35', 'ayran'],
      ],
      campaigns: [['Öğle menüsü', 'Hafta içi 12:00–15:00: çorba + ana yemek + ayran 299 TL.', '']],
    },
    messages: [
      ['Elif', '0555 111 22 33', 'Cumartesi akşam 20:00 için 4 kişilik masa ayırabilir miyiz?'],
      ['Murat', '', 'Paket servisiniz var mı? Hangi saatlere kadar?', 'murat@example.com'],
    ],
  },
  {
    site: {
      slug: 'berber-ahmet',
      name: 'Berber Ahmet',
      contact_email: 'ahmet@example.com',
      phone: '0555 040 50 60',
      whatsapp: '0555 040 50 60',
      address: 'Örnek Mahallesi, Berber Sokak No:7, İzmir',
      opening_hours: weekdays('09:00', '20:00'),
      collections: ['services', 'campaigns'],
      color_primary: '#111827',
      color_secondary: '#D4A373',
      font_family: 'Segoe UI',
    },
    owner: 'ahmet@example.com',
    items: {
      services: [
        ['Saç kesimi', 'Yıkama ve fön dahil.', '250', 'sac-kesim'],
        ['Sakal tıraşı', 'Sıcak havlu ile.', '150', 'sakal'],
        ['Saç + sakal', 'İkisi bir arada.', '350', 'sac-kesim'],
        ['Çocuk tıraşı', '12 yaş altı.', '180', 'cocuk'],
      ],
      campaigns: [['Öğrenci indirimi', 'Hafta içi öğrenci kimliğiyle saç kesiminde %15 indirim.', '']],
    },
    messages: [['Can', '0555 222 33 44', 'Perşembe 18:00 için saç + sakal randevusu alabilir miyim?']],
  },
  {
    site: {
      slug: 'yildiz-kuruyemis',
      name: 'Yıldız Kuruyemiş',
      contact_email: 'yildiz@example.com',
      phone: '0555 070 80 90',
      whatsapp: '0555 070 80 90',
      address: 'Örnek Çarşısı No:12, Bursa',
      opening_hours: weekdays('08:00', '21:00', ['10:00', '18:00']),
      collections: ['products', 'campaigns'],
      color_primary: '#166534',
      color_secondary: '#FACC15',
      font_family: 'Trebuchet MS',
    },
    owner: 'yildiz@example.com',
    items: {
      products: [
        ['Kavrulmuş fındık', '250 gr, günlük kavrulmuş.', '140', 'findik'],
        ['Antep fıstığı', '250 gr.', '260', 'antep'],
        ['Fıstıklı lokum', '500 gr kutu.', '190', 'lokum'],
        ['Türk kahvesi', '100 gr, taze çekilmiş.', '75', 'kahve'],
      ],
      campaigns: [['Bu hafta: 1 kg fındık alana 100 gr kahve hediye!', '', '']],
    },
    messages: [],
  },
];

const { config, db, repos } = boot();
const origins = [config.publicOrigin, 'http://localhost:5500', 'http://127.0.0.1:5500'];
const created = [];

db.transaction(() => {
  for (const demo of DEMOS) {
    const existing = repos.sites.findBySlug(demo.site.slug);
    if (existing && !opts.reset) continue;
    if (existing) {
      repos.sites.remove(existing.id);
      const user = repos.users.findByEmail(demo.owner);
      if (user) db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    }

    const site = repos.sites.create({ ...demo.site, domains: origins });
    for (const [collection, rows] of Object.entries(demo.items)) {
      for (const [title, description, price, image] of rows) {
        repos.items.create(site.id, {
          collection,
          title,
          description,
          price_cents: price ? Number(price) * 100 : null,
          image: image ? `/examples/assets/${image}.svg` : null,
        });
      }
    }
    for (const [name, phone, message, email] of demo.messages) {
      repos.messages.create(site.id, { name, phone, email, message, kvkk: true });
    }
    const password = opts.password || generatePassword();
    repos.users.create({ email: demo.owner, password, siteId: site.id, mustChange: false });
    created.push({ site, email: demo.owner, password });
  }
})();
db.close();

if (!created.length) {
  console.log('\n  Demo siteleri zaten var. Yeniden oluşturmak için: npm run seed:demo -- --reset\n');
} else {
  console.log('\n  ✓ Demo verisi yüklendi (hayali işletmeler)\n');
  for (const { site, email, password } of created) {
    console.log(`  ${site.name}`);
    console.log(`    Sayfa : ${config.publicUrl}/examples/${{ 'cinaralti-lokanta': 'restoran', 'berber-ahmet': 'berber', 'yildiz-kuruyemis': 'dukkan' }[site.slug]}/`);
    console.log(`    Panel : ${config.publicUrl}/admin/${site.slug}`);
    console.log(`    Giriş : ${email} / ${password}\n`);
  }
}
