'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;
// Readable one-time passwords: no 0/O or 1/l/I confusion.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePassword(length = 12) {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return out;
}

function usersRepo(db) {
  return {
    findByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
    findById: (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id),
    listForSite: (siteId) =>
      db.prepare('SELECT id, email, role FROM users WHERE site_id = ?').all(siteId),

    create({ email, password, role = 'owner', siteId = null, mustChange = true }) {
      const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
      const info = db
        .prepare(
          `INSERT INTO users (email, password_hash, role, site_id, must_change_password)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(email, hash, role, siteId, mustChange ? 1 : 0);
      return this.findById(info.lastInsertRowid);
    },

    setPassword(id, password, { mustChange = false } = {}) {
      const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
      db.prepare('UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?').run(
        hash,
        mustChange ? 1 : 0,
        id,
      );
    },

    touchLogin(id) {
      db.prepare(
        "UPDATE users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
      ).run(id);
    },
  };
}

let dummyHash;

/** Constant-ish time check: a missing user still costs one bcrypt comparison. */
function verifyPassword(user, password) {
  if (typeof password !== 'string' || password.length === 0 || password.length > 200) return false;
  if (!user) {
    dummyHash ||= bcrypt.hashSync('landing-kit-dummy-password', BCRYPT_ROUNDS);
    bcrypt.compareSync(password, dummyHash);
    return false;
  }
  return bcrypt.compareSync(password, user.password_hash);
}

module.exports = { usersRepo, verifyPassword, generatePassword };
