-- landing-kit initial schema. Plain SQL so it can be ported to Postgres later.

CREATE TABLE sites (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT    NOT NULL UNIQUE,
  name            TEXT    NOT NULL,
  -- JSON array of allowed origins, e.g. ["https://berberahmet.com"]
  domains         TEXT    NOT NULL DEFAULT '[]',
  contact_email   TEXT,
  whatsapp        TEXT,
  phone           TEXT,
  address         TEXT,
  -- JSON array of 7 entries (Monday first): {"open":"09:00","close":"19:00","closed":false}
  opening_hours   TEXT    NOT NULL DEFAULT '[]',
  hours_note      TEXT,
  -- JSON array of collection definitions: [{"key":"menu","label":"Menü"}]
  collections     TEXT    NOT NULL DEFAULT '[]',
  telegram_chat_id TEXT,
  -- Brand / theme used by the admin panel and the PDF guide
  logo_path       TEXT,
  color_primary   TEXT,
  color_secondary TEXT,
  font_family     TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id     INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  collection  TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  description TEXT,
  -- Stored in kuruş (1/100 TL) to avoid floating point issues
  price_cents INTEGER,
  image       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_items_site_collection ON items(site_id, collection, sort_order);

CREATE TABLE messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id      INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  phone        TEXT,
  email        TEXT,
  message      TEXT    NOT NULL,
  kvkk_consent INTEGER NOT NULL DEFAULT 0,
  is_read      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_messages_site ON messages(site_id, created_at);

CREATE TABLE users (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  email                TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash        TEXT    NOT NULL,
  -- 'owner' (one site) or 'superadmin' (freelancer, all sites)
  role                 TEXT    NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'superadmin')),
  site_id              INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  last_login_at        TEXT,
  created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE sessions (
  sid     TEXT    PRIMARY KEY,
  data    TEXT    NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX idx_sessions_expires ON sessions(expires);
