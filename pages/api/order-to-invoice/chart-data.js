// pages/api/order-to-invoice/chart-data.js

// pages/api/order-to-invoice/chart-data.js
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
      financialYear, 
      slpCode, 
      itmsGrpCod, 
      itemCode, 
      cntctCode, 
      cardCode,
      ranges 
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

    // Parse ranges
    const parsedRanges = ranges ? JSON.parse(ranges) : [
      { id: 1, min: 0, max: 3 },
      { id: 2, min: 4, max: 5 },
      { id: 3, min: 6, max: 8 },
      { id: 4, min: 9, max: 10 },
      { id: 5, min: 10, max: null }
    ];

    // Create cache key
    const userIdentifier = isAdmin ? "admin" : contactCodes.length ? contactCodes.join("-") : cardCodes.join("-");
    const cacheKey = `chart-data:${userIdentifier}:${financialYear || "all"}:${slpCode || "all"}:${cardCode || "all"}:${cntctCode || "all"}:${itmsGrpCod || "all"}:${itemCode || "all"}:${JSON.stringify(parsedRanges)}`;

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

    // Financial year filter (April to March)
    if (financialYear) {
      const fyStart = `${financialYear}-04-01`;
      const fyEnd = `${parseInt(financialYear) + 1}-03-31`;
      whereClauses.push(`T0.DocDate BETWEEN @fyStart AND @fyEnd`);
      params.push(
        { name: "fyStart", type: sql.Date, value: fyStart },
        { name: "fyEnd", type: sql.Date, value: fyEnd }
      );
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

    // Add condition for valid dates
    whereClauses.push(`T0.DocDate IS NOT NULL`);
    whereClauses.push(`OINV.DocDate IS NOT NULL`);

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Build CASE statements for ranges
    const rangeCaseStatements = parsedRanges.map((range, index) => {
      if (range.max === null) {
        return `SUM(CASE WHEN DATEDIFF(DAY, T0.DocDate, OINV.DocDate) >= ${range.min} THEN 1 ELSE 0 END) AS Range_${index + 1}_Count`;
      } else {
        return `SUM(CASE WHEN DATEDIFF(DAY, T0.DocDate, OINV.DocDate) BETWEEN ${range.min} AND ${range.max} THEN 1 ELSE 0 END) AS Range_${index + 1}_Count`;
      }
    }).join(',\n        ');

    const query = `
      SELECT 
          YEAR(T0.DocDate) AS [Year],
          MONTH(T0.DocDate) AS [MonthNumber],
          DATENAME(MONTH, T0.DocDate) AS [MonthName],
          ${rangeCaseStatements}
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
      LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                    AND T1.LineNum = DLN1.BaseLine 
                    AND DLN1.BaseType = 17
      LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                    AND DLN1.LineNum = INV1.BaseLine 
                    AND INV1.BaseType = 15
      LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry 
                    AND OINV.CANCELED = 'N'
      ${whereSQL}
      GROUP BY YEAR(T0.DocDate), MONTH(T0.DocDate), DATENAME(MONTH, T0.DocDate)
      ORDER BY YEAR(T0.DocDate) ASC, MONTH(T0.DocDate) ASC;
    `;

    const results = await queryDatabase(query, params);

    // Transform results into the expected format
    const chartData = results.map(row => {
      const ranges = {};
      parsedRanges.forEach((range, index) => {
        const rangeLabel = range.max === null 
          ? `${range.min}+ Days` 
          : `${range.min}–${range.max} Days`;
        
        ranges[rangeLabel] = {
          count: row[`Range_${index + 1}_Count`] || 0,
          color: range.color || '#007bff',
          bgColor: range.bgColor || 'rgba(0, 123, 255, 0.7)'
        };
      });

      return {
        year: row.Year,
        monthNumber: row.MonthNumber,
        monthName: row.MonthName,
        ranges
      };
    });

    // Cache for 30 minutes
    await setCache(cacheKey, chartData, 1800);

    res.status(200).json(chartData);

  } catch (error) {
    console.error('Chart data API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}