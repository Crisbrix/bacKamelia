const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ROLES = ['admin', 'presentador'];
const MIN_PASSWORD = 6;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,60}$/;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validatePassword(password) {
  if (!password) return 'La contrasena es obligatoria';
  if (String(password).length < MIN_PASSWORD) {
    return `La contrasena debe tener al menos ${MIN_PASSWORD} caracteres`;
  }
  return null;
}

async function list(req, res, next) {
  try {
    const rows = await User.list();
    return res.json({ rows: rows.map((row) => User.sanitize(row)) });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const body = req.body || {};
    const username = clean(body.username);
    const fullName = clean(body.full_name);
    const role = clean(body.role) || 'presentador';

    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({
        error: 'El usuario debe tener de 3 a 60 caracteres (letras, numeros, punto, guion o guion bajo)',
      });
    }
    const passwordError = validatePassword(body.password);
    if (passwordError) return res.status(400).json({ error: passwordError });
    if (!ROLES.includes(role)) return res.status(400).json({ error: "El rol debe ser 'admin' o 'presentador'" });
    if (fullName.length > 120) return res.status(400).json({ error: 'El nombre completo es demasiado largo' });

    if (await User.usernameTaken(username)) {
      return res.status(409).json({ error: 'Ese usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(String(body.password), 10);
    const id = await User.create({
      username,
      passwordHash,
      role,
      fullName: fullName || null,
    });

    const user = await User.findById(id);
    return res.status(201).json({ user: User.sanitize(user) });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await User.findById(id);
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    const body = req.body || {};
    const hasRole = Object.prototype.hasOwnProperty.call(body, 'role');
    const hasFullName = Object.prototype.hasOwnProperty.call(body, 'full_name');
    const hasPassword = Object.prototype.hasOwnProperty.call(body, 'password');

    if (!hasRole && !hasFullName && !hasPassword) {
      return res.status(400).json({ error: 'No hay cambios para guardar' });
    }

    const role = hasRole ? clean(body.role) : existing.role;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: "El rol debe ser 'admin' o 'presentador'" });
    }

    const fullName = hasFullName ? clean(body.full_name) : existing.full_name;
    if (fullName && fullName.length > 120) {
      return res.status(400).json({ error: 'El nombre completo es demasiado largo' });
    }

    if (existing.role === 'admin' && role !== 'admin' && (await User.countAdmins()) <= 1) {
      return res.status(400).json({ error: 'Debe quedar al menos un administrador' });
    }

    let user = existing;
    if (hasRole || hasFullName) {
      user = await User.updateProfile(id, { role, fullName: fullName || null });
    }

    if (hasPassword && String(body.password) !== '') {
      const passwordError = validatePassword(body.password);
      if (passwordError) return res.status(400).json({ error: passwordError });
      const passwordHash = await bcrypt.hash(String(body.password), 10);
      user = await User.updatePassword(id, passwordHash);
    }

    return res.json({ user: User.sanitize(user) });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await User.findById(id);
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (existing.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    if (existing.role === 'admin' && (await User.countAdmins()) <= 1) {
      return res.status(400).json({ error: 'Debe quedar al menos un administrador' });
    }

    await User.remove(id);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, create, update, remove };
