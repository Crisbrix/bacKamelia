const { query, one } = require('../db/query');

const User = {
  async findByUsername(username) {
    return one('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  },

  async findById(id) {
    return one('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  },

  async create({ username, passwordHash, role, fullName = null }) {
    const result = await query(
      `INSERT INTO users (username, password_hash, role, full_name)
       VALUES (?, ?, ?, ?)`,
      [username, passwordHash, role, fullName]
    );
    return result.insertId;
  },

  sanitize(user) {
    if (!user) return null;
    const { id, username, role, full_name, created_at } = user;
    return { id, username, role, full_name, created_at };
  },
};

module.exports = User;
