// // pages/api/open-partial/export.js
// // Full flat export — same as old monthly-open-partial-array but only on demand
// import { verify } from "jsonwebtoken";
// import sql from "mssql";
// import { queryDatabase } from "../../../lib/db";

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

//     const fy          = req.query.fy || "";
//     const slpCodes    = getMulti(req.query, "slpCode");
//     const cntctCodes  = getMulti(req.query, "cntctCode");
//     const itmsGrpNams = getMulti(req.query, "itmsGrpNam");
//     const itemCodes   = getMulti(req.query, "itemCode");
//     const cardCodes   = getMulti(req.query, "cardCode");

//     const where = ["T0.CANCELED = 'N'", "T0.DocStatus = 'O'"];
//     const params = [];

//     if (!isAdmin) {
//       if (tokenContacts.length)
//         where.push(`T0.SlpCode IN (${tokenContacts.map(c=>`'${c}'`).join(",")})`);
//       else if (tokenCards.length)
//         where.push(`T0.CardCode IN (${tokenCards.map(c=>`'${c}'`).join(",")})`);
//       else
//         return res.status(403).json({ error: "No access codes in token" });
//     }

//     if (fy) {
//       const [sy, ey] = fy.split("-").map(Number);
//       where.push(`(
//         (YEAR(T0.DocDate) = ${sy} AND MONTH(T0.DocDate) >= 4) OR
//         (YEAR(T0.DocDate) = ${ey} AND MONTH(T0.DocDate) <= 3)
//       )`);
//     }

//     if (isAdmin && slpCodes.length)
//       where.push(`T0.SlpCode IN (${slpCodes.map(c=>`'${c}'`).join(",")})`);
//     if (cntctCodes.length)
//       where.push(`T0.CntctCode IN (${cntctCodes.map(c=>`'${c}'`).join(",")})`);
//     if (itmsGrpNams.length)
//       where.push(`T4.ItmsGrpNam IN (${itmsGrpNams.map(n=>`'${n.replace(/'/g,"''")}'`).join(",")})`);
//     if (itemCodes.length)
//       where.push(`T1.ItemCode IN (${itemCodes.map(c=>`'${c.replace(/'/g,"''")}'`).join(",")})`);
//     if (cardCodes.length)
//       where.push(`T0.CardCode IN (${cardCodes.map(c=>`'${c.replace(/'/g,"''")}'`).join(",")})`);

//     const W = `WHERE ${where.join(" AND ")}`;

//     const query = `
//       SELECT
//         YEAR(T0.DocDate)  AS [Year],
//         DATENAME(MONTH, T0.DocDate) AS [Month],
//         T5.SlpName        AS [Sales_Person],
//         T0.CardName       AS [Customer],
//         T0.CardCode       AS [CardCode],
//         T0.NumAtCard      AS [CustomerRefNo],
//         T6.Name           AS [Contact_Person],
//         CASE
//           WHEN EXISTS (SELECT 1 FROM RDR1 r WHERE r.DocEntry=T0.DocEntry AND r.LineStatus='O')
//            AND EXISTS (SELECT 1 FROM RDR1 r WHERE r.DocEntry=T0.DocEntry AND r.LineStatus='C')
//           THEN 'Partial' ELSE 'Open'
//         END AS [Status_Header],
//         T0.DocNum         AS [SO_No],
//         T0.DocDate        AS [SO_Date],
//         T1.ItemCode       AS [ItemCode],
//         T3.SuppCatNum     AS [Vendor_Catalog_No],
//         T1.UnitMsr        AS [PKZ],
//         T1.Dscription     AS [Item_Service_Description],
//         ISNULL(T1.U_CasNo, T3.U_CasNo) AS [Cas_No],
//         ROUND(T1.OpenQty,2)  AS [Open_Qty],
//         T1.DelivrdQty        AS [Delivered_Quantity],
//         CASE WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock' ELSE 'Out of Stock' END AS [Stock_Status],
//         T1.ShipDate          AS [Delivery_Date],
//         T1.U_timeline        AS [Timeline],
//         T1.Quantity          AS [Quantity],
//         T1.Price             AS [Unit_Price],
//         T1.LineTotal         AS [Total_Price],
//         T4.ItmsGrpNam        AS [Category],
//         T1.U_mkt_feedback    AS [MKT_Feedback]
//       FROM ORDR T0
//       JOIN RDR1 T1  ON T0.DocEntry = T1.DocEntry
//       JOIN OSLP T5  ON T0.SlpCode  = T5.SlpCode
//       LEFT JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
//       LEFT JOIN OITM T3 ON T1.ItemCode  = T3.ItemCode
//       LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
//       ${W}
//       AND T1.LineStatus = 'O'
//       ORDER BY T0.DocDate ASC, T0.DocNum, T1.LineNum;
//     `;

//     const results = await queryDatabase(query, params);
//     return res.status(200).json(results || []);

//   } catch (err) {
//     console.error("[open-partial/export] Error:", err.message);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// }


import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

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

    const fy          = req.query.fy || "";
    const slpCodes    = getMulti(req.query, "slpCode");
    const cntctCodes  = getMulti(req.query, "cntctCode");
    const itmsGrpNams = getMulti(req.query, "itmsGrpNam");
    const itemCodes   = getMulti(req.query, "itemCode");
    const cardCodes   = getMulti(req.query, "cardCode");

    const where = ["T0.CANCELED = 'N'", "T0.DocStatus = 'O'"];

    if (!isAdmin) {
      if (tokenContacts.length)
        where.push(`T0.SlpCode IN (${tokenContacts.map(c=>`'${c}'`).join(",")})`);
      else if (tokenCards.length)
        where.push(`T0.CardCode IN (${tokenCards.map(c=>`'${c}'`).join(",")})`);
      else
        return res.status(403).json({ error: "No access codes in token" });
    }

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
    if (cardCodes.length)
      where.push(`T0.CardCode IN (${cardCodes.map(c=>`'${c.replace(/'/g,"''")}'`).join(",")})`);

    // Category/product — EXISTS to avoid row multiplication
    if (itmsGrpNams.length) {
      where.push(`EXISTS (
        SELECT 1 FROM RDR1 r1
        JOIN OITM m1 ON r1.ItemCode = m1.ItemCode
        JOIN OITB b1 ON m1.ItmsGrpCod = b1.ItmsGrpCod
        WHERE r1.DocEntry = T0.DocEntry
        AND b1.ItmsGrpNam IN (${itmsGrpNams.map(n=>`'${n.replace(/'/g,"''")}'`).join(",")})
      )`);
    }
    if (itemCodes.length) {
      where.push(`EXISTS (
        SELECT 1 FROM RDR1 r1
        WHERE r1.DocEntry = T0.DocEntry
        AND r1.ItemCode IN (${itemCodes.map(c=>`'${c.replace(/'/g,"''")}'`).join(",")})
      )`);
    }

    const W = `WHERE ${where.join(" AND ")}`;

    const query = `
      SELECT
        YEAR(T0.DocDate)                                 AS [Year],
        DATENAME(MONTH, T0.DocDate)                      AS [Month],
        T5.SlpName                                       AS [Sales_Person],
        T0.CardName                                      AS [Customer],
        T0.CardCode                                      AS [CardCode],
        T0.NumAtCard                                     AS [CustomerRefNo],
        T6.Name                                          AS [Contact_Person],
        CASE
          WHEN EXISTS (SELECT 1 FROM RDR1 r WHERE r.DocEntry=T0.DocEntry AND r.LineStatus='O')
           AND EXISTS (SELECT 1 FROM RDR1 r WHERE r.DocEntry=T0.DocEntry AND r.LineStatus='C')
          THEN 'Partial' ELSE 'Open'
        END                                              AS [Status_Header],
        T0.DocNum                                        AS [SO_No],
        T0.DocDate                                       AS [SO_Date],
        T1.ItemCode                                      AS [ItemCode],
        T3.SuppCatNum                                    AS [Vendor_Catalog_No],
        T1.UnitMsr                                       AS [PKZ],
        T1.Dscription                                    AS [Item_Service_Description],
        ISNULL(T1.U_CasNo, T3.U_CasNo)                  AS [Cas_No],
        
        CASE WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock' ELSE 'Out of Stock' END AS [Stock_Status],
        T1.ShipDate                                      AS [Delivery_Date],
        T1.U_timeline                                    AS [Timeline],
        T4.ItmsGrpNam                                    AS [Category],
        T1.U_mkt_feedback                                AS [MKT_Feedback],
        -- ── Currency block ──
        T0.DocCur                                        AS [Currency],
        T1.Price                                         AS [Unit_Price],
        T0.DocRate                                       AS [Conversion_Rate],
        ROUND(T1.Price * T0.DocRate, 2)                  AS [Unit_Price_INR],
        ROUND(T1.OpenQty, 2)                             AS [Open_Qty],
        ROUND(T1.OpenQty * T1.Price * T0.DocRate, 2)     AS [Open_Amount_INR],
        ROUND(T1.DelivrdQty, 2)                          AS [Delivered_Qty],
        T1.Quantity                                      AS [Quantity],
        ROUND(T1.Quantity * T1.Price, 2)                 AS [Line_Total_Currency],
        T1.LineTotal                                     AS [Line_Total_INR]
      FROM ORDR T0
      JOIN RDR1 T1   ON T0.DocEntry = T1.DocEntry AND T1.LineStatus = 'O'
      JOIN OSLP T5   ON T0.SlpCode  = T5.SlpCode
      LEFT JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
      LEFT JOIN OITM T3 ON T1.ItemCode  = T3.ItemCode
      LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      ${W}
      ORDER BY T0.DocDate ASC, T0.DocNum, T1.LineNum;
    `;

    const results = await queryDatabase(query, []);
    return res.status(200).json(results || []);

  } catch (err) {
    console.error("[open-partial/export] Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}