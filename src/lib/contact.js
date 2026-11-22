'use strict';

const { str, isEmail, isPhone, isChecked } = require('./validate');

/** Name of the hidden honeypot input. Humans never fill it, simple bots do. */
const HONEYPOT_FIELD = 'website';

/**
 * Validates a contact form submission.
 * Returns { spam: true } for honeypot hits, { errors } on invalid input, or { data }.
 */
function parseContact(body = {}) {
  if (str(body[HONEYPOT_FIELD])) return { spam: true };

  const errors = {};
  const name = str(body.name);
  const phone = str(body.phone);
  const email = str(body.email);
  const message = str(body.message);

  if (!name) errors.name = 'Adınızı yazın.';
  else if (name === null || name.length > 100) errors.name = 'Ad en fazla 100 karakter olabilir.';

  if (phone === null || (phone && !isPhone(phone))) errors.phone = 'Telefon numarası geçersiz.';
  if (email === null || (email && !isEmail(email))) errors.email = 'E-posta adresi geçersiz.';
  if (!errors.phone && !errors.email && !phone && !email) {
    errors.phone = 'Size ulaşabilmemiz için telefon ya da e-posta yazın.';
  }

  if (!message) errors.message = 'Mesajınızı yazın.';
  else if (message === null || message.length > 2000) {
    errors.message = 'Mesaj en fazla 2000 karakter olabilir.';
  }

  // KVKK: explicit consent is required server-side, not only in the HTML.
  if (!isChecked(body.kvkk)) errors.kvkk = 'Devam etmek için aydınlatma metnini onaylayın.';

  if (Object.keys(errors).length) return { errors };
  return { data: { name, phone, email, message, kvkk: true } };
}

module.exports = { parseContact, HONEYPOT_FIELD };
