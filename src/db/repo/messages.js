'use strict';

function messagesRepo(db) {
  return {
    create(siteId, data) {
      const info = db
        .prepare(
          `INSERT INTO messages (site_id, name, phone, email, message, kvkk_consent)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          siteId,
          data.name,
          data.phone || null,
          data.email || null,
          data.message,
          data.kvkk ? 1 : 0,
        );
      return this.find(siteId, info.lastInsertRowid);
    },

    find(siteId, id) {
      return db.prepare('SELECT * FROM messages WHERE site_id = ? AND id = ?').get(siteId, id);
    },

    list(siteId, { limit = 100, offset = 0 } = {}) {
      return db
        .prepare(
          'SELECT * FROM messages WHERE site_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?',
        )
        .all(siteId, limit, offset);
    },

    unreadCount(siteId) {
      return db
        .prepare('SELECT COUNT(*) AS n FROM messages WHERE site_id = ? AND is_read = 0')
        .get(siteId).n;
    },

    setRead(siteId, id, read) {
      return (
        db
          .prepare('UPDATE messages SET is_read = ? WHERE site_id = ? AND id = ?')
          .run(read ? 1 : 0, siteId, id).changes > 0
      );
    },

    remove(siteId, id) {
      return (
        db.prepare('DELETE FROM messages WHERE site_id = ? AND id = ?').run(siteId, id).changes > 0
      );
    },
  };
}

function toMessageDto(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    kvkk_consent: row.kvkk_consent === 1,
    read: row.is_read === 1,
    created_at: row.created_at,
  };
}

module.exports = { messagesRepo, toMessageDto };
