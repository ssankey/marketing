// pages/api/top-outstanding/customers.js
// Top Outstanding Customer report, ported from the Spring Boot
// BalanceRepository.findTopOutstandingBySlpCode() query. slpCode here isn't the
// invoice's actual salesperson — it identifies one of 4 regional managers, and
// customers are matched to them via a state->region->manager mapping (see
// RegionSalesPerson below), not via OINV/OCRD.SlpCode.

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

const TOP_OUTSTANDING_PASSWORD = "Outstanding_Report_2026";

// Region/RegionSalesPerson CASE expressions shared by both branches of the CTE below.
const REGION_CASE = `
  CASE
    WHEN ISNULL(T14.Country, '') <> 'IN' THEN 'Overseas'
    WHEN T17.State IN ('AP', 'TE') THEN 'Central'
    WHEN T17.State IN ('KL', 'KT', 'TN', 'PC') THEN 'South'
    WHEN T17.State IN ('MH', 'GO', 'DN') THEN 'West 1'
    WHEN T17.State = 'GJ' THEN 'West 2'
    WHEN T17.State IN ('DL', 'HR', 'HP', 'PU', 'RJ', 'UP', 'UT', 'MP', 'CH') THEN 'North'
    WHEN T17.State IN ('WB', 'JH', 'AS', 'ME') THEN 'East'
    ELSE 'Unknown'
  END
`;
const REGION_SALES_PERSON_CASE = `
  CASE
    WHEN ISNULL(T14.Country, '') <> 'IN' THEN 'Overseas Sales Person'
    WHEN T17.State IN ('AP', 'TE') THEN 'Hemanth V'
    WHEN T17.State IN ('KL', 'KT', 'TN', 'PC') THEN 'Aditya Deshpande'
    WHEN T17.State IN ('MH', 'GO', 'DN') THEN 'Ashish Tripathi'
    WHEN T17.State = 'GJ' THEN 'Ashish Tripathi'
    WHEN T17.State IN ('DL', 'HR', 'HP', 'PU', 'RJ', 'UP', 'UT', 'MP', 'CH') THEN 'Maneesh S'
    WHEN T17.State IN ('WB', 'JH', 'AS', 'ME') THEN 'Maneesh S'
    ELSE 'Unknown'
  END
`;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try { verify(authHeader.split(" ")[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Invalid token" }); }

  const { password, slpCode } = req.query;
  if (password !== TOP_OUTSTANDING_PASSWORD) return res.status(403).json({ error: "Incorrect report password" });

  const slpCodeNum = parseInt(slpCode, 10);
  if (!slpCode || isNaN(slpCodeNum)) return res.status(400).json({ error: "slpCode is required" });

  try {
    // Look up the real salesperson name from OSLP instead of hardcoding a
    // SlpCode->name map (a previous hardcoded map had codes 18/11 swapped).
    const nameRows = await queryDatabase(
      `SELECT SlpName FROM OSLP WHERE SlpCode = @slpCode`,
      [{ name: "slpCode", type: sql.Int, value: slpCodeNum }]
    );
    if (nameRows.length === 0) return res.status(200).json([]);
    const regionSalesPerson = nameRows[0].SlpName;

    // Step 1 — InvoiceBase: run the 5-table JOIN once for ALL customers.
    // Step 2 — CustomerTotals: aggregate TotalOutstanding + OverdueAmount per customer.
    // Step 3 — CustomerWithRegion: attach region info and filter by RegionSalesPerson.
    const query = `
      WITH InvoiceBase AS (
        SELECT
          T13.CardCode,
          (T13.DocTotal - T13.PaidToDate) AS BalanceDue,
          DATEDIFF(DAY, T13.DocDueDate, GETDATE()) AS OverdueDays,
          ROW_NUMBER() OVER (
            PARTITION BY T13.DocNum
            ORDER BY T13.DocDate DESC
          ) AS rn
        FROM ORDR T0
        JOIN RDR1 T1   ON T1.DocEntry = T0.DocEntry
        JOIN DLN1 T2   ON T2.BaseEntry = T1.DocEntry
                       AND T2.BaseLine = T1.LineNum
                       AND T2.ItemCode = T1.ItemCode
        JOIN ODLN T3   ON T3.DocEntry = T2.DocEntry
        JOIN INV1 T12  ON T12.BaseEntry = T2.DocEntry
                       AND T12.BaseLine = T2.LineNum
                       AND T12.ItemCode = T2.ItemCode
        JOIN OINV T13  ON T13.DocEntry = T12.DocEntry
        JOIN OCRD T14  ON T14.CardCode = T13.CardCode
        WHERE (T13.DocTotal - T13.PaidToDate) > 1
          AND T14.CardType = 'C'
          AND T13.CANCELED = 'N'
      ),
      CustomerTotals AS (
        SELECT
          CardCode,
          SUM(BalanceDue) AS TotalOutstanding,
          SUM(CASE WHEN OverdueDays >= 0 THEN BalanceDue ELSE 0 END) AS OverdueAmount
        FROM InvoiceBase
        WHERE rn = 1
        GROUP BY CardCode
      ),
      CustomerWithRegion AS (
        SELECT
          T0.CardCode,
          T0.CardName,
          CT.TotalOutstanding,
          CT.OverdueAmount,
          T17.State,
          T14.Country,
          ${REGION_CASE} AS Region,
          ${REGION_SALES_PERSON_CASE} AS RegionSalesPerson
        FROM OCRD T0
        JOIN OCRD T14  ON T0.CardCode = T14.CardCode
        JOIN CustomerTotals CT ON T0.CardCode = CT.CardCode
        -- CRD1 has one row per address (billing, shipping, possibly several of
        -- each) — a plain join on CardCode fans out into duplicate customer
        -- rows. Pick exactly one: prefer the billing address, else whatever's
        -- there, so a customer with no 'B' row still shows up (State/Region
        -- fall through to 'Unknown' via the CASE below) instead of being lost.
        OUTER APPLY (
          SELECT TOP 1 State
          FROM CRD1
          WHERE CardCode = T14.CardCode
          ORDER BY CASE WHEN AdresType = 'B' THEN 0 ELSE 1 END, Address
        ) T17
        WHERE T0.CardType = 'C'
      )
      SELECT
        CardCode,
        CardName,
        TotalOutstanding,
        OverdueAmount,
        Region,
        RegionSalesPerson,
        State,
        Country
      FROM CustomerWithRegion
      WHERE TotalOutstanding > 0
        AND RegionSalesPerson = @regionSalesPerson
      ORDER BY TotalOutstanding DESC;
    `;

    const rows = await queryDatabase(query, [
      { name: "regionSalesPerson", type: sql.NVarChar, value: regionSalesPerson },
    ]);

    const customers = rows.map((r) => ({
      cardCode: r.CardCode,
      customerName: r.CardName,
      totalOutstanding: parseFloat(r.TotalOutstanding) || 0,
      overdueAmount: parseFloat(r.OverdueAmount) || 0,
      region: r.Region,
    }));

    return res.status(200).json(customers);
  } catch (error) {
    console.error("Top outstanding customers error:", error);
    return res.status(500).json({ error: "Failed to load top outstanding customers", details: error.message });
  }
}
