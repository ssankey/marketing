// pages/api/catalyst-reagents/stock-value.js
// SUM(Stock x WebPrice) for the selected categories — a point-in-time
// inventory snapshot, deliberately independent of any date filter. Reuses
// the exact same price/stock join shape as lib/models/products.js's
// getProductsFromDatabase (pricingJoin + OITW), so this stays consistent
// with how Product Master resolves price and stock.

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

const getMulti = (query, key) => {
  const val = query[key];
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }
  try {
    verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch (e) {
    console.error("Token verification failed:", e);
    return res.status(401).json({ error: "Token verification failed" });
  }

  try {
    const itmsGrpNams = getMulti(req.query, "itmsGrpNam");
    if (itmsGrpNams.length === 0) {
      return res.status(400).json({ error: "At least one itmsGrpNam is required" });
    }

    const catParams = itmsGrpNams.map((_, i) => `@cat${i}`).join(",");
    const params = itmsGrpNams.map((v, i) => ({ name: `cat${i}`, type: sql.NVarChar, value: v }));

    const query = `
      SELECT SUM(COALESCE(W.TotalOnHand, 0) * ISNULL(PR.U_Price, 0)) AS StockValue
      FROM [dbo].[OITM] T0
      INNER JOIN [dbo].[OITB] T1 ON T0.[ItmsGrpCod] = T1.[ItmsGrpCod]
      LEFT JOIN (
        SELECT ItemCode, SUM(COALESCE(OnHand, 0)) AS TotalOnHand
        FROM [dbo].[OITW]
        GROUP BY ItemCode
      ) W ON W.ItemCode = T0.ItemCode
      LEFT JOIN (
        SELECT U_Code AS ItemCode, U_Price
        FROM (
          SELECT
            H.U_Code,
            R.U_Price,
            ROW_NUMBER() OVER (
              PARTITION BY H.U_Code
              ORDER BY H.DocEntry DESC, CASE WHEN R.U_UOM IS NOT NULL THEN 0 ELSE 1 END ASC, R.LineId ASC
            ) AS rn
          FROM [@PRICING_H] H
          INNER JOIN [@PRICING_R] R ON H.DocEntry = R.DocEntry
        ) ranked
        WHERE rn = 1
      ) PR ON PR.ItemCode = T0.ItemCode
      WHERE T1.ItmsGrpNam IN (${catParams});
    `;

    const rows = await queryDatabase(query, params);
    const stockValue = parseFloat(rows[0]?.StockValue) || 0;

    return res.status(200).json({ stockValue });
  } catch (error) {
    console.error("Catalyst-reagents stock-value error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
