// pages/api/daily-report/available-months.js
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
    const cacheKey = `daily-report-months:${userIdentifier}`;

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

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Query to get distinct year/month combinations
    const query = `
      SELECT DISTINCT
          YEAR(T0.DocDate) AS [Year],
          MONTH(T0.DocDate) AS [MonthNumber],
          DATENAME(MONTH, T0.DocDate) AS [MonthName]
      FROM ORDR T0
      ${whereSQL}
      ORDER BY YEAR(T0.DocDate) DESC, MONTH(T0.DocDate) DESC;
    `;

    const results = await queryDatabase(query);

    if (!results || results.length === 0) {
      // No data available, return current month
      const now = new Date();
      const currentMonth = [{
        year: now.getFullYear(),
        monthNumber: now.getMonth() + 1,
        monthName: now.toLocaleDateString('default', { month: 'long' })
      }];
      await setCache(cacheKey, currentMonth, 3600);
      return res.status(200).json(currentMonth);
    }

    const availableMonths = results.map(row => ({
      year: row.Year,
      monthNumber: row.MonthNumber,
      monthName: row.MonthName
    }));

    // Cache for 1 hour
    await setCache(cacheKey, availableMonths, 3600);

    res.status(200).json(availableMonths);

  } catch (error) {
    console.error('Available months API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}