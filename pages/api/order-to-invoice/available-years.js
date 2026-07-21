// pages/api/order-to-invoice/available-years.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from '../../../lib/db';
import { getCache, setCache } from "../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
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
    const cacheKey = `available-years:${userIdentifier}`;

    // Check cache
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    // Build WHERE clauses
    const whereClauses = ["T0.CANCELED = 'N'"];

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

    // Add condition for valid dates
    whereClauses.push(`T0.DocDate IS NOT NULL`);
    whereClauses.push(`OINV.DocDate IS NOT NULL`);

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Query to get min and max dates
    const query = `
      SELECT 
          MIN(T0.DocDate) AS MinDate,
          MAX(T0.DocDate) AS MaxDate
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                    AND T1.LineNum = DLN1.BaseLine 
                    AND DLN1.BaseType = 17
      LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                    AND DLN1.LineNum = INV1.BaseLine 
                    AND INV1.BaseType = 15
      LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry 
                    AND OINV.CANCELED = 'N'
      ${whereSQL}
    `;

    const results = await queryDatabase(query);

    if (!results || results.length === 0 || !results[0].MinDate || !results[0].MaxDate) {
      // No data available, return current year
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const defaultFY = currentMonth >= 4 ? currentYear : currentYear - 1;
      await setCache(cacheKey, [defaultFY], 3600); // Cache for 1 hour
      return res.status(200).json([defaultFY]);
    }

    const minDate = new Date(results[0].MinDate);
    const maxDate = new Date(results[0].MaxDate);

    // Calculate financial years
    // Financial year: April to March
    // If data starts in Aug 2024, it belongs to FY 2024 (Apr 2024 - Mar 2025)
    // If data ends in Sep 2025, it belongs to FY 2025 (Apr 2025 - Mar 2026)

    const minYear = minDate.getFullYear();
    const minMonth = minDate.getMonth() + 1; // 1-12
    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth() + 1; // 1-12

    // Determine starting financial year
    // If month is Jan-Mar, financial year is previous year
    // If month is Apr-Dec, financial year is current year
    const startFY = minMonth >= 4 ? minYear : minYear - 1;
    const endFY = maxMonth >= 4 ? maxYear : maxYear - 1;

    // Generate array of financial years
    const financialYears = [];
    for (let fy = startFY; fy <= endFY; fy++) {
      financialYears.push(fy);
    }

    // Cache for 1 hour (data range doesn't change frequently)
    await setCache(cacheKey, financialYears, 3600);

    res.status(200).json(financialYears);

  } catch (error) {
    console.error('Available years API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}