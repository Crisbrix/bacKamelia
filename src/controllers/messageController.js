const Message = require('../models/Message');

const MAX_TEXT = 600;
const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateSongUrl(url) {
  if (!url) return null;
  const raw = clean(url);
  if (raw.length > 500) return { error: 'El enlace de la cancion es demasiado largo' };
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { error: 'Enlace de cancion invalido' };
    }
    if (!YOUTUBE_HOSTS.includes(parsed.hostname.toLowerCase())) {
      return { error: 'El enlace debe ser de YouTube' };
    }
  } catch (error) {
    return { error: 'El enlace de la cancion no es una URL valida' };
  }
  return { value: raw };
}

function validateMessage(body) {
  const client_name = clean(body.client_name);
  const honoree_name = clean(body.honoree_name);
  const message_text = clean(body.message_text);
  const song_request_url = clean(body.song_request_url);
  const table_number = clean(body.table_number);

  if (client_name.length < 2) return { error: 'Escribe tu nombre (minimo 2 caracteres)' };
  if (client_name.length > 120) return { error: 'Tu nombre es demasiado largo' };
  if (honoree_name.length < 2) return { error: 'Escribe el nombre del homenajeado' };
  if (honoree_name.length > 120) return { error: 'El nombre del homenajeado es demasiado largo' };
  if (message_text.length < 5) return { error: 'El saludo debe tener al menos 5 caracteres' };
  if (message_text.length > MAX_TEXT) return { error: `El saludo no puede superar ${MAX_TEXT} caracteres` };
  if (table_number.length < 1) return { error: 'Escribe el numero de mesa' };
  if (table_number.length > 20) return { error: 'El numero de mesa no puede superar 20 caracteres' };

  const song = validateSongUrl(song_request_url);
  if (song && song.error) return { error: song.error };

  return {
    value: {
      client_name,
      honoree_name,
      message_text,
      song_request_url: song ? song.value : null,
      table_number,
    },
  };
}

async function create(req, res, next) {
  try {
    const validation = validateMessage(req.body || {});
    if (validation.error) return res.status(400).json({ error: validation.error });

    const message = await Message.create(validation.value);
    return res.status(201).json({ message });
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const { status, priority, search, limit, offset } = req.query;
    const result = await Message.list({
      status,
      priority,
      search,
      limit: Number(limit) > 0 ? Number(limit) : 100,
      offset: Number(offset) >= 0 ? Number(offset) : 0,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function stats(req, res, next) {
  try {
    return res.json(await Message.stats());
  } catch (error) {
    return next(error);
  }
}

async function recentPublic(req, res, next) {
  try {
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 8;
    const rows = await Message.recentPublic(limit);
    return res.json({ rows });
  } catch (error) {
    return next(error);
  }
}

async function updatePriority(req, res, next) {
  try {
    const priority = Number(req.body.priority);
    if (!Message.PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'La prioridad debe ser 1 (Baja), 2 (Media) o 3 (Alta)' });
    }

    const existing = await Message.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Mensaje no encontrado' });

    const updated = await Message.updatePriority(req.params.id, priority);
    return res.json({ message: updated });
  } catch (error) {
    return next(error);
  }
}

async function setStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!Message.STATUSES.includes(status)) {
      return res.status(400).json({ error: "El estado debe ser 'pendiente' o 'leido'" });
    }

    const existing = await Message.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Mensaje no encontrado' });

    const updated = await Message.setStatus(req.params.id, status);
    return res.json({ message: updated });
  } catch (error) {
    return next(error);
  }
}

async function markAsRead(req, res, next) {
  req.body = { status: 'leido' };
  return setStatus(req, res, next);
}

async function remove(req, res, next) {
  try {
    const deleted = await Message.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Mensaje no encontrado' });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  stats,
  recentPublic,
  updatePriority,
  setStatus,
  markAsRead,
  remove,
};
