// =================================================
// F4TE STAFF PANEL - Conexão MySQL
// =================================================
const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'f4te_panel',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      dateStrings: true
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function testConnection() {
  try {
    const conn = await getPool().getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch (e) {
    console.error('[DB] Falha na conexão:', e.message);
    return false;
  }
}

module.exports = { query, testConnection, getPool };
