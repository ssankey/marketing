// pages/api/top-outstanding/sales-persons.js
// Regional-manager dropdown for the Top Outstanding Customer report — restricted
// to the 4 SlpCodes the report's region-based mapping is actually built around
// (see customers.js), not the full OSLP list.

import { verify } from "jsonwebtoken";
import { queryDatabase } from "../../../lib/db";

const TOP_OUTSTANDING_PASSWORD = "Outstanding_Report_2026";
const REGION_SLP_CODES = [21, 22, 18, 11];

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { password } = req.query;
  if (password !== TOP_OUTSTANDING_PASSWORD) return res.status(403).json({ error: "Incorrect report password" });

  try {
    const query = `
      SELECT SlpCode, SlpName
      FROM OSLP
      WHERE SlpCode IN (${REGION_SLP_CODES.join(",")})
      ORDER BY SlpName;
    `;
    const salesPersons = await queryDatabase(query);
    return res.status(200).json(salesPersons);
  } catch (error) {
    console.error("Top outstanding sales-persons error:", error);
    return res.status(500).json({ error: "Failed to load sales persons", details: error.message });
  }
}
