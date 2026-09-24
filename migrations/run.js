const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const fs = require('fs');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');
const { getPool, ping, closePool } = require('../src/db/pool');
const MIGRATIONS = require('./001_create_tables');

function sslOptions() {
  if (!env.db.ssl) return undefined;
  const ssl = { rejectUnauthorized: env.db.sslRejectUnauthorized };
  if (env.db.caFile) {
    const caPath = path.isAbsolute(env.db.caFile) ? env.db.caFile : path.resolve(process.cwd(), env.db.caFile);
    ssl.ca = fs.readFileSync(caPath);
  }
  return ssl;
}

async function createAdminConnection(rejectUnauthorized = env.db.sslRejectUnauthorized) {
  return mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    ssl: env.db.ssl ? { ...sslOptions(), rejectUnauthorized } : undefined,
    connectTimeout: 20000,
  });
}

async function ensureDatabase() {
  let rejectUnauthorized = env.db.sslRejectUnauthorized;
  // Si la validacion del certificado falla, reintenta una vez sin validar.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const connection = await createAdminConnection(rejectUnauthorized);
      try {
        await connection.query(
          `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\`
           DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
      } finally {
        await connection.end();
      }
      return;
    } catch (error) {
      const certProblem = /certificate|ssl|tls|verify/i.test(String(error.message || ''));
      if (certProblem && rejectUnauthorized) {
        console.warn('[DB] CA no reconocida, reintento sin validar el certificado (usa DB_CA_FILE).');
        rejectUnauthorized = false;
        continue;
      }
      // La base puede existir ya sin permiso para crearla: se avisa y se continua.
      console.warn(`[DB] Aviso en CREATE DATABASE: ${error.message}`);
      return;
    }
  }
}

async function run() {
  console.log(`\n==> Conectando a ${env.db.provider.toUpperCase()} en ${env.db.host}:${env.db.port} ...`);

  await ensureDatabase();

  try {
    await ping();
    console.log(`[DB] Conexion OK -> ${env.db.database}`);
  } catch (error) {
    console.error(`\n[ERROR] No se pudo conectar: ${error.message}`);
    process.exit(1);
  }

  const pool = getPool();

  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  const [appliedRows] = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set((appliedRows || []).map((row) => row.name));

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) {
      console.log(`   [omitida] ${migration.name}`);
      continue;
    }

    console.log(`   [aplicando] ${migration.name}`);
    for (const statement of migration.statements) {
      await pool.query(statement);
    }
    await pool.query('INSERT INTO schema_migrations (name) VALUES (?)', [migration.name]);
    console.log(`   [ok]      ${migration.name}`);
  }

  console.log('==> Migraciones finalizadas.\n');
}

run()
  .then(closePool)
  .catch(async (error) => {
    console.error('\n[ERROR] No se pudieron aplicar las migraciones:');
    console.error(error.message);
    await closePool().catch(() => {});
    process.exit(1);
  });
