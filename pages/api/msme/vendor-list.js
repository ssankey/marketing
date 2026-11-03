// pages/api/msme/vendor-list.js
// Returns the currently-saved MSME vendor list (the last uploaded Excel, reconstructed
// from the stored rows) so the user can re-download what's currently active.

import { verify } from "jsonwebtoken";
import { queryDatabase } from "../../../lib/db";

const MSME_PASSWORD = "msme2526report";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { password } = req.query;
  if (password !== MSME_PASSWORD) return res.status(403).json({ error: "Incorrect MSME report password" });

  try {
    let rows = [];
    try {
      rows = await queryDatabase(`
        SELECT sr_no AS srNo, vendor_name AS vendorName, msme_reg_no AS msmeRegNo,
               type_of_business AS typeOfBusiness, uploaded_at AS uploadedAt
        FROM dbo.msme_vendor
        ORDER BY sr_no, vendor_name
      `);
    } catch {
      rows = []; // table doesn't exist yet
    }

    if (!rows.length) return res.status(200).json({ exists: false, rows: [], uploadedAt: null });

    return res.status(200).json({ exists: true, rows, uploadedAt: rows[0].uploadedAt });
  } catch (err) {
    console.error("MSME vendor-list error:", err);
    return res.status(500).json({ error: "Failed to load vendor list", details: err.message });
  }
}
