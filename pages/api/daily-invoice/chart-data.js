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

    const whereClauses = ["T0.CANCELED = 'N'", "T0.[IssReason] <> '4'"];
    const params = [];

    if (!isAdmin) {
      if (contactCodes.length > 0)
        whereClauses.push(`T0.SlpCode IN (${contactCodes.map(c => `'${c}'`).join(",")})`);
      else if (cardCodes.length > 0)
        whereClauses.push(`T0.CardCode IN (${cardCodes.map(c => `'${c}'`).join(",")})`);
      else
        return res.status(403).json({ error: "No access" });
    }

    if (year)  { whereClauses.push(`YEAR(T0.DocDate)  = @year`);  params.push({ name: "year",  type: sql.Int,     value: parseInt(year)  }); }
    if (month) { whereClauses.push(`MONTH(T0.DocDate) = @month`); params.push({ name: "month", type: sql.Int,     value: parseInt(month) }); }
    if (slpCode)    { whereClauses.push(`T0.SlpCode = @slpCode`);       params.push({ name: "slpCode",    type: sql.Int,     value: parseInt(slpCode)    }); }
    if (cntctCode)  { whereClauses.push(`T0.CntctCode = @cntctCode`);   params.push({ name: "cntctCode",  type: sql.Int,     value: parseInt(cntctCode)  }); }
    // if (itmsGrpCod) { whereClauses.push(`T3.ItmsGrpCod = @itmsGrpCod`); params.push({ name: "itmsGrpCod", type: sql.Int,     value: parseInt(itmsGrpCod) }); }
    if (itmsGrpCod) {
        whereClauses.push(`EXISTS (
            SELECT 1 FROM OITM I2
            WHERE I2.ItemCode = T1.ItemCode
            AND I2.ItmsGrpCod = @itmsGrpCod
        )`);
        params.push({ name: "itmsGrpCod", type: sql.Int, value: parseInt(itmsGrpCod) });
        }
    if (cardCode)   { whereClauses.push(`T0.CardCode = @cardCode`);      params.push({ name: "cardCode",   type: sql.VarChar, value: cardCode             }); }
    if (itemCode)   { whereClauses.push(`T1.ItemCode = @itemCode`);      params.push({ name: "itemCode",   type: sql.VarChar, value: itemCode             }); }

    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    const query = `
      SELECT
        DAY(T0.DocDate)               AS [Day],
        COUNT(DISTINCT T0.DocNum)     AS [InvoiceCount],
        SUM(T1.LineTotal)             AS [TotalValue]
      FROM OINV T0
      INNER JOIN INV1 T1  ON T0.DocEntry = T1.DocEntry
      LEFT  JOIN OITM T3  ON T1.ItemCode = T3.ItemCode
      ${whereSQL}
      GROUP BY DAY(T0.DocDate)
      ORDER BY DAY(T0.DocDate) ASC;
    `;

    const results = await queryDatabase(query, params);
    const chartData = results.map(row => ({
      day:          row.Day,
      invoiceCount: row.InvoiceCount || 0,
      totalValue:   row.TotalValue   || 0,
    }));

    await setCache(cacheKey, chartData, 1800);
    res.status(200).json(chartData);

  } catch (error) {
    console.error('Daily invoice chart-data error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
}