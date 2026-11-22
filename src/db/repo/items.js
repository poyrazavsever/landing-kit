'use strict';

const COLUMNS =
  'id, collection, title, description, price_cents, image, sort_order, active, created_at, updated_at';

function itemsRepo(db) {
  return {
    listActive(siteId, collection) {
      return db
        .prepare(
          `SELECT ${COLUMNS} FROM items
           WHERE site_id = ? AND collection = ? AND active = 1
           ORDER BY sort_order, id`,
        )
        .all(siteId, collection);
    },

    listAll(siteId, collection) {
      return db
        .prepare(
          `SELECT ${COLUMNS} FROM items WHERE site_id = ? AND collection = ? ORDER BY sort_order, id`,
        )
        .all(siteId, collection);
    },

    countsByCollection(siteId) {
      return db
        .prepare(
          `SELECT collection, COUNT(*) AS total, SUM(active) AS active
           FROM items WHERE site_id = ? GROUP BY collection`,
        )
        .all(siteId);
    },

    /** Always scoped by site so one owner can never read another site's item. */
    find(siteId, id) {
      return db
        .prepare(`SELECT ${COLUMNS} FROM items WHERE site_id = ? AND id = ?`)
        .get(siteId, id);
    },

    create(siteId, data) {
      const next = db
        .prepare(
          'SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM items WHERE site_id = ? AND collection = ?',
        )
        .get(siteId, data.collection).n;
      const info = db
        .prepare(
          `INSERT INTO items (site_id, collection, title, description, price_cents, image, sort_order, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          siteId,
          data.collection,
          data.title,
          data.description || null,
          data.price_cents ?? null,
          data.image || null,
          data.sort_order ?? next,
          data.active === false ? 0 : 1,
        );
      return this.find(siteId, info.lastInsertRowid);
    },

    update(siteId, id, fields) {
      const allowed = ['title', 'description', 'price_cents', 'image', 'active'];
      const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));
      if (entries.length === 0) return this.find(siteId, id);
      const params = { siteId, id };
      const sets = entries.map(([key, value]) => {
        params[key] = key === 'active' ? (value ? 1 : 0) : value === '' ? null : value;
        return `${key} = @${key}`;
      });
      db.prepare(
        `UPDATE items SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE site_id = @siteId AND id = @id`,
      ).run(params);
      return this.find(siteId, id);
    },

    remove(siteId, id) {
      return (
        db.prepare('DELETE FROM items WHERE site_id = ? AND id = ?').run(siteId, id).changes > 0
      );
    },

    /** ids: the full new order for one collection. Ids of other sites are ignored. */
    reorder(siteId, collection, ids) {
      const stmt = db.prepare(
        'UPDATE items SET sort_order = ? WHERE site_id = ? AND collection = ? AND id = ?',
      );
      db.transaction(() => ids.forEach((id, index) => stmt.run(index, siteId, collection, id)))();
      return this.listAll(siteId, collection);
    },
  };
}

/** API shape: price in TL as a number plus the raw kuruş value. */
function toItemDto(row, { admin = false } = {}) {
  const dto = {
    id: row.id,
    collection: row.collection,
    title: row.title,
    description: row.description,
    price: row.price_cents === null ? null : row.price_cents / 100,
    price_cents: row.price_cents,
    image: row.image,
    sort_order: row.sort_order,
  };
  if (admin) {
    dto.active = row.active === 1;
    dto.created_at = row.created_at;
    dto.updated_at = row.updated_at;
  }
  return dto;
}

module.exports = { itemsRepo, toItemDto };
