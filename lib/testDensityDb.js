// lib/testDensityDb.js
// Connection to the TEST_DENSITY SQL Server database (same server/credentials
// as the main DB in lib/db.js, different `database` — same config already
// used ad-hoc in pages/api/sync/stock-sync-3a.js and
// pages/api/email/sendMismatchReport.js, just pooled here instead of
// connect-per-call, since this is now called per line-item on both the
// dispatch email send and the public /dispatch page (getMsdsUrl in
// lib/models/msds.js), not just an occasional cron/report job.

import sql from "mssql";

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.TEST_DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 1,
    idleTimeoutMillis: 600000,
  },
  connectionTimeout: 60000,
  requestTimeout: 30000,
};

let pool;
let connectionPromise;

async function createPool() {
  const newPool = new sql.ConnectionPool(config);
  newPool.on("error", (err) => {
    console.error("[TestDensityDB] Pool error:", err.message);
    pool = null;
    connectionPromise = null;
  });
  await newPool.connect();
  return newPool;
}

async function getPool() {
  if (pool && pool.connected) return pool;
  if (connectionPromise) return connectionPromise;
  connectionPromise = createPool();
  try {
    pool = await connectionPromise;
    return pool;
  } finally {
    connectionPromise = null;
  }
}

export async function queryTestDensity(query, params = []) {
  const currentPool = await getPool();
  const request = currentPool.request();
  params.forEach((param) => {
    request.input(param.name, param.type, param.value);
  });
  const result = await request.query(query);
  return result.recordset;
}
