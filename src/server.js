const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const { ping } = require('./db/pool');

const app = express();

app.use(cors({ origin: [env.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started}ms)`);
    }
  });
  next();
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await ping();
    console.log(`[DB] Conexion establecida con ${env.db.provider.toUpperCase()} (${env.db.host}:${env.db.port}/${env.db.database})`);
  } catch (error) {
    console.warn(`[DB] Aviso: no se pudo conectar a la base de datos: ${error.message}`);
    console.warn('[DB] El servidor arrancara igualmente; revisa tu archivo .env y ejecuta "npm run db:migrate".');
  }

  app.listen(env.port, () => {
    console.log(`\n[LA KAMELIA API] Rancho Criadero La Kamelia - Servidor escuchando en http://localhost:${env.port}`);
    console.log(`[LA KAMELIA API] Salud:      http://localhost:${env.port}/api/health`);
    console.log(`[LA KAMELIA API] Login:      POST http://localhost:${env.port}/api/auth/login\n`);
  });
}

start();
