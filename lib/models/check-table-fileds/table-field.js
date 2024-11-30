import { queryDatabase } from "../../db";


export async function getAllTableFieldsAndSamples() {
  try {
    // const tables = ["OCRD", "RDR1", "ORDR", "OINV", "INV1"]; // List of tables to query
    const tables = ["QUT1"];
    const tableData = {};

    for (const table of tables) {
      // Query to fetch one row from the table
      const query = `SELECT TOP 1 * FROM ${table}`;
      const data = await queryDatabase(query); // Replace with your DB connection method

      if (data.length > 0) {
        tableData[table] = {
          fields: Object.keys(data[0]), // Extract field names
          sampleData: data[0], // Extract sample data from the first row
        };
      } else {
        tableData[table] = {
          fields: [],
          sampleData: null, // Handle case where table is empty
        };
      }
    }

    console.log("Table Data:", tableData); // Log table structure and sample data
    return tableData; // Return the aggregated data
  } catch (error) {
    console.error("Error fetching table fields and sample data:", error);
    throw new Error("Failed to fetch fields and sample data for tables");
  }
}
