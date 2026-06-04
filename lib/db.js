
// // lib/db.js
// import sql from 'mssql';

// const config = {
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   server: process.env.DB_SERVER,
//   database: process.env.DB_DATABASE,
//   options: {
//     encrypt: true,
//     trustServerCertificate: true,
//   },
//   pool: {
//     max: 10,
//     min: 0,
//     idleTimeoutMillis: 30000, // 30 seconds
//   },
//   connectionTimeout: 60000, // 60 seconds
//   requestTimeout: 30000, // 30 seconds
//   // Enable connection retry logic
//   retryDelay: 5000,
//   maxRetriesOnFailure: 3,
// };

// let pool;
// let connectionPromise;

// // Function to create a new connection pool
// async function createPool() {
//   try {
//     // console.log('Creating new database connection pool...');
//     const newPool = new sql.ConnectionPool(config);
    
//     // Handle pool errors
//     newPool.on('error', (err) => {
//       // console.error('Database pool error:', err);
//       pool = null;
//       connectionPromise = null;
//     });

//     await newPool.connect();
//     // console.log('Database connection pool created successfully');
//     return newPool;
//   } catch (err) {
//     // console.error('Failed to create database pool:', err);
//     throw err;
//   }
// }

// // Function to get a valid connection pool
// async function getPool() {
//   // If pool exists and is connected, return it
//   if (pool && pool.connected) {
//     return pool;
//   }

//   // If there's already a connection attempt in progress, wait for it
//   if (connectionPromise) {
//     try {
//       return await connectionPromise;
//     } catch (err) {
//       connectionPromise = null;
//       throw err;
//     }
//   }

//   // Create a new connection
//   connectionPromise = createPool();
//   try {
//     pool = await connectionPromise;
//     return pool;
//   } catch (err) {
//     connectionPromise = null;
//     throw err;
//   }
// }

// // Enhanced query function with retry logic
// export async function queryDatabase(query, params = [], maxRetries = 3) {
//   let lastError;
  
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       const currentPool = await getPool();
//       const request = currentPool.request();
      
//       // Add parameters to the request
//       params.forEach(param => {
//         if (!param.name || !param.type || param.value === undefined) {
//           throw new Error(`Invalid parameter: ${JSON.stringify(param)}`);
//         }
//         request.input(param.name, param.type, param.value);
//       });

//       // console.log(`Executing query (attempt ${attempt}):`, query);
//       // console.log("With parameters:", params);
      
//       const result = await request.query(query);
//       return result.recordset;
      
//     } catch (err) {
//       lastError = err;
//       // console.error(`Database error on attempt ${attempt}:`, err.message);
      
//       // Check if this is a connection-related error
//       const isConnectionError = 
//         err.code === 'ECONNRESET' || 
//         err.code === 'ETIMEOUT' ||
//         err.message.includes('Connection is closed') ||
//         err.message.includes('Connection lost') ||
//         err.message.includes('server closed the connection') ||
//         pool && !pool.connected;

//       if (isConnectionError && attempt < maxRetries) {
//         // console.log(`Connection error detected, resetting pool and retrying...`);
//         // Reset the pool for retry
//         if (pool) {
//           try {
//             await pool.close();
//           } catch (closeErr) {
//             // console.error('Error closing pool:', closeErr);
//           }
//         }
//         pool = null;
//         connectionPromise = null;
        
//         // Wait before retrying
//         await new Promise(resolve => setTimeout(resolve, config.retryDelay || 5000));
//       } else if (attempt < maxRetries) {
//         // For non-connection errors, wait a bit before retrying
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }
//     }
//   }
  
//   // console.error('All retry attempts failed');
//   throw new Error(`Database operation failed after ${maxRetries} attempts: ${lastError.message}`);
// }

// // Function to check connection health
// export async function checkConnectionHealth() {
//   try {
//     const result = await queryDatabase('SELECT 1 as health_check');
//     return result && result.length > 0;
//   } catch (err) {
//     // console.error('Connection health check failed:', err);
//     return false;
//   }
// }

// // Function to keep connection alive
// export async function keepAlive() {
//   try {
//     await queryDatabase('SELECT 1 as keep_alive');
//     // console.log('Connection keep-alive successful');
//   } catch (err) {
//     // console.error('Keep-alive failed:', err);
//   }
// }

// // Helper function to safely close the connection
// export async function closeConnection() {
//   try {
//     if (pool) {
//       await pool.close();
//       pool = null;
//       connectionPromise = null;
//       // console.log('Database connection closed successfully');
//     }
//   } catch (err) {
//     // console.error('Error closing database connection:', err);
//   }
// }

// // Optional: Setup periodic keep-alive (call this in your app initialization)
// export function setupKeepAlive(intervalMinutes = 10) {
//   const interval = intervalMinutes * 60 * 1000; // Convert to milliseconds
  
//   return setInterval(async () => {
//     if (pool && pool.connected) {
//       await keepAlive();
//     }
//   }, interval);
// }

// lib/db.js
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