const { query, one, run } = require('../db/query');

const PRIORITIES = [1, 2, 3];
const STATUSES = ['pendiente', 'leido'];

const Message = {
  PRIORITIES,
  STATUSES,

  async create({ client_name, honoree_name, message_text, song_request_url = null }) {
    const result = await query(
      `INSERT INTO messages (client_name, honoree_name, message_text, song_request_url)
       VALUES (?, ?, ?, ?)`,
      [client_name, honoree_name, message_text, song_request_url || null]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    return one('SELECT * FROM messages WHERE id = ? LIMIT 1', [id]);
  },

  async list({ status, priority, search, limit = 100, offset = 0 } = {}) {
    const where = [];
    const params = [];

    if (status && STATUSES.includes(status)) {
      where.push('status = ?');
      params.push(status);
    }

    if (priority && PRIORITIES.includes(Number(priority))) {
      where.push('priority = ?');
      params.push(Number(priority));
    }

    if (search) {
      where.push('(client_name LIKE ? OR honoree_name LIKE ? OR message_text LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await query(
      `SELECT * FROM messages ${whereSql}
       ORDER BY
         CASE status WHEN 'pendiente' THEN 0 ELSE 1 END ASC,
         priority DESC,
         created_at ASC,
         id ASC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM messages ${whereSql}`,
      params
    );

    return { rows, total: Number(countRow.total) };
  },

  async recentPublic(limit = 8) {
    return query(
      `SELECT id, honoree_name, client_name, message_text, created_at
       FROM messages
       WHERE status = 'leido'
       ORDER BY created_at DESC
       LIMIT ?`,
      [Number(limit)]
    );
  },

  async updatePriority(id, priority) {
    await run('UPDATE messages SET priority = ? WHERE id = ?', [Number(priority), id]);
    return this.findById(id);
  },

  async setStatus(id, status) {
    await run('UPDATE messages SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  },

  async markAsRead(id) {
    return this.setStatus(id, 'leido');
  },

  async markAsPending(id) {
    return this.setStatus(id, 'pendiente');
  },

  async remove(id) {
    const result = await run('DELETE FROM messages WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async stats() {
    const rows = await query(
      `SELECT status, priority, COUNT(*) AS total
       FROM messages
       GROUP BY status, priority`
    );

    const stats = {
      pendiente: 0,
      leido: 0,
      total: 0,
      byPriority: { 1: 0, 2: 0, 3: 0 },
    };

    rows.forEach((row) => {
      stats[row.status] += Number(row.total);
      stats.total += Number(row.total);
      stats.byPriority[row.priority] += Number(row.total);
    });

    return stats;
  },
};

module.exports = Message;
