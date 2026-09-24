const { ensurePool } = require('./pool');

/**
 * Capa de acceso a datos (gestor de conexion TiDB/MySQL).
 * Todas las consultas de los modelos pasan por aqui.
 */
async function query(sql, params = []) {
  const connection = await ensurePool();
  const [rows] = await connection.query(sql, params);
  return rows;
}

async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}

async function run(sql, params = []) {
  const connection = await ensurePool();
  const [result] = await connection.execute(sql, params);
  return result;
}

async function transaction(callback) {
  const connection = await ensurePool();
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback({
      query: (sql, params = []) => conn.query(sql, params).then(([rows]) => rows),
      execute: (sql, params = []) => conn.execute(sql, params).then(([result]) => result),
    });
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { query, one, run, transaction };
