// api/vendors/index.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Extract optional search term from query
    const { search } = req.query;

    let query = `
      SELECT TOP 20 
        CardCode, 
        CardName 
      FROM OCRD
      WHERE CardType = 'S' -- Only suppliers/vendors
    `;

    const params = [];

    // ✅ Add search filter if provided
    if (search && search.trim()) {
      query += ` AND (CardCode LIKE @search OR CardName LIKE @search)`;
      params.push({ name: "search", type: sql.NVarChar, value: `%${search}%` });
    }

    query += ` ORDER BY CardName ASC`;

    console.log("Executing query:", query);
    console.log("With parameters:", params);

    const results = await queryDatabase(query, params);

    // ✅ Map nicely formatted results for frontend
    const vendors = results.map((row) => ({
      cardCode: row.CardCode,
      cardName: row.CardName,
      display: `${row.CardCode} - ${row.CardName}`,
    }));

    res.status(200).json({ vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
}
