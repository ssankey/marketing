// pages/api/bluedart/save-piece-count.js
// Saves a manually entered piece count for a non-Bluedart tracking number
// (is_bluedart = 'N'). Used by the All Waybills page when a tracking number
// isn't found in bluedart_waybill yet.

import { verify }        from "jsonwebtoken";
import sql                from "mssql";
import { queryDatabase }  from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { waybillNo, pieceCount } = req.body;
  const safeWaybill = String(waybillNo || "").replace(/[^a-zA-Z0-9]/g, "");
  const pc = parseInt(pieceCount);

  if (!safeWaybill) return res.status(400).json({ error: "Waybill number is required" });
  if (!pc || pc <= 0) return res.status(400).json({ error: "Piece count must be a positive number" });

  try {
    await queryDatabase(
      `MERGE bluedart_waybill AS target
       USING (SELECT @waybillNo AS waybill_no) AS src
       ON target.waybill_no = src.waybill_no
       WHEN MATCHED THEN
         UPDATE SET piece_count = @pieceCount, is_bluedart = 'N'
       WHEN NOT MATCHED THEN
         INSERT (waybill_no, piece_count, is_bluedart)
         VALUES (@waybillNo, @pieceCount, 'N');`,
      [
        { name: "waybillNo",  type: sql.VarChar, value: safeWaybill },
        { name: "pieceCount", type: sql.Int,      value: pc },
      ]
    );

    return res.status(200).json({ success: true, waybillNo: safeWaybill, pieceCount: pc });

  } catch (err) {
    console.error("Save piece count error:", err);
    return res.status(500).json({ error: err.message });
  }
}