const DB_CODES = [
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ETIMEDOUT_TLS',
];

function notFound(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  console.error('[API ERROR]', error.code || '', error.message);
  const status = error.status || 500;
  const isDbError =
    DB_CODES.includes(String(error.code || '')) ||
    /certificate|ssl|tls|connect|database/i.test(String(error.message || ''));

  const payload = {
    error: status === 500 ? 'Error interno del servidor' : error.message,
  };

  if (isDbError && status === 500) {
    payload.code = error.code || 'DB_ERROR';
    payload.hint =
      'No se pudo consultar la base de datos. Revisa las variables DB_* en Vercel (Settings > Environment Variables) y redespliega.';
  }

  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
