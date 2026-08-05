// pages/api/density-labels/pack-sizes/[itemCode].js

import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  const { itemCode } = req.query;

  if (!itemCode || itemCode.trim() === "") {
    return res.status(400).json({ message: "ItemCode required" });
  }

  try {
    const results = await queryDatabase(
      `
      SELECT DISTINCT 
        T0.[ItemCode] AS Cat_size_main,
        -- take everything after the hyphen as packSize
        RIGHT(T0.[ItemCode], LEN(T0.[ItemCode]) - CHARINDEX('-', T0.[ItemCode])) AS packSize,
        -- return this as final display value (like "1g")
        RIGHT(T0.[ItemCode], LEN(T0.[ItemCode]) - CHARINDEX('-', T0.[ItemCode])) AS displayValue
      FROM [dbo].[OITM] T0
      WHERE T0.[U_ALTCAT] = @itemCode
      ORDER BY displayValue
      `,
      [{ name: "itemCode", type: sql.NVarChar, value: itemCode }]
    );

    return res.status(200).json({ packSizes: results });
  } catch (err) {
    console.error("PackSize API error:", err);
    return res.status(500).json({ message: "Failed to fetch pack sizes", error: err.message });
  }
}
