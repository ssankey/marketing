// // pages/api/open-partial/customers.js
// // Customer-wise open order value — all time, no FY filter
// import { verify } from "jsonwebtoken";
// import { queryDatabase } from "../../../lib/db";
// import { getCache, setCache } from "../../../lib/redis";

// const getMulti = (query, key) => {
//   const val = query[key];
//   if (!val) return [];
//   return Array.isArray(val) ? val : [val];
// };

// export default async function handler(req, res) {
//   if (req.method !== "GET")
//     return res.status(405).json({ error: "Method Not Allowed" });

//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith("Bearer "))
//       return res.status(401).json({ error: "Missing Authorization header" });

//     const token = authHeader.split(" ")[1];
//     let decoded;
//     try { decoded = verify(token, process.env.JWT_SECRET); }
//     catch { return res.status(401).json({ error: "Token verification failed" }); }

//     const isAdmin       = decoded.role === "admin";
//     const tokenContacts = decoded.contactCodes || [];
//     const tokenCards    = decoded.cardCodes    || [];

//     // filters (no FY — always all time)
//     const slpCodes    = getMulti(req.query, "slpCode");
//     const cntctCodes  = getMulti(req.query, "cntctCode");
//     const itmsGrpNams = getMulti(req.query, "itmsGrpNam");
//     const itemCodes   = getMulti(req.query, "itemCode");
//     const cardCodes   = getMulti(req.query, "cardCode");

//     // cache key
//     const uid = isAdmin ? "admin"
//       : tokenContacts.length ? tokenContacts.join("-")
//       : tokenCards.join("-");
//     const cacheKey = `op-customers:${uid}:${slpCodes.join(",")}:${cntctCodes.join(",")}:${itmsGrpNams.join(",")}:${itemCodes.join(",")}:${cardCodes.join(",")}`;

//     const cached = await getCache(cacheKey);
//     if (cached) return res.status(200).json(cached);

//     // WHERE
//     const where = ["T0.CANCELED = 'N'", "T0.DocStatus = 'O'"];

//     if (!isAdmin) {
//       if (tokenContacts.length)
//         where.push(`T0.SlpCode IN (${tokenContacts.map(c => `'${c}'`).join(",")})`);
//       else if (tokenCards.length)
//         where.push(`T0.CardCode IN (${tokenCards.map(c => `'${c}'`).join(",")})`);
//       else
//         return res.status(403).json({ error: "No access codes in token" });
//     }

//     if (isAdmin && slpCodes.length)
//       where.push(`T0.SlpCode IN (${slpCodes.map(c => `'${c}'`).join(",")})`);
//     if (cntctCodes.length)
//       where.push(`T0.CntctCode IN (${cntctCodes.map(c => `'${c}'`).join(",")})`);
//     if (itmsGrpNams.length)
//       where.push(`T4.ItmsGrpNam IN (${itmsGrpNams.map(n => `'${n.replace(/'/g, "''")}'`).join(",")})`);
//     if (itemCodes.length)
//       where.push(`T1.ItemCode IN (${itemCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(",")})`);
//     if (cardCodes.length)
//       where.push(`T0.CardCode IN (${cardCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(",")})`);

//     const W = `WHERE ${where.join(" AND ")}`;

//     const query = `
//       SELECT
//         T0.CardCode                                                        AS [CardCode],
//         MAX(T0.CardName)                                                   AS [Customer],
//         SUM(CASE WHEN T1.LineStatus = 'O' THEN T1.LineTotal ELSE 0 END)   AS [OpenValue],
//         SUM(CASE WHEN T1.LineStatus = 'O' THEN 1 ELSE 0 END)              AS [LineItems]
//       FROM ORDR T0
//       JOIN RDR1 T1  ON T0.DocEntry = T1.DocEntry
//       LEFT JOIN OITM T3 ON T1.ItemCode   = T3.ItemCode
//       LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
//       ${W}
//       GROUP BY T0.CardCode
//       HAVING SUM(CASE WHEN T1.LineStatus = 'O' THEN T1.LineTotal ELSE 0 END) > 0
//       ORDER BY OpenValue DESC;
//     `;

//     const results = await queryDatabase(query);
//     const data = (results || []).map(r => ({
//       cardCode:   r.CardCode  || "",
//       customer:   r.Customer  || r.CardCode || "Unknown",
//       openValue:  parseFloat(r.OpenValue)  || 0,
//       lineItems:  parseInt(r.LineItems)    || 0,
//     }));

//     await setCache(cacheKey, data, 1800);
//     return res.status(200).json(data);

//   } catch (err) {
//     console.error("[open-partial/customers] Error:", err.message);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// }

import { verify } from "jsonwebtoken";
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
    const tokenContacts = decoded.contactCodes || [];
    const tokenCards    = decoded.cardCodes    || [];

    const slpCodes    = getMulti(req.query, "slpCode");
    const cntctCodes  = getMulti(req.query, "cntctCode");
    const itmsGrpNams = getMulti(req.query, "itmsGrpNam");
    const itemCodes   = getMulti(req.query, "itemCode");
    const cardCodes   = getMulti(req.query, "cardCode");

    const uid = isAdmin ? "admin"
      : tokenContacts.length ? tokenContacts.join("-")
      : tokenCards.join("-");
    const cacheKey = `op-customers:${uid}:${slpCodes.join(",")}:${cntctCodes.join(",")}:${itmsGrpNams.join(",")}:${itemCodes.join(",")}:${cardCodes.join(",")}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const where = ["T0.CANCELED = 'N'", "T0.DocStatus = 'O'", "T1.LineStatus = 'O'"];

    if (!isAdmin) {
      if (tokenContacts.length)
        where.push(`T0.SlpCode IN (${tokenContacts.map(c => `'${c}'`).join(",")})`);
      else if (tokenCards.length)
        where.push(`T0.CardCode IN (${tokenCards.map(c => `'${c}'`).join(",")})`);
      else
        return res.status(403).json({ error: "No access codes in token" });
    }

    if (isAdmin && slpCodes.length)
      where.push(`T0.SlpCode IN (${slpCodes.map(c => `'${c}'`).join(",")})`);
    if (cntctCodes.length)
      where.push(`T0.CntctCode IN (${cntctCodes.map(c => `'${c}'`).join(",")})`);
    if (cardCodes.length)
      where.push(`T0.CardCode IN (${cardCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(",")})`);

    // Category/product — EXISTS to avoid row multiplication
    if (itmsGrpNams.length) {
      where.push(`EXISTS (
        SELECT 1 FROM RDR1 r1
        JOIN OITM m1 ON r1.ItemCode = m1.ItemCode
        JOIN OITB b1 ON m1.ItmsGrpCod = b1.ItmsGrpCod
        WHERE r1.DocEntry = T0.DocEntry
        AND b1.ItmsGrpNam IN (${itmsGrpNams.map(n => `'${n.replace(/'/g, "''")}'`).join(",")})
      )`);
    }
    if (itemCodes.length) {
      where.push(`EXISTS (
        SELECT 1 FROM RDR1 r1
        WHERE r1.DocEntry = T0.DocEntry
        AND r1.ItemCode IN (${itemCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(",")})
      )`);
    }

    const W = `WHERE ${where.join(" AND ")}`;

    const query = `
      SELECT
        T0.CardCode                                          AS [CardCode],
        MAX(T0.CardName)                                     AS [Customer],
        SUM(T1.OpenQty * T1.Price * T0.DocRate)              AS [OpenValue],
        COUNT(*)                                             AS [LineItems]
      FROM ORDR T0
      JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      ${W}
      GROUP BY T0.CardCode
      HAVING SUM(T1.OpenQty * T1.Price * T0.DocRate) > 0
      ORDER BY OpenValue DESC;
    `;

    const results = await queryDatabase(query);
    const data = (results || []).map(r => ({
      cardCode:  r.CardCode || "",
      customer:  r.Customer || r.CardCode || "Unknown",
      openValue: parseFloat(r.OpenValue) || 0,
      lineItems: parseInt(r.LineItems)   || 0,
    }));

    await setCache(cacheKey, data, 1800);
    return res.status(200).json(data);

  } catch (err) {
    console.error("[open-partial/customers] Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}