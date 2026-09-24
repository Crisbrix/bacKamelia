const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');

let pool = null;

function readCaFile() {
  if (!env.db.caFile) return undefined;
  const caPath = path.isAbsolute(env.db.caFile)
    ? env.db.caFile
    : path.resolve(process.cwd(), env.db.caFile);
  return fs.readFileSync(caPath);
}

function buildSslConfig(rejectUnauthorized) {
  if (!env.db.ssl) return undefined;

  const ssl = { rejectUnauthorized };
  const ca = readCaFile();
  if (ca) ssl.ca = ca;

  return ssl;
}

function createPool(rejectUnauthorized) {
  return mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z',
    dateStrings: true,
    connectTimeout: 20000,
    ssl: buildSslConfig(rejectUnauthorized),
  });
}

function getPool() {
  if (!pool) pool = createPool(env.db.sslRejectUnauthorized);
  return pool;
}

function isCertificateError(error) {
  const code = String(error.code || '');
  const message = String(error.message || '').toLowerCase();
  return (
    /CERT|SSL|TLS/i.test(code) ||
    message.includes('unable to verify') ||
    message.includes('certificate') ||
    message.includes('ssl')
  );
}

/**
 * Comprueba la conexion. Si TiDB rechaza el certificado porque no se
 * configuro CA propia, reintenta una vez sin validar la cadena (avisando).
 */
async function ping() {
  try {
    const [rows] = await getPool().query('SELECT 1 AS ok');
    return rows[0].ok === 1;
  } catch (error) {
    const canRetry =
      env.db.ssl && env.db.sslRejectUnauthorized && !env.db.caFile && isCertificateError(error);

    if (!canRetry) throw error;

    console.warn('[DB] Certificado no validado con la CA del sistema.');
    console.warn('[DB] Reintento sin rejectUnauthorized (configura DB_CA_FILE para production).');
    await closePool().catch(() => {});
    pool = createPool(false);

    const [rows] = await getPool().query('SELECT 1 AS ok');
    return rows[0].ok === 1;
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, ping, closePool };
