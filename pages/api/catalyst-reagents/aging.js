// pages/api/catalyst-reagents/aging.js
// Stock aging snapshot: current in-stock batches (OIBT), bucketed by age
// (today/asOfDate minus each batch's earliest OBTN.InDate), valued at the
// same per-item WebPrice used by lib/models/products.js's pricingJoin.
// OBTN has no document backlink to the GRN itself (confirmed — no
// DocEntry/DocNum column), so "GRN Transactions" here is defined as the
// count of distinct current stock lots (ItemCode+BatchNum), not a literal
// count of GRN documents — see the plan for why.

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

const getMulti = (query, key) => {
  const val = query[key];
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

const BUCKETS = ["0-30", "30-60", "60-90", "90-120", "120+"];

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
    const asOfDate = req.query.asOfDate || new Date().toISOString().slice(0, 10);

    const catParams = itmsGrpNams.map((_, i) => `@cat${i}`).join(",");
    const params = [
      { name: "asOfDate", type: sql.Date, value: asOfDate },
      ...itmsGrpNams.map((v, i) => ({ name: `cat${i}`, type: sql.NVarChar, value: v })),
    ];

    const query = `
      WITH BatchStock AS (
        SELECT
          B.ItemCode, B.BatchNum, B.Quantity,
          T6.ItmsGrpNam AS Category,
          (SELECT MIN(InDate) FROM OBTN WHERE ItemCode = B.ItemCode AND DistNumber = B.BatchNum) AS InDate
        FROM OIBT B
        INNER JOIN OITM T5 ON B.ItemCode = T5.ItemCode
        INNER JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
        WHERE B.Quantity > 0 AND T6.ItmsGrpNam IN (${catParams})
      ),
      Priced AS (
        SELECT
          BS.ItemCode, BS.BatchNum, BS.Quantity, BS.Category, BS.InDate,
          ISNULL(PR.U_Price, 0) AS WebPrice,
          CASE WHEN BS.InDate IS NULL THEN NULL ELSE DATEDIFF(day, BS.InDate, @asOfDate) END AS AgeDays
        FROM BatchStock BS
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
        ) PR ON PR.ItemCode = BS.ItemCode
      )
      SELECT
        Category,
        CASE
          WHEN AgeDays IS NULL THEN '120+'
          WHEN AgeDays <= 30 THEN '0-30'
          WHEN AgeDays <= 60 THEN '30-60'
          WHEN AgeDays <= 90 THEN '60-90'
          WHEN AgeDays <= 120 THEN '90-120'
          ELSE '120+'
        END AS Bucket,
        SUM(Quantity) AS Qty,
        SUM(Quantity * WebPrice) AS Value,
        COUNT(DISTINCT ItemCode) AS ItemCount,
        COUNT(*) AS LotCount
      FROM Priced
      GROUP BY Category,
        CASE
          WHEN AgeDays IS NULL THEN '120+'
          WHEN AgeDays <= 30 THEN '0-30'
          WHEN AgeDays <= 60 THEN '30-60'
          WHEN AgeDays <= 90 THEN '60-90'
          WHEN AgeDays <= 120 THEN '90-120'
          ELSE '120+'
        END;
    `;

    // Distinct items overall (queried separately, not derived from the
    // bucketed rows, so an item with stock spread across multiple age
    // buckets doesn't get double-counted).
    const distinctItemsQuery = `
      SELECT COUNT(DISTINCT B.ItemCode) AS ItemCount
      FROM OIBT B
      INNER JOIN OITM T5 ON B.ItemCode = T5.ItemCode
      INNER JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      WHERE B.Quantity > 0 AND T6.ItmsGrpNam IN (${catParams});
    `;

    const [rows, itemCountRows] = await Promise.all([
      queryDatabase(query, params),
      queryDatabase(distinctItemsQuery, params),
    ]);

    const byCategoryBucket = rows.map((r) => ({
      category: r.Category,
      bucket: r.Bucket,
      qty: parseFloat(r.Qty) || 0,
      value: parseFloat(r.Value) || 0,
      itemCount: parseInt(r.ItemCount) || 0,
      lotCount: parseInt(r.LotCount) || 0,
    }));

    const totals = byCategoryBucket.reduce(
      (acc, r) => ({
        stockValue: acc.stockValue + r.value,
        quantity: acc.quantity + r.qty,
        lots: acc.lots + r.lotCount,
      }),
      { stockValue: 0, quantity: 0, lots: 0 }
    );
    totals.items = parseInt(itemCountRows[0]?.ItemCount) || 0;

    return res.status(200).json({ byCategoryBucket, totals, buckets: BUCKETS, asOfDate });
  } catch (error) {
    console.error("Catalyst-reagents aging error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
