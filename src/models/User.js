const { query, one, run } = require('../db/query');

const User = {
  async findByUsername(username) {
    return one('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  },

  async findById(id) {
    return one('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  },

  async list() {
    return query(
      `SELECT id, username, role, full_name, created_at
       FROM users
       ORDER BY FIELD(role, 'admin', 'presentador'), username`
    );
  },

  async countAdmins() {
    const row = await one(`SELECT COUNT(*) AS total FROM users WHERE role = 'admin'`);
    return row ? Number(row.total) : 0;
  },

  async usernameTaken(username, exceptId = null) {
    const row = exceptId
      ? await one('SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1', [username, exceptId])
      : await one('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    return Boolean(row);
  },

  async create({ username, passwordHash, role, fullName = null }) {
    const result = await query(
      `INSERT INTO users (username, password_hash, role, full_name)
       VALUES (?, ?, ?, ?)`,
      [username, passwordHash, role, fullName]
    );
    return result.insertId;
  },

  async updateProfile(id, { role, fullName }) {
    await run('UPDATE users SET role = ?, full_name = ? WHERE id = ?', [role, fullName, id]);
    return this.findById(id);
  },

  async updatePassword(id, passwordHash) {
    await run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    return this.findById(id);
  },

  async remove(id) {
    const result = await run('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  sanitize(user) {
    if (!user) return null;
    const { id, username, role, full_name, created_at } = user;
    return { id, username, role, full_name, created_at };
  },
};

module.exports = User;
