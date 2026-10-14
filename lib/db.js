
// lib/db.js
import dotenv from 'dotenv';
dotenv.config();
import sql from 'mssql';

const config = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 2,                    // ✅ keep at least 2 connections alive always
    idleTimeoutMillis: 600000, // ✅ 10 minutes (was 30 seconds — way too short)
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  connectionTimeout: 60000,
  requestTimeout:    60000, // ✅ increased from 30s — some queries need more time
  retryDelay:        3000,
  maxRetriesOnFailure: 3,
};

let pool;
let connectionPromise;

async function createPool() {
  try {
    const newPool = new sql.ConnectionPool(config);

    newPool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
      pool = null;
      connectionPromise = null;
    });

    await newPool.connect();
    console.log('[DB] Connection pool created successfully');
    return newPool;
  } catch (err) {
    console.error('[DB] Failed to create pool:', err.message);
    throw err;
  }
}

async function getPool() {
  if (pool && pool.connected) return pool;

  if (connectionPromise) {
    try {
      return await connectionPromise;
    } catch {
      connectionPromise = null;
      throw new Error('Connection attempt failed');
    }
  }

  connectionPromise = createPool();
  try {
    pool = await connectionPromise;
    connectionPromise = null;
    return pool;
  } catch (err) {
    connectionPromise = null;
    throw err;
  }
}

export async function queryDatabase(query, params = [], maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const currentPool = await getPool();
      const request = currentPool.request();

      params.forEach(param => {
        if (!param.name || !param.type || param.value === undefined) {
          throw new Error(`Invalid parameter: ${JSON.stringify(param)}`);
        }
        request.input(param.name, param.type, param.value);
      });

      const result = await request.query(query);
      return result.recordset;

    } catch (err) {
      lastError = err;
      console.error(`[DB] Error on attempt ${attempt}:`, err.message);

      const isConnectionError =
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEOUT' ||
        err.code === 'ENOTOPEN' ||
        err.message.includes('Connection is closed') ||
        err.message.includes('Connection lost') ||
        err.message.includes('server closed the connection') ||
        err.message.includes('socket hang up') ||
        (pool && !pool.connected);

      if (isConnectionError) {
        console.log(`[DB] Connection error — resetting pool (attempt ${attempt})`);
        if (pool) {
          try { await pool.close(); } catch {}
        }
        pool = null;
        connectionPromise = null;
      }

      if (attempt < maxRetries) {
        const delay = isConnectionError ? config.retryDelay : 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw new Error(`Database operation failed after ${maxRetries} attempts: ${lastError.message}`);
}

export async function checkConnectionHealth() {
  try {
    const result = await queryDatabase('SELECT 1 AS health_check');
    return result?.length > 0;
  } catch {
    return false;
  }
}

export async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      connectionPromise = null;
    }
  } catch (err) {
    console.error('[DB] Error closing connection:', err.message);
  }
}

// ✅ Keep-alive — runs automatically, no manual call needed
// Pings every 4 minutes to prevent idle timeout on both DB and network firewall
// Only runs server-side (Next.js API routes)
if (typeof window === 'undefined') {
  const KEEPALIVE_INTERVAL = 4 * 60 * 1000; // 4 minutes

  setInterval(async () => {
    try {
      // Only ping if pool already exists — don't force-create on idle
      if (pool && pool.connected) {
        await pool.request().query('SELECT 1 AS keep_alive');
        // silent — no log spam
      }
    } catch (err) {
      console.error('[DB] Keep-alive ping failed:', err.message);
      // Reset pool so next real request triggers fresh connect
      pool = null;
      connectionPromise = null;
    }
  }, KEEPALIVE_INTERVAL);
}

export default { queryDatabase, checkConnectionHealth, closeConnection };