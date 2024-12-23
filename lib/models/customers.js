// /lib/models/customers.js

import sql from 'mssql';

/**
 * Executes a parameterized SQL query to fetch customers.
 * @param {string} query - The SQL query string with parameter placeholders.
 * @param {Array} parameters - Array of parameter objects { name, type, value }.
 * @returns {Promise<Array>} - The result set from the query.
 */
export async function getCustomers(query, parameters = []) {
  try {
    // Establish a connection pool if not already connected
    if (!sql.pool) {
      sql.pool = await sql.connect(process.env.DB_CONNECTION_STRING);
    }

    const request = sql.pool.request();

    // Add parameters to the request
    parameters.forEach((param) => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error executing SQL query:', error);
    throw error;
  }
}
