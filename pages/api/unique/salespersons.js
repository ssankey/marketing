
// pages/api/unique/salespersons.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const query = `
      SELECT DISTINCT 
          SlpCode, 
          SlpName
      FROM OSLP
      WHERE SlpName IS NOT NULL
      ORDER BY SlpName;
    `;
    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching salespersons:", error);
    res.status(500).json({ error: "Failed to fetch salespersons" });
  }
}
