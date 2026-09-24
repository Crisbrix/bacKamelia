const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contrasena son obligatorios' });
    }

    const user = await User.findByUsername(String(username).trim());

    if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    return res.json({
      token: signToken(user),
      user: User.sanitize(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ user: User.sanitize(user) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login, me };
