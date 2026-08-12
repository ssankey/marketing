import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from '../../../lib/db';
import { getCache, setCache } from "../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { year, month, slpCode, itmsGrpCod, itemCode, cntctCode, cardCode } = req.query;

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "Missing or malformed Authorization header" });

    let decoded;
    try {
      decoded = verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Token verification failed" });
    }

    const isAdmin      = decoded.role === "admin";
    const contactCodes = decoded.contactCodes || [];
    const cardCodes    = decoded.cardCodes || [];

    const userIdentifier = isAdmin ? "admin" : contactCodes.length ? contactCodes.join("-") : cardCodes.join("-");
    const cacheKey = `daily-invoice-chart:${userIdentifier}:${year||"all"}:${month||"all"}:${slpCode||"all"}:${cardCode||"all"}:${cntctCode||"all"}:${itmsGrpCod||"all"}:${itemCode||"all"}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    // Base filters shared between the invoice branch (OINV/INV1) and the
    // credit note branch (ORIN/RIN1) netted together in salesQuery below.
    const baseWhereClauses = ["T0.CANCELED = 'N'"];
    const params = [];

    if (!isAdmin) {
      if (contactCodes.length > 0)
        baseWhereClauses.push(`T0.SlpCode IN (${contactCodes.map(c => `'${c}'`).join(",")})`);
      else if (cardCodes.length > 0)
        baseWhereClauses.push(`T0.CardCode IN (${cardCodes.map(c => `'${c}'`).join(",")})`);
      else
        return res.status(403).json({ error: "No access" });
    }

    if (year)  { baseWhereClauses.push(`YEAR(T0.DocDate)  = @year`);  params.push({ name: "year",  type: sql.Int,     value: parseInt(year)  }); }
    if (month) { baseWhereClauses.push(`MONTH(T0.DocDate) = @month`); params.push({ name: "month", type: sql.Int,     value: parseInt(month) }); }
    if (slpCode)    { baseWhereClauses.push(`T0.SlpCode = @slpCode`);       params.push({ name: "slpCode",    type: sql.Int,     value: parseInt(slpCode)    }); }
    if (cntctCode)  { baseWhereClauses.push(`T0.CntctCode = @cntctCode`);   params.push({ name: "cntctCode",  type: sql.Int,     value: parseInt(cntctCode)  }); }
    if (itmsGrpCod) {
        baseWhereClauses.push(`EXISTS (
            SELECT 1 FROM OITM I2
            WHERE I2.ItemCode = T1.ItemCode
            AND I2.ItmsGrpCod = @itmsGrpCod
        )`);
        params.push({ name: "itmsGrpCod", type: sql.Int, value: parseInt(itmsGrpCod) });
        }
    if (cardCode)   { baseWhereClauses.push(`T0.CardCode = @cardCode`);      params.push({ name: "cardCode",   type: sql.VarChar, value: cardCode             }); }
    if (itemCode)   { baseWhereClauses.push(`T1.ItemCode = @itemCode`);      params.push({ name: "itemCode",   type: sql.VarChar, value: itemCode             }); }

    // ── Invoice WHERE (OINV/INV1) — base + invoice-only IssReason ──
    const whereClauses = [...baseWhereClauses, "T0.[IssReason] <> '4'"];
    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    // ── Credit note WHERE (ORIN/RIN1) — same base filters, no IssReason ──
    const creditNoteWhereClauses = [...baseWhereClauses];
    const creditNoteWhereSQL = `WHERE ${creditNoteWhereClauses.join(" AND ")}`;

    // Invoice count is NOT netted — a credit note doesn't "un-count" the
    // original invoice document, so this stays a plain OINV/INV1 count.
    const invoiceCountQuery = `
      SELECT
        DAY(T0.DocDate)           AS [Day],
        COUNT(DISTINCT T0.DocNum) AS [InvoiceCount]
      FROM OINV T0
      INNER JOIN INV1 T1  ON T0.DocEntry = T1.DocEntry
      LEFT  JOIN OITM T3  ON T1.ItemCode = T3.ItemCode
      ${whereSQL}
      GROUP BY DAY(T0.DocDate)
      ORDER BY DAY(T0.DocDate) ASC;
    `;

    // Total value net of credit notes for the same day/scope
    const salesQuery = `
      SELECT [Day], SUM(LineTotalAmt) AS TotalValue
      FROM (
        SELECT
          DAY(T0.DocDate) AS [Day],
          T1.LineTotal    AS LineTotalAmt
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
        ${whereSQL}

        UNION ALL

        SELECT
          DAY(T0.DocDate) AS [Day],
          -T1.LineTotal   AS LineTotalAmt
        FROM ORIN T0
        INNER JOIN RIN1 T1 ON T0.DocEntry = T1.DocEntry
        LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
        ${creditNoteWhereSQL}
      ) AS Combined
      GROUP BY [Day]
      ORDER BY [Day] ASC;
    `;

    const [invoiceCountRes, salesRes] = await Promise.all([
      queryDatabase(invoiceCountQuery, params),
      queryDatabase(salesQuery, params),
    ]);

    const invoiceCountMap = {};
    invoiceCountRes.forEach(row => { invoiceCountMap[row.Day] = row.InvoiceCount || 0; });

    const salesMap = {};
    salesRes.forEach(row => { salesMap[row.Day] = row.TotalValue || 0; });

    const allDays = Array.from(new Set([
      ...invoiceCountRes.map(row => row.Day),
      ...salesRes.map(row => row.Day),
    ])).sort((a, b) => a - b);

    const chartData = allDays.map(day => ({
      day,
      invoiceCount: invoiceCountMap[day] || 0,
      totalValue:   salesMap[day]        || 0,
    }));

    await setCache(cacheKey, chartData, 1800);
    res.status(200).json(chartData);

  } catch (error) {
    console.error('Daily invoice chart-data error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
}