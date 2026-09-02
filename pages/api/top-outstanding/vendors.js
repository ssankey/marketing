// pages/api/top-outstanding/vendors.js
// Top Outstanding Vendor report, ported from the Spring Boot
// VendorBalanceRepository.findTopOutstandingByVendorName() query. Unlike the
// customer version, this has no TotalOutstanding > 0 filter and no
// salesperson/region-manager concept — it's a plain vendor-name search that
// returns every matching CardType 'S'/'V' vendor with whatever outstanding
// balance (possibly 0) they currently have, used by both the search tab and
// the Local/Overseas vendor tabs (search='' there, filtered by country client-side).

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

const TOP_OUTSTANDING_PASSWORD = "Outstanding_Report_2026";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { password, search = "" } = req.query;
  if (password !== TOP_OUTSTANDING_PASSWORD) return res.status(403).json({ error: "Incorrect report password" });

  try {
    const query = `
      WITH InvoiceBase AS (
        SELECT
          H.CardCode,
          (H.DocTotal - H.PaidToDate) AS BalanceDue,
          DATEDIFF(DAY, H.DocDueDate, GETDATE()) AS OverdueDays,
          ROW_NUMBER() OVER (PARTITION BY H.DocNum ORDER BY H.DocDate DESC) AS rn
        FROM OPCH H
        JOIN OCRD C ON H.CardCode = C.CardCode
        WHERE H.CANCELED = 'N'
          AND (H.DocTotal - H.PaidToDate) > 1
          AND C.CardType IN ('S', 'V')
      ),
      VendorTotals AS (
        SELECT
          CardCode,
          SUM(BalanceDue) AS TotalOutstanding,
          SUM(CASE WHEN OverdueDays >= 0 THEN BalanceDue ELSE 0 END) AS OverdueAmount
        FROM InvoiceBase
        WHERE rn = 1
        GROUP BY CardCode
      ),
      VendorWithRegion AS (
        SELECT
          C.CardCode,
          C.CardName,
          C.Country,
          T17.State,
          ISNULL(VT.TotalOutstanding, 0) AS TotalOutstanding,
          ISNULL(VT.OverdueAmount, 0)    AS OverdueAmount,
          CASE
            WHEN ISNULL(C.Country, '') <> 'IN' THEN 'Overseas'
            WHEN T17.State IN ('AP', 'TE') THEN 'Central'
            WHEN T17.State IN ('KL', 'KT', 'TN', 'PC') THEN 'South'
            WHEN T17.State IN ('MH', 'GO', 'DN') THEN 'West 1'
            WHEN T17.State = 'GJ' THEN 'West 2'
            WHEN T17.State IN ('DL', 'HR', 'HP', 'PU', 'RJ', 'UP', 'UT', 'MP', 'CH') THEN 'North'
            WHEN T17.State IN ('WB', 'JH', 'AS', 'ME') THEN 'East'
            ELSE 'Unknown'
          END AS Region
        FROM OCRD C
        LEFT JOIN CRD1 T17 ON C.CardCode = T17.CardCode AND T17.AdresType = 'B'
        LEFT JOIN VendorTotals VT ON C.CardCode = VT.CardCode
        WHERE C.CardType IN ('S', 'V')
          AND C.CardName LIKE @searchLike
      )
      SELECT CardCode, CardName, Country, State, Region, TotalOutstanding, OverdueAmount
      FROM VendorWithRegion
      ORDER BY TotalOutstanding DESC;
    `;

    const rows = await queryDatabase(query, [
      { name: "searchLike", type: sql.NVarChar, value: `%${search.trim()}%` },
    ]);

    const vendors = rows.map((r) => ({
      vendorCode: r.CardCode,
      vendorName: r.CardName,
      country: r.Country,
      state: r.State,
      region: r.Region,
      totalOutstanding: parseFloat(r.TotalOutstanding) || 0,
      overdueAmount: parseFloat(r.OverdueAmount) || 0,
    }));

    return res.status(200).json(vendors);
  } catch (error) {
    console.error("Top outstanding vendors error:", error);
    return res.status(500).json({ error: "Failed to load top outstanding vendors", details: error.message });
  }
}
