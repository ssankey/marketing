// pages/api/catalyst-reagents/summary.js
// Monthly Sales/COGS/GM%/Order Value/Invoice Count for the Catalyst, Fine
// Chemical & Reagent dashboard — same UNION ALL (OINV/INV1 net of ORIN/RIN1)
// shape as pages/api/sales-cogs.js, but category is mandatory here (not
// optional) and the date scope is an explicit startDate/endDate range
// instead of a whole calendar year, so the page's FY-or-custom-range picker
// can drive it directly. Left sales-cogs.js itself untouched — that endpoint
// is shared by the main dashboard chart.

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
    const { startDate, endDate } = req.query;

    if (itmsGrpNams.length === 0) {
      return res.status(400).json({ error: "At least one itmsGrpNam is required" });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const catParams = itmsGrpNams.map((_, i) => `@cat${i}`).join(",");
    const params = [
      { name: "startDate", type: sql.Date, value: startDate },
      { name: "endDate", type: sql.Date, value: endDate },
      ...itmsGrpNams.map((v, i) => ({ name: `cat${i}`, type: sql.NVarChar, value: v })),
    ];

    // Shared by the invoice branch (OINV/INV1) and the credit-note branch
    // (ORIN/RIN1) below — CANCELED filter on both, date range on T0.DocDate,
    // category filter on the joined OITB name.
    const baseWhere = `
      T0.CANCELED <> 'Y' AND T0.CANCELED <> 'C'
      AND T0.DocDate >= @startDate AND T0.DocDate < DATEADD(day, 1, @endDate)
      AND T6.ItmsGrpNam IN (${catParams})
    `;

    // ── Query 1: Sales + COGS + GM% (invoices net of credit notes) ──────
    const salesQuery = `
      SELECT [Month-Year], year, monthNumber,
        SUM(LineTotalAmt) AS TotalSales,
        SUM(CogsAmt) AS TotalCOGS,
        CASE
          WHEN SUM(LineTotalAmt) = 0 THEN 0
          ELSE ROUND(((SUM(LineTotalAmt) - SUM(CogsAmt)) * 100.0) / SUM(LineTotalAmt), 2)
        END AS GrossMarginPct
      FROM (
        SELECT
          DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
          YEAR(T0.DocDate)  AS year,
          MONTH(T0.DocDate) AS monthNumber,
          T1.LineTotal AS LineTotalAmt,
          (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0
                THEN IC.ParsedItemCost
                ELSE T1.GrossBuyPr END) * T1.Quantity AS CogsAmt
        FROM OINV T0
        JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
        JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(T1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        WHERE ${baseWhere}

        UNION ALL

        SELECT
          DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
          YEAR(T0.DocDate)  AS year,
          MONTH(T0.DocDate) AS monthNumber,
          -T1.LineTotal AS LineTotalAmt,
          -- Credit notes net against Sales only, not COGS — same convention as sales-cogs.js
          0 AS CogsAmt
        FROM ORIN T0
        JOIN RIN1 T1 ON T0.DocEntry = T1.DocEntry
        JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
        JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
        WHERE ${baseWhere}
      ) AS Combined
      GROUP BY [Month-Year], year, monthNumber
      ORDER BY year, monthNumber;
    `;

    // ── Query 2: Invoice line count ──────────────────────────
    const invoiceCountQuery = `
      SELECT
        DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
        COUNT(*) AS InvoiceCount
      FROM OINV T0
      JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      WHERE ${baseWhere}
      GROUP BY
        DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2),
        YEAR(T0.DocDate), MONTH(T0.DocDate);
    `;

    // ── Query 3: Order value — category is always active on this page, so
    // this always uses the item-joined variant (sales-cogs.js's hasItemOrCat
    // branch), never the simpler DocTotal-based one. ──
    const orderValueQuery = `
      SELECT
        DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
        YEAR(T0.DocDate)  AS year,
        MONTH(T0.DocDate) AS monthNumber,
        SUM(T1.LineTotal) AS TotalOrderValue
      FROM ORDR T0
      JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      WHERE ${baseWhere}
      GROUP BY
        DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2),
        YEAR(T0.DocDate), MONTH(T0.DocDate)
      ORDER BY YEAR(T0.DocDate), MONTH(T0.DocDate);
    `;

    // Distinct invoice years for these categories, unfiltered by date range —
    // lets the client build its FY dropdown independent of whichever range
    // happens to be selected right now.
    const yearsCatParams = itmsGrpNams.map((_, i) => `@ycat${i}`).join(",");
    const yearsQuery = `
      SELECT DISTINCT YEAR(T0.DocDate) AS year
      FROM OINV T0
      JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      WHERE T0.CANCELED <> 'Y' AND T0.CANCELED <> 'C' AND T6.ItmsGrpNam IN (${yearsCatParams})
      ORDER BY year DESC;
    `;
    const yearsParams = itmsGrpNams.map((v, i) => ({ name: `ycat${i}`, type: sql.NVarChar, value: v }));

    const [salesRes, invoiceRes, orderRes, yearsRes] = await Promise.all([
      queryDatabase(salesQuery, params),
      queryDatabase(invoiceCountQuery, params),
      queryDatabase(orderValueQuery, params),
      queryDatabase(yearsQuery, yearsParams),
    ]);

    const salesMap = {};
    salesRes.forEach((r) => {
      salesMap[r["Month-Year"]] = {
        monthYear: r["Month-Year"], year: r.year, monthNumber: r.monthNumber,
        totalSales: parseFloat(r.TotalSales) || 0,
        totalCogs: parseFloat(r.TotalCOGS) || 0,
        grossMarginPct: parseFloat(r.GrossMarginPct) || 0,
      };
    });

    const invoiceMap = {};
    invoiceRes.forEach((r) => {
      invoiceMap[r["Month-Year"]] = { invoiceCount: parseInt(r.InvoiceCount) || 0 };
    });

    const orderMap = {};
    orderRes.forEach((r) => {
      orderMap[r["Month-Year"]] = {
        year: r.year, monthNumber: r.monthNumber,
        orderValue: parseFloat(r.TotalOrderValue) || 0,
      };
    });

    const allKeys = new Set([
      ...Object.keys(salesMap),
      ...Object.keys(invoiceMap),
      ...Object.keys(orderMap),
    ]);

    const data = Array.from(allKeys).map((key) => ({
      monthYear: key,
      year: salesMap[key]?.year ?? orderMap[key]?.year ?? null,
      monthNumber: salesMap[key]?.monthNumber ?? orderMap[key]?.monthNumber ?? null,
      totalSales: salesMap[key]?.totalSales || 0,
      totalCogs: salesMap[key]?.totalCogs || 0,
      grossMarginPct: salesMap[key]?.grossMarginPct || 0,
      invoiceCount: invoiceMap[key]?.invoiceCount || 0,
      orderValue: orderMap[key]?.orderValue || 0,
    })).sort((a, b) => (a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber));

    const totalSales = data.reduce((sum, d) => sum + d.totalSales, 0);
    const totalCogs = data.reduce((sum, d) => sum + d.totalCogs, 0);
    const totals = {
      totalSales,
      totalCogs,
      grossMarginPct: totalSales > 0 ? ((totalSales - totalCogs) * 100) / totalSales : 0,
      orderValue: data.reduce((sum, d) => sum + d.orderValue, 0),
    };

    const availableYears = yearsRes.map((r) => r.year);

    return res.status(200).json({ data, totals, availableYears });
  } catch (error) {
    console.error("Catalyst-reagents summary error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
