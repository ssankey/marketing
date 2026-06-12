// pages/api/density-labels/suggestions/[searchTerm].js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  const { searchTerm } = req.query;

  if (!searchTerm || searchTerm.trim() === "") {
    return res.status(400).json({ message: "Search term required" });
  }

  try {
    const results = await queryDatabase(
      `
      SELECT TOP 10 
        T0.[U_ALTCAT] AS itemCode,
        T0.[ItemName] AS itemName
      FROM [dbo].[OITM] T0
      WHERE T0.[U_ALTCAT] LIKE @search
      ORDER BY T0.[U_ALTCAT]
      `,
      [
        {
          name: "search",
          type: sql.NVarChar,   // 🔹 FIXED
          value: `%${searchTerm}%`
        }
      ]
    );

    return res.status(200).json({ suggestions: results });
  } catch (err) {
    console.error("Suggestion API error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch suggestions", error: err.message });
  }
}
