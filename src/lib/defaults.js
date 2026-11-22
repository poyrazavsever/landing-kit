'use strict';

/** Human-friendly Turkish labels for well-known collections. Any other key also works. */
const COLLECTION_LABELS = {
  menu: 'Menü',
  services: 'Hizmetler',
  products: 'Ürünler',
  campaigns: 'Kampanyalar',
  gallery: 'Galeri',
  faq: 'Sık Sorulanlar',
};

const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

function defaultHours() {
  return DAY_NAMES.map((_, i) => ({ open: '09:00', close: '19:00', closed: i === 6 }));
}

function collectionLabel(key) {
  return COLLECTION_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/[-_]/g, ' ');
}

/** landing-kit's own brand, used when a site has no theme. See docs/style-guide.md. */
const BRAND = {
  primary: '#2F54EB',
  secondary: '#C6F432',
  font: 'Bricolage Grotesque',
  logo: '/admin/landing-kit-mark.svg',
};

module.exports = { COLLECTION_LABELS, DAY_NAMES, defaultHours, collectionLabel, BRAND };
