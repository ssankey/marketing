// /lib/db.js
import sql from 'mssql';

// Configuration for SQL Server connection
const config = {
  user: process.env.DB_USER, // SQL Server username
  password: process.env.DB_PASSWORD, // SQL Server password
  server: process.env.DB_SERVER, // SQL Server hostname or IP address
  database: process.env.DB_DATABASE, // Database name
  options: {
    encrypt: true, // This is needed if you're using Azure
    trustServerCertificate: true, // Trust the self-signed certificate
  },
};

let pool;

export async function queryDatabase(query) {
  try {
    // Check if the pool has been created already, otherwise create a new one
    if (!pool) {
      pool = new sql.ConnectionPool(config);
      await pool.connect(); // Establish connection
    }
    
    // Prepare the SQL request
    const request = pool.request();
    const result = await request.query(query); // Execute the query

    // Return the result set
    return result.recordset;
  } catch (err) {
    // Log and rethrow any errors
    console.error('SQL error', err);
    throw err;
  }
}
