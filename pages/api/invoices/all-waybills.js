// pages/api/invoices/all-waybills.js
// Fetch all invoices that have a TrackNo (waybill) assigned

import { verify } from "jsonwebtoken";
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const {
    search = "",
    page = 1,
    pageSize = 20,
    fromDate = "",
    toDate = "",
    product = "",
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  let whereClause = `T0.CANCELED = 'N' AND T0.TrackNo IS NOT NULL AND T0.TrackNo != ''`;

  if (search.trim()) {
    const s = search.trim().replace(/'/g, "''");
    whereClause += `
      AND (
        T0.TrackNo LIKE '%${s}%'
        OR T0.DocNum LIKE '%${s}%'
        OR T0.CardName LIKE '%${s}%'
      )
    `;
  }
  if (fromDate) whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  if (toDate) whereClause += ` AND T0.DocDate <= '${toDate}'`;
  if (product) {
    whereClause += ` AND T0.U_AirlineName = '${product.replace(/'/g, "''")}'`;
  }

  const query = `
    SELECT
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T0.CardCode,
      T0.CardName,
      T0.DocTotal,
      T0.TrackNo        AS AWBNo,
      T0.U_AirlineName  AS ProductType,
      T0.U_DispatchDate AS DispatchDate,
      SHP.TrnspName     AS CourierName,
      CASE
        WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'N' THEN 'Closed'
        WHEN T0.DocStatus = 'O' THEN 'Open'
        ELSE 'NA'
      END AS DocStatus,
      -- Destination info
      SHIP.City    AS DestCity,
      SHIP.State   AS DestState,
      SHIP.ZipCode AS DestPincode
    FROM OINV T0
    LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
    LEFT JOIN CRD1 SHIP
      ON T0.CardCode = SHIP.CardCode
      AND SHIP.AddrType = 'S'
      AND SHIP.Address = T0.ShipToCode
    WHERE ${whereClause}
    ORDER BY T0.DocDate DESC
    OFFSET ${offset} ROWS FETCH NEXT ${parseInt(pageSize)} ROWS ONLY
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM OINV T0
    WHERE ${whereClause}
  `;

  try {
    const [countResult, waybills] = await Promise.all([
      queryDatabase(countQuery),
      queryDatabase(query),
    ]);

    const formatted = waybills.map((w) => ({
      ...w,
      DocDate: w.DocDate ? w.DocDate.toISOString() : null,
      DispatchDate: w.DispatchDate ? w.DispatchDate.toISOString() : null,
      DocTotal: parseFloat(w.DocTotal || 0),
    }));

    return res.status(200).json({
      waybills: formatted,
      totalItems: countResult[0]?.total || 0,
    });
  } catch (err) {
    console.error("All waybills error:", err);
    return res.status(500).json({ error: err.message });
  }
}