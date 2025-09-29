// pages/api/daily-report/chart-data.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from '../../../lib/db';
import { getCache, setCache } from "../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { 
      year,
      month,
      slpCode, 
      itmsGrpCod, 
      itemCode, 
      cntctCode, 
      cardCode
    } = req.query;
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      return res.status(401).json({ error: "Token verification failed" });
    }

    const isAdmin = decoded.role === "admin";
    const contactCodes = decoded.contactCodes || [];
    const cardCodes = decoded.cardCodes || [];

    // Create cache key
    const userIdentifier = isAdmin ? "admin" : contactCodes.length ? contactCodes.join("-") : cardCodes.join("-");
    const cacheKey = `daily-chart-data:${userIdentifier}:${year || "all"}:${month || "all"}:${slpCode || "all"}:${cardCode || "all"}:${cntctCode || "all"}:${itmsGrpCod || "all"}:${itemCode || "all"}`;

    // Check cache
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    // Build WHERE clauses
    const whereClauses = ["T0.CANCELED = 'N'"];
    const params = [];

    // Apply role-based filtering
    if (!isAdmin) {
      if (contactCodes.length > 0) {
        whereClauses.push(`T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})`);
      } else if (cardCodes.length > 0) {
        whereClauses.push(`T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`);
      } else {
        return res.status(403).json({ error: "No access: cardCodes or contactCodes not provided" });
      }
    }

    // Year and Month filter (required)
    if (year) {
      whereClauses.push(`YEAR(T0.DocDate) = @year`);
      params.push({ name: "year", type: sql.Int, value: parseInt(year) });
    }

    if (month) {
      whereClauses.push(`MONTH(T0.DocDate) = @month`);
      params.push({ name: "month", type: sql.Int, value: parseInt(month) });
    }

    // Apply optional filters
    if (slpCode) {
      whereClauses.push(`T0.SlpCode = @slpCode`);
      params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
    }

    if (cntctCode) {
      whereClauses.push(`T0.CntctCode = @cntctCode`);
      params.push({ name: "cntctCode", type: sql.Int, value: parseInt(cntctCode) });
    }

    if (itmsGrpCod) {
      whereClauses.push(`T3.ItmsGrpCod = @itmsGrpCod`);
      params.push({ name: "itmsGrpCod", type: sql.Int, value: parseInt(itmsGrpCod) });
    }

    if (cardCode) {
      whereClauses.push(`T0.CardCode = @cardCode`);
      params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
    }

    if (itemCode) {
      whereClauses.push(`T1.ItemCode = @itemCode`);
      params.push({ name: "itemCode", type: sql.VarChar, value: itemCode });
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT 
          DAY(T0.DocDate) AS [Day],
          COUNT(DISTINCT T0.DocNum) AS [OrderCount],
          SUM(T1.LineTotal) AS [TotalValue]
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
      ${whereSQL}
      GROUP BY DAY(T0.DocDate)
      ORDER BY DAY(T0.DocDate) ASC;
    `;

    const results = await queryDatabase(query, params);

    const chartData = results.map(row => ({
      day: row.Day,
      orderCount: row.OrderCount || 0,
      totalValue: row.TotalValue || 0
    }));

    // Cache for 30 minutes
    await setCache(cacheKey, chartData, 1800);

    res.status(200).json(chartData);

  } catch (error) {
    console.error('Daily report chart data API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}