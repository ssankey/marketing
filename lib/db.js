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
// };

// let pool;

// export async function queryDatabase(query, params = []) {
//   try {
//     if (!pool) {
//       pool = await sql.connect(config);
//     }

//     const request = pool.request();

//     // Add parameters to the request
//     params.forEach(param => {
//       if (!param.name || !param.type || param.value === undefined) {
//         throw new Error(`Invalid parameter: ${JSON.stringify(param)}`);
//       }
//       request.input(param.name, param.type, param.value);
//     });

//     /***test****/
//     console.log("Executing query:", query);
//     console.log("With parameters:", params);

//     const result = await request.query(query);
//     return result.recordset;
//   } catch (err) {
//     console.error('Database error:', err);
//     throw new Error('Database operation failed');
//   }
// }

// // Helper function to safely close the connection
// export async function closeConnection() {
//   try {
//     if (pool) {
//       await pool.close();
//       pool = null;
//     }
//   } catch (err) {
//     console.error('Error closing database connection:', err);
//   }
// }

// lib/db.js
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000, // 30 seconds
  },
  connectionTimeout: 60000, // 60 seconds
  requestTimeout: 30000, // 30 seconds
  // Enable connection retry logic
  retryDelay: 5000,
  maxRetriesOnFailure: 3,
};

let pool;
let connectionPromise;

// Function to create a new connection pool
async function createPool() {
  try {
    // console.log('Creating new database connection pool...');
    const newPool = new sql.ConnectionPool(config);
    
    // Handle pool errors
    newPool.on('error', (err) => {
      // console.error('Database pool error:', err);
      pool = null;
      connectionPromise = null;
    });

    await newPool.connect();
    // console.log('Database connection pool created successfully');
    return newPool;
  } catch (err) {
    // console.error('Failed to create database pool:', err);
    throw err;
  }
}

// Function to get a valid connection pool
async function getPool() {
  // If pool exists and is connected, return it
  if (pool && pool.connected) {
    return pool;
  }

  // If there's already a connection attempt in progress, wait for it
  if (connectionPromise) {
    try {
      return await connectionPromise;
    } catch (err) {
      connectionPromise = null;
      throw err;
    }
  }

  // Create a new connection
  connectionPromise = createPool();
  try {
    pool = await connectionPromise;
    return pool;
  } catch (err) {
    connectionPromise = null;
    throw err;
  }
}

// Enhanced query function with retry logic
export async function queryDatabase(query, params = [], maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const currentPool = await getPool();
      const request = currentPool.request();
      
      // Add parameters to the request
      params.forEach(param => {
        if (!param.name || !param.type || param.value === undefined) {
          throw new Error(`Invalid parameter: ${JSON.stringify(param)}`);
        }
        request.input(param.name, param.type, param.value);
      });

      // console.log(`Executing query (attempt ${attempt}):`, query);
      // console.log("With parameters:", params);
      
      const result = await request.query(query);
      return result.recordset;
      
    } catch (err) {
      lastError = err;
      // console.error(`Database error on attempt ${attempt}:`, err.message);
      
      // Check if this is a connection-related error
      const isConnectionError = 
        err.code === 'ECONNRESET' || 
        err.code === 'ETIMEOUT' ||
        err.message.includes('Connection is closed') ||
        err.message.includes('Connection lost') ||
        err.message.includes('server closed the connection') ||
        pool && !pool.connected;

      if (isConnectionError && attempt < maxRetries) {
        // console.log(`Connection error detected, resetting pool and retrying...`);
        // Reset the pool for retry
        if (pool) {
          try {
            await pool.close();
          } catch (closeErr) {
            // console.error('Error closing pool:', closeErr);
          }
        }
        pool = null;
        connectionPromise = null;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, config.retryDelay || 5000));
      } else if (attempt < maxRetries) {
        // For non-connection errors, wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // console.error('All retry attempts failed');
  throw new Error(`Database operation failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Function to check connection health
export async function checkConnectionHealth() {
  try {
    const result = await queryDatabase('SELECT 1 as health_check');
    return result && result.length > 0;
  } catch (err) {
    // console.error('Connection health check failed:', err);
    return false;
  }
}

// Function to keep connection alive
export async function keepAlive() {
  try {
    await queryDatabase('SELECT 1 as keep_alive');
    // console.log('Connection keep-alive successful');
  } catch (err) {
    // console.error('Keep-alive failed:', err);
  }
}

// Helper function to safely close the connection
export async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      connectionPromise = null;
      // console.log('Database connection closed successfully');
    }
  } catch (err) {
    // console.error('Error closing database connection:', err);
  }
}

// Optional: Setup periodic keep-alive (call this in your app initialization)
export function setupKeepAlive(intervalMinutes = 10) {
  const interval = intervalMinutes * 60 * 1000; // Convert to milliseconds
  
  return setInterval(async () => {
    if (pool && pool.connected) {
      await keepAlive();
    }
  }, interval);
}