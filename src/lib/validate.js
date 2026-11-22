'use strict';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const FONT_RE = /^[\p{L}\p{N} ,'"-]{1,80}$/u;
const COLLECTION_RE = /^[a-z][a-z0-9_-]{0,31}$/;

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.status = 400;
    this.errors = errors;
  }
}

/** Returns a trimmed string, '' for empty input, or null if the value is not a string. */
function str(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return null;
  return value.trim();
}

const isSlug = (v) => typeof v === 'string' && SLUG_RE.test(v);
const isEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
const isPhone = (v) => typeof v === 'string' && PHONE_RE.test(v);
const isColor = (v) => typeof v === 'string' && COLOR_RE.test(v);
const isTime = (v) => typeof v === 'string' && TIME_RE.test(v);
const isFont = (v) => typeof v === 'string' && FONT_RE.test(v);
const isCollection = (v) => typeof v === 'string' && COLLECTION_RE.test(v);

/** "149,90" | "149.90" | 149.9 -> 14990 (kuruş). Empty -> null. Invalid -> NaN. */
function parsePrice(value) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value)
    .trim()
    .replace(/\s|₺|TL/gi, '');
  if (text === '') return null;
  // Accept Turkish format with thousands separator: 1.250,50
  const normalized = /,\d{1,2}$/.test(text) ? text.replace(/\./g, '').replace(',', '.') : text;
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(normalized)) return NaN;
  return Math.round(Number(normalized) * 100);
}

/** Truthy checkbox-ish values coming from JSON or urlencoded forms. */
function isChecked(value) {
  if (value === true || value === 1) return true;
  return ['1', 'true', 'on', 'yes', 'evet'].includes(String(value).toLowerCase());
}

module.exports = {
  ValidationError,
  str,
  isSlug,
  isEmail,
  isPhone,
  isColor,
  isTime,
  isFont,
  isCollection,
  parsePrice,
  isChecked,
};
