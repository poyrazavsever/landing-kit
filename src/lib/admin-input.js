'use strict';

const {
  ValidationError,
  str,
  isEmail,
  isPhone,
  isColor,
  isTime,
  isFont,
  isCollection,
  parsePrice,
} = require('./validate');

const IMAGE_PATH_RE = /^\/(?:uploads|examples)\/[A-Za-z0-9_\-/]+\.[a-z0-9]{2,5}$/;

function checkImage(value, errors) {
  if (value === '' || value === null) return null;
  if (typeof value !== 'string' || value.length > 500) {
    errors.image = 'Görsel adresi geçersiz.';
    return undefined;
  }
  const ok =
    (IMAGE_PATH_RE.test(value) && !value.includes('..')) || /^https:\/\/[^\s"'<>]+$/.test(value);
  if (!ok) errors.image = 'Görsel adresi geçersiz.';
  return value;
}

/** Validates item fields. partial=true for PATCH (only given fields are checked). */
function parseItemInput(body = {}, { partial = false } = {}) {
  const errors = {};
  const out = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has('collection')) {
    const collection = str(body.collection);
    if (!isCollection(collection)) errors.collection = 'Bölüm adı geçersiz.';
    else out.collection = collection;
  }
  if (!partial || has('title')) {
    const title = str(body.title);
    if (!title) errors.title = 'Başlık yazın.';
    else if (title.length > 120) errors.title = 'Başlık en fazla 120 karakter olabilir.';
    else out.title = title;
  }
  if (has('description')) {
    const description = str(body.description);
    if (description === null || description.length > 1000) {
      errors.description = 'Açıklama en fazla 1000 karakter olabilir.';
    } else out.description = description;
  }
  if (has('price')) {
    const cents = parsePrice(body.price);
    if (Number.isNaN(cents)) errors.price = 'Fiyatı sadece rakamla yazın (ör. 150 veya 149,90).';
    else out.price_cents = cents;
  }
  if (has('image')) {
    const image = checkImage(body.image, errors);
    if (image !== undefined) out.image = image;
  }
  if (has('active'))
    out.active = body.active === true || body.active === 'true' || body.active === 1;

  if (Object.keys(errors).length) throw new ValidationError(errors);
  return out;
}

function parseHours(value, errors) {
  if (!Array.isArray(value) || value.length !== 7) {
    errors.opening_hours = 'Çalışma saatleri 7 gün için girilmeli.';
    return undefined;
  }
  return value.map((day, i) => {
    const closed = Boolean(day?.closed);
    const open = str(day?.open);
    const close = str(day?.close);
    if (!closed && (!isTime(open) || !isTime(close))) {
      errors[`opening_hours.${i}`] = 'Saatleri SS:DD biçiminde girin (ör. 09:00).';
    }
    return { open: open || '09:00', close: close || '19:00', closed };
  });
}

/** Fields the business owner may edit. */
const OWNER_FIELDS = [
  'name',
  'phone',
  'whatsapp',
  'contact_email',
  'address',
  'opening_hours',
  'hours_note',
];
/** Extra fields only the freelancer (superadmin) may edit. */
const SUPERADMIN_FIELDS = [
  'domains',
  'collections',
  'telegram_chat_id',
  'logo_path',
  'color_primary',
  'color_secondary',
  'font_family',
];

function parseSiteInput(body = {}, { superadmin = false } = {}) {
  const errors = {};
  const out = {};
  const allowed = superadmin ? [...OWNER_FIELDS, ...SUPERADMIN_FIELDS] : OWNER_FIELDS;
  const forbidden = Object.keys(body).filter(
    (key) => SUPERADMIN_FIELDS.includes(key) && !allowed.includes(key),
  );
  if (forbidden.length) {
    errors._ = 'Bu alanları sadece site yöneticiniz değiştirebilir.';
  }

  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const value = body[key];
    switch (key) {
      case 'opening_hours': {
        const hours = parseHours(value, errors);
        if (hours) out.opening_hours = hours;
        break;
      }
      case 'domains':
      case 'collections': {
        const list = Array.isArray(value)
          ? value.map((v) => (typeof v === 'string' ? v.trim() : v))
          : null;
        if (!list || list.length > 50) errors[key] = 'Liste geçersiz.';
        else if (
          key === 'collections' &&
          !list.every((c) => isCollection(typeof c === 'string' ? c : c?.key))
        ) {
          errors.collections = 'Bölüm adları küçük harf, rakam, - veya _ içerebilir.';
        } else if (
          key === 'domains' &&
          !list.every((d) => typeof d === 'string' && /^[a-z0-9.:/-]{3,200}$/i.test(d))
        ) {
          errors.domains = 'Alan adı listesi geçersiz.';
        } else out[key] = list.filter(Boolean);
        break;
      }
      default: {
        const text = str(value);
        if (text === null || text.length > 300) {
          errors[key] = 'Değer geçersiz.';
          break;
        }
        if (key === 'name' && !text) errors.name = 'İşletme adı boş olamaz.';
        else if ((key === 'phone' || key === 'whatsapp') && text && !isPhone(text)) {
          errors[key] = 'Telefon numarası geçersiz (ör. 0555 123 45 67).';
        } else if (key === 'contact_email' && text && !isEmail(text)) {
          errors.contact_email = 'E-posta adresi geçersiz.';
        } else if (
          (key === 'color_primary' || key === 'color_secondary') &&
          text &&
          !isColor(text)
        ) {
          errors[key] = 'Renk #RRGGBB biçiminde olmalı.';
        } else if (key === 'font_family' && text && !isFont(text)) {
          errors.font_family = 'Yazı tipi adı geçersiz.';
        } else if (key === 'logo_path' && text && checkImage(text, errors) === undefined) {
          // checkImage already wrote the error
        } else out[key] = text;
      }
    }
  }

  if (Object.keys(errors).length) throw new ValidationError(errors);
  return out;
}

module.exports = { parseItemInput, parseSiteInput, OWNER_FIELDS, SUPERADMIN_FIELDS };
