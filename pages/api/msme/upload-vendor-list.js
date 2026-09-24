// pages/api/msme/upload-vendor-list.js
// Stores the uploaded MSME vendor list (Sr No, Vendor Name, MSME Reg No, Type of Business).
// Each upload fully replaces the previous list — the report always reads from the latest one.

import { verify } from "jsonwebtoken";
import sql        from "mssql";
import { queryDatabase } from "../../../lib/db";

const MSME_PASSWORD = "msme2526report";
const BATCH_SIZE = 200; // keep well under SQL Server's 2100-parameter-per-query limit

async function ensureTable() {
  await queryDatabase(`
    IF OBJECT_ID('dbo.msme_vendor', 'U') IS NULL
    CREATE TABLE dbo.msme_vendor (
      id               INT IDENTITY(1,1) PRIMARY KEY,
      sr_no            INT NULL,
      vendor_name      NVARCHAR(255) NOT NULL,
      msme_reg_no      NVARCHAR(100) NULL,
      type_of_business NVARCHAR(255) NULL,
      uploaded_at      DATETIME NOT NULL DEFAULT GETDATE()
    );
  `);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { password, rows } = req.body || {};
  if (password !== MSME_PASSWORD) return res.status(403).json({ error: "Incorrect MSME report password" });

  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ error: "No rows to upload" });

  const cleanRows = rows
    .map(r => ({
      srNo:           r.srNo === "" || r.srNo == null ? null : parseInt(r.srNo) || null,
      vendorName:     String(r.vendorName || "").trim(),
      msmeRegNo:      String(r.msmeRegNo || "").trim() || null,
      typeOfBusiness: String(r.typeOfBusiness || "").trim() || null,
    }))
    .filter(r => r.vendorName);

  if (cleanRows.length === 0)
    return res.status(400).json({ error: "Invalid file format — every row needs a Vendor Name" });

  try {
    await ensureTable();
    await queryDatabase(`DELETE FROM dbo.msme_vendor`);

    for (let start = 0; start < cleanRows.length; start += BATCH_SIZE) {
      const batch = cleanRows.slice(start, start + BATCH_SIZE);
      const values = [];
      const params = [];

      batch.forEach((r, i) => {
        values.push(`(@sr${i}, @vn${i}, @msme${i}, @tob${i})`);
        params.push({ name: `sr${i}`,   type: sql.Int,        value: r.srNo });
        params.push({ name: `vn${i}`,   type: sql.NVarChar,   value: r.vendorName });
        params.push({ name: `msme${i}`, type: sql.NVarChar,   value: r.msmeRegNo });
        params.push({ name: `tob${i}`,  type: sql.NVarChar,   value: r.typeOfBusiness });
      });

      await queryDatabase(
        `INSERT INTO dbo.msme_vendor (sr_no, vendor_name, msme_reg_no, type_of_business) VALUES ${values.join(",")}`,
        params
      );
    }

    return res.status(200).json({ success: true, count: cleanRows.length });
  } catch (err) {
    console.error("MSME upload error:", err);
    return res.status(500).json({ error: "Failed to save vendor list", details: err.message });
  }
}
