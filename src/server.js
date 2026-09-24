const env = require('./config/env');
const app = require('./app');
const { ping } = require('./db/pool');

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
