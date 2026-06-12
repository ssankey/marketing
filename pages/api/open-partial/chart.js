// pages/api/open-partial/chart.js
// Returns aggregated monthly data only — tiny payload for the chart
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";
import { getCache, setCache } from "../../../lib/redis";

const getMulti = (query, key) => {
  const val = query[key];
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "Missing Authorization header" });

    const token = authHeader.split(" ")[1];
    let decoded;
    try { decoded = verify(token, process.env.JWT_SECRET); }
    catch { return res.status(401).json({ error: "Token verification failed" }); }

    const isAdmin       = decoded.role === "admin";
    const isSales       = decoded.role === "sales_person";
    const tokenContacts = decoded.contactCodes || [];
    const tokenCards    = decoded.cardCodes    || [];

    // ── fyOnly mode: just return available FY list, skip heavy query ──
    if (req.query.fyOnly === "true") {
      const fyQuery = `
        SELECT DISTINCT YEAR(DocDate) AS yr
        FROM ORDR WHERE CANCELED = 'N' AND DocStatus = 'O'
        ORDER BY yr DESC;
      `;
      const fyRows     = await queryDatabase(fyQuery);
      const calYears   = fyRows.map(r => r.yr);
      const fySet      = new Set();
      calYears.forEach(y => { fySet.add(`${y-1}-${y}`); fySet.add(`${y}-${y+1}`); });
      const now        = new Date();
      const curFYStart = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
      fySet.add(`${curFYStart}-${curFYStart+1}`);
      const availableFYs = Array.from(fySet).sort((a,b) => parseInt(b) - parseInt(a));
      return res.status(200).json({ data: [], availableFYs });
    }

    // ── filters from query ──────────────────────────────────
    const fy          = req.query.fy || "";          // e.g. "2025-2026"
    const slpCodes    = getMulti(req.query, "slpCode");
    const cntctCodes  = getMulti(req.query, "cntctCode");
    const itmsGrpNams = getMulti(req.query, "itmsGrpNam");
    const itemCodes   = getMulti(req.query, "itemCode");
    const cardCodes   = getMulti(req.query, "cardCode");

    // ── cache key ───────────────────────────────────────────
    const uid = isAdmin ? "admin"
      : tokenContacts.length ? tokenContacts.join("-")
      : tokenCards.join("-");
    const cacheKey = `op-chart:${uid}:${fy}:${slpCodes.join(",")}:${cntctCodes.join(",")}:${itmsGrpNams.join(",")}:${itemCodes.join(",")}:${cardCodes.join(",")}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    // ── build WHERE ─────────────────────────────────────────
    const where = ["T0.CANCELED = 'N'", "T0.DocStatus = 'O'"];
    const params = [];

    if (!isAdmin) {
      if (tokenContacts.length)
        where.push(`T0.SlpCode IN (${tokenContacts.map(c => `'${c}'`).join(",")})`);
      else if (tokenCards.length)
        where.push(`T0.CardCode IN (${tokenCards.map(c => `'${c}'`).join(",")})`);
      else
        return res.status(403).json({ error: "No access codes in token" });
    }

    // FY date range filter
    if (fy) {
      const [sy, ey] = fy.split("-").map(Number);
      where.push(`(
        (YEAR(T0.DocDate) = ${sy} AND MONTH(T0.DocDate) >= 4) OR
        (YEAR(T0.DocDate) = ${ey} AND MONTH(T0.DocDate) <= 3)
      )`);
    }

    if (isAdmin && slpCodes.length)
      where.push(`T0.SlpCode IN (${slpCodes.map(c=>`'${c}'`).join(",")})`);
    if (cntctCodes.length)
      where.push(`T0.CntctCode IN (${cntctCodes.map(c=>`'${c}'`).join(",")})`);
    if (itmsGrpNams.length)
      where.push(`T4.ItmsGrpNam IN (${itmsGrpNams.map(n=>`'${n.replace(/'/g,"''")}'`).join(",")})`);
    if (itemCodes.length)
      where.push(`T1.ItemCode IN (${itemCodes.map(c=>`'${c.replace(/'/g,"''")}'`).join(",")})`);
    if (cardCodes.length)
      where.push(`T0.CardCode IN (${cardCodes.map(c=>`'${c.replace(/'/g,"''")}'`).join(",")})`);

    const W = `WHERE ${where.join(" AND ")}`;

    // ── aggregation query (CTE avoids subquery-in-GROUP-BY error) ────────
    const query = `
      WITH HeaderStatus AS (
        SELECT
          T0.DocEntry,
          T0.DocNum,
          T0.DocDate,
          CASE
            WHEN SUM(CASE WHEN T1.LineStatus = 'C' THEN 1 ELSE 0 END) > 0
             AND SUM(CASE WHEN T1.LineStatus = 'O' THEN 1 ELSE 0 END) > 0
            THEN 'Partial'
            ELSE 'Open'
          END AS HeaderStatus,
          SUM(CASE WHEN T1.LineStatus = 'O' THEN T1.LineTotal ELSE 0 END) AS OpenValue,
          COUNT(*) AS LineCount
        FROM ORDR T0
        JOIN RDR1 T1  ON T0.DocEntry = T1.DocEntry
        LEFT JOIN OITM T3 ON T1.ItemCode  = T3.ItemCode
        LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        ${W}
        GROUP BY T0.DocEntry, T0.DocNum, T0.DocDate
      )
      SELECT
        YEAR(DocDate)            AS [Year],
        MONTH(DocDate)           AS [MonthNumber],
        DATENAME(MONTH, DocDate) AS [MonthName],
        HeaderStatus,
        COUNT(DISTINCT DocNum)   AS [OrderCount],
        SUM(LineCount)           AS [LineCount],
        SUM(OpenValue)           AS [OpenValue]
      FROM HeaderStatus
      GROUP BY
        YEAR(DocDate), MONTH(DocDate),
        DATENAME(MONTH, DocDate),
        HeaderStatus
      ORDER BY YEAR(DocDate), MONTH(DocDate);
    `;


    const results = await queryDatabase(query, params);

    // ── available FYs query ──────────────────────────────────
    const fyQuery = `
      SELECT DISTINCT YEAR(DocDate) AS yr
      FROM ORDR WHERE CANCELED = 'N' AND DocStatus = 'O'
      ORDER BY yr DESC;
    `;
    const fyRows = await queryDatabase(fyQuery);
    const calYears = fyRows.map(r => r.yr);

    // build FY list
    const fySet = new Set();
    calYears.forEach(y => { fySet.add(`${y-1}-${y}`); fySet.add(`${y}-${y+1}`); });
    const now = new Date();
    const curFYStart = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
    fySet.add(`${curFYStart}-${curFYStart+1}`);
    const availableFYs = Array.from(fySet).sort((a,b) => parseInt(b) - parseInt(a));

    const response = { data: results, availableFYs };
    await setCache(cacheKey, response, 1800);
    return res.status(200).json(response);

  } catch (err) {
    console.error("[open-partial/chart] Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}