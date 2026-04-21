import { verify } from "jsonwebtoken";
import { queryDatabase } from '../../../lib/db';
import { getCache, setCache } from "../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
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
    const cacheKey = `daily-invoice-months:${userIdentifier}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const whereClauses = ["T0.CANCELED = 'N'", "T0.[IssReason] <> '4'"];

    if (!isAdmin) {
      if (contactCodes.length > 0)
        whereClauses.push(`T0.SlpCode IN (${contactCodes.map(c => `'${c}'`).join(",")})`);
      else if (cardCodes.length > 0)
        whereClauses.push(`T0.CardCode IN (${cardCodes.map(c => `'${c}'`).join(",")})`);
      else
        return res.status(403).json({ error: "No access" });
    }

    const query = `
      SELECT DISTINCT
        YEAR(T0.DocDate)             AS [Year],
        MONTH(T0.DocDate)            AS [MonthNumber],
        DATENAME(MONTH, T0.DocDate)  AS [MonthName]
      FROM OINV T0
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY YEAR(T0.DocDate) DESC, MONTH(T0.DocDate) DESC;
    `;

    const results = await queryDatabase(query);

    if (!results?.length) {
      const now = new Date();
      const fallback = [{ year: now.getFullYear(), monthNumber: now.getMonth() + 1, monthName: now.toLocaleDateString('default', { month: 'long' }) }];
      await setCache(cacheKey, fallback, 3600);
      return res.status(200).json(fallback);
    }

    const availableMonths = results.map(r => ({ year: r.Year, monthNumber: r.MonthNumber, monthName: r.MonthName }));
    await setCache(cacheKey, availableMonths, 3600);
    res.status(200).json(availableMonths);

  } catch (error) {
    console.error('Daily invoice available-months error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}