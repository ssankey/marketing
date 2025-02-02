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
};

let pool;

export async function queryDatabase(query, params = []) {
  try {
    if (!pool) {
      pool = await sql.connect(config);
    }

    const request = pool.request();

    // Add parameters to the request
    params.forEach(param => {
      if (!param.name || !param.type || param.value === undefined) {
        throw new Error(`Invalid parameter: ${JSON.stringify(param)}`);
      }
      request.input(param.name, param.type, param.value);
    });

    /***test****/
    // console.log("Executing query:", query);
    // console.log("With parameters:", params);

    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error('Database error:', err);
    throw new Error('Database operation failed');
  }
}

// Helper function to safely close the connection
export async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
    }
  } catch (err) {
    console.error('Error closing database connection:', err);
  }
}