// pages/api/catalyst-reagents/aging-items.js
// Row-level batches behind one cell of the Aging Details table — same
// OIBT/OBTN/pricing basis as aging.js, just returning individual batches
// instead of bucket sums. `category` and `bucket` are both optional: omit
// either (or pass "ALL") to cover every category / every bucket, which is
// what clicking a Total row or Total column cell needs.

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
    const asOfDate = req.query.asOfDate || new Date().toISOString().slice(0, 10);
    const { category, bucket } = req.query;

    const catParams = itmsGrpNams.map((_, i) => `@cat${i}`).join(",");
    const params = [
      { name: "asOfDate", type: sql.Date, value: asOfDate },
      ...itmsGrpNams.map((v, i) => ({ name: `cat${i}`, type: sql.NVarChar, value: v })),
    ];

    let categoryFilter = "";
    if (category && category !== "ALL") {
      categoryFilter = "AND T6.ItmsGrpNam = @category";
      params.push({ name: "category", type: sql.NVarChar, value: category });
    }

    const query = `
      WITH BatchStock AS (
        SELECT
          B.ItemCode, B.BatchNum, B.Quantity,
          T5.ItemName, T5.U_CasNo AS CasNo, T5.U_IUPACName AS Description,
          T6.ItmsGrpNam AS Category,
          (SELECT MIN(InDate) FROM OBTN WHERE ItemCode = B.ItemCode AND DistNumber = B.BatchNum) AS InDate
        FROM OIBT B
        INNER JOIN OITM T5 ON B.ItemCode = T5.ItemCode
        INNER JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
        WHERE B.Quantity > 0 AND T6.ItmsGrpNam IN (${catParams}) ${categoryFilter}
      ),
      Priced AS (
        SELECT
          BS.*,
          ISNULL(PR.U_Price, 0) AS WebPrice,
          CASE WHEN BS.InDate IS NULL THEN NULL ELSE DATEDIFF(day, BS.InDate, @asOfDate) END AS AgeDays
        FROM BatchStock BS
        LEFT JOIN (
          SELECT U_Code AS ItemCode, U_Price
          FROM (
            SELECT
              H.U_Code, R.U_Price,
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
      SELECT *,
        CASE
          WHEN AgeDays IS NULL THEN '120+'
          WHEN AgeDays <= 30 THEN '0-30'
          WHEN AgeDays <= 60 THEN '30-60'
          WHEN AgeDays <= 90 THEN '60-90'
          WHEN AgeDays <= 120 THEN '90-120'
          ELSE '120+'
        END AS Bucket
      FROM Priced
      ORDER BY Category, ItemCode, BatchNum;
    `;

    const rows = await queryDatabase(query, params);

    const filtered = bucket && bucket !== "ALL" ? rows.filter((r) => r.Bucket === bucket) : rows;

    const items = filtered.map((r) => ({
      itemCode: r.ItemCode,
      itemName: r.ItemName,
      description: r.Description,
      casNo: r.CasNo,
      category: r.Category,
      bucket: r.Bucket,
      batchNum: r.BatchNum,
      grnDate: r.InDate ? new Date(r.InDate).toISOString().slice(0, 10) : null,
      stock: parseFloat(r.Quantity) || 0,
      price: parseFloat(r.WebPrice) || 0,
      value: (parseFloat(r.Quantity) || 0) * (parseFloat(r.WebPrice) || 0),
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Catalyst-reagents aging-items error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
