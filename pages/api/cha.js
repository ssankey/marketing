// pages/api/cha.js
import { queryDatabase } from "../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { search } = req.query;

    let query = `
      SELECT TOP 20 
        CardCode, 
        CardName,
        Country
      FROM OCRD
      WHERE CardFName = 'Cha'
    `;

    const params = [];

    if (search && search.trim()) {
      query += ` AND (CardCode LIKE @search OR CardName LIKE @search)`;
      params.push({ name: "search", type: sql.NVarChar, value: `%${search}%` });
    }

    query += ` ORDER BY CardName ASC`;

    console.log("Executing CHA query:", query);
    console.log("With parameters:", params);

    const results = await queryDatabase(query, params);

    const chaList = results.map((row) => ({
      CardCode: row.CardCode,
      CardName: row.CardName,
      Country: row.Country,
      display: `${row.CardCode} - ${row.CardName}`,
    }));

    res.status(200).json({ chaList });
  } catch (error) {
    console.error("Error fetching CHA:", error);
    res.status(500).json({ message: "Failed to fetch CHA list" });
  }
}