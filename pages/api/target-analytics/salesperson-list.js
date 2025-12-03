// pages/api/target-analytics/salesperson-list.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const query = `
      SELECT DISTINCT T5.SlpName
      FROM OINV T0
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE T5.SlpName IS NOT NULL AND T5.SlpName <> ''
      ORDER BY T5.SlpName ASC
    `;

    const results = await queryDatabase(query);
    
    const salespersonList = results.map(row => row.SlpName);

    res.status(200).json({
      success: true,
      count: salespersonList.length,
      data: salespersonList
    });

  } catch (error) {
    console.error("Error fetching salesperson list:", error);
    res.status(500).json({
      message: "Error fetching salesperson list",
      error: error.message
    });
  }
}