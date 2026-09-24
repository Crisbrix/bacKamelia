function notFound(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  console.error('[API ERROR]', error.message);
  const status = error.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : error.message,
  });
}

module.exports = { notFound, errorHandler };
