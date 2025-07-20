// // pages/api/monthly-open-partial-array.js
// import { queryDatabase } from '../../lib/db';

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   try {
//     const query = `
//       WITH OrderStatusCTE AS (
//         -- Determine the overall status of each order based on line item invoice status
//         SELECT 
//             T0.DocEntry,
//             T0.DocNum,
//             T0.DocDate,
//             T0.NumAtCard,
//             T0.CntctCode,
//             T0.CardCode,
//             T0.SlpCode,
//             CASE 
//                 -- All line items invoiced
//                 WHEN NOT EXISTS (
//                     SELECT 1
//                     FROM RDR1 T1
//                     LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
//                     LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
//                     LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
//                     WHERE T1.DocEntry = T0.DocEntry
//                         AND V.DocEntry IS NULL
//                 ) THEN 'Closed'

//                 -- Some line items invoiced, some not
//                 WHEN EXISTS (
//                     SELECT 1
//                     FROM RDR1 T1
//                     LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
//                     LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
//                     LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
//                     WHERE T1.DocEntry = T0.DocEntry
//                         AND V.DocEntry IS NOT NULL
//                 ) AND EXISTS (
//                     SELECT 1
//                     FROM RDR1 T1
//                     LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
//                     LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
//                     LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
//                     WHERE T1.DocEntry = T0.DocEntry
//                         AND V.DocEntry IS NULL
//                 ) THEN 'Partial'

//                 -- No line items invoiced
//                 ELSE 'Open'
//             END AS OrderStatus
//         FROM ORDR T0
//         WHERE T0.CANCELED = 'N'
//       )

//       SELECT 
//           YEAR(T0.DocDate) AS [Year],
//           DATENAME(MONTH, T0.DocDate) AS [Month],
//           MONTH(T0.DocDate) AS [MonthNumber],
//           T5.SlpName AS [Sales_Person],
//           T0.CardName AS [Customer],
//           T0.CardCode AS [Customer_Ref_No],
//           T6.Name AS [Contact_Person],
//           CTE.OrderStatus AS [Status_Header],
//           T0.DocNum AS [SO_No],
//           T0.DocDate AS [SO_Date],
//           CASE 
//               WHEN OINV.DocNum IS NULL THEN 'Open'
//               ELSE 'Closed'
//           END AS [Status_Line],
//           T1.ItemCode AS [Item_No],
//           T1.Dscription AS [Item_Service_Description],
//           ISNULL(T1.U_CasNo, T3.U_CasNo) AS [Cas_No],
//           ISNULL(T15.U_vendorbatchno, '') AS [Batch_No],
//           T3.SuppCatNum AS [Vendor_Catalog_No],
//           T1.UnitMsr AS [PKZ],
//           T1.U_mkt_feedback AS [MKT_Feedback],
//           T1.Price AS [Unit_Price],
//           T1.Quantity AS [Quantity],
//           T1.LineTotal AS [Total_Price],
//           T4.ItmsGrpNam AS [Category],
//           CASE 
//               WHEN OINV.DocNum IS NULL THEN 'N/A'
//               ELSE CAST(OINV.DocNum AS VARCHAR(20))
//           END AS [Invoice_No]
//       FROM ORDR T0
//       INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
//       INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//       INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
//       LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
//       LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
//       LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
//                      AND T1.LineNum = DLN1.BaseLine 
//                      AND DLN1.BaseType = 17
//       LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
//                      AND DLN1.LineNum = INV1.BaseLine 
//                      AND INV1.BaseType = 15
//       LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry 
//                      AND OINV.CANCELED = 'N'
//       LEFT JOIN IBT1 T4_batch ON T4_batch.BaseEntry = DLN1.DocEntry 
//                               AND T4_batch.BaseType = 15 
//                               AND T4_batch.BaseLinNum = DLN1.LineNum 
//                               AND T4_batch.ItemCode = T1.ItemCode
//       LEFT JOIN OIBT T15 ON T4_batch.ItemCode = T15.ItemCode 
//                          AND T4_batch.BatchNum = T15.BatchNum
//       INNER JOIN OrderStatusCTE CTE ON T0.DocEntry = CTE.DocEntry
//       WHERE T0.CANCELED = 'N'
//       ORDER BY T0.DocDate ASC, T0.DocNum DESC, T1.LineNum;
//     `;

//     const results = await queryDatabase(query);
    
//     // Return the plain array of objects
//     res.status(200).json(results || []);

//   } catch (error) {
//     console.error('Database error:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// }

// pages/api/monthly-open-partial-array.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from '../../lib/db';
import { getCache, setCache } from "../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { year, slpCode, itmsGrpCod, itemCode, cntctCode, cardCode } = req.query;
    const authHeader = req.headers.authorization;

    // Check for authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
        received: authHeader,
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    // Verify JWT token
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ error: "Token verification failed" });
    }

    // Extract user role and access codes
    const isAdmin = decoded.role === "admin";
    const contactCodes = decoded.contactCodes || [];
    const cardCodes = decoded.cardCodes || [];

    // Create cache key
    const userIdentifier = isAdmin
      ? "admin"
      : contactCodes.length
        ? contactCodes.join("-")
        : cardCodes.join("-");
    
    const cacheKey = `monthly-open-partial:${userIdentifier}:${year || "all"}:${
      slpCode || "all"
    }:${cardCode || "all"}:${cntctCode || "all"}:${itmsGrpCod || "all"}:${itemCode || "all"}`;

    // Check cache first
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    // Build WHERE clauses for authorization
    const whereClauses = ["T0.CANCELED = 'N'"];
    const params = [];

    // Apply role-based filtering
    if (!isAdmin) {
      if (contactCodes.length > 0) {
        whereClauses.push(
          `T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})`
        );
      } else if (cardCodes.length > 0) {
        whereClauses.push(
          `T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`
        );
      } else {
        return res.status(403).json({
          error: "No access: cardCodes or contactCodes not provided",
        });
      }
    }

    // Apply optional filters
    if (year) {
      whereClauses.push(`YEAR(T0.DocDate) = @year`);
      params.push({ name: "year", type: sql.Int, value: parseInt(year) });
    }

    if (slpCode) {
      whereClauses.push(`T0.SlpCode = @slpCode`);
      params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
    }

    if (cntctCode) {
      whereClauses.push(`T0.CntctCode = @cntctCode`);
      params.push({ name: "cntctCode", type: sql.Int, value: parseInt(cntctCode) });
    }

    if (itmsGrpCod) {
      whereClauses.push(`T4.ItmsGrpNam = @itmsGrpCod`);
      params.push({ name: "itmsGrpCod", type: sql.VarChar, value: itmsGrpCod });
    }

    if (cardCode) {
      whereClauses.push(`T0.CardCode = @cardCode`);
      params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
    }

    if (itemCode) {
      whereClauses.push(`T1.ItemCode = @itemCode`);
      params.push({ name: "itemCode", type: sql.VarChar, value: itemCode });
    }

    const whereSQL = whereClauses.length > 0 ? `AND ${whereClauses.join(" AND ")}` : "";

    const query = `
      WITH OrderStatusCTE AS (
        -- Determine the overall status of each order based on line item invoice status
        SELECT 
            T0.DocEntry,
            T0.DocNum,
            T0.DocDate,
            T0.NumAtCard,
            T0.CntctCode,
            T0.CardCode,
            T0.SlpCode,
            CASE 
                -- All line items invoiced
                WHEN NOT EXISTS (
                    SELECT 1
                    FROM RDR1 T1
                    LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
                    LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
                    LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
                    WHERE T1.DocEntry = T0.DocEntry
                        AND V.DocEntry IS NULL
                ) THEN 'Closed'

                -- Some line items invoiced, some not
                WHEN EXISTS (
                    SELECT 1
                    FROM RDR1 T1
                    LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
                    LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
                    LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
                    WHERE T1.DocEntry = T0.DocEntry
                        AND V.DocEntry IS NOT NULL
                ) AND EXISTS (
                    SELECT 1
                    FROM RDR1 T1
                    LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
                    LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
                    LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
                    WHERE T1.DocEntry = T0.DocEntry
                        AND V.DocEntry IS NULL
                ) THEN 'Partial'

                -- No line items invoiced
                ELSE 'Open'
            END AS OrderStatus
        FROM ORDR T0
        WHERE T0.CANCELED = 'N'
      )

      SELECT 
          YEAR(T0.DocDate) AS [Year],
          DATENAME(MONTH, T0.DocDate) AS [Month],
          MONTH(T0.DocDate) AS [MonthNumber],
          T5.SlpName AS [Sales_Person],
          T0.CardName AS [Customer],
          T0.CardCode AS [Customer_Ref_No],
          T6.Name AS [Contact_Person],
          CTE.OrderStatus AS [Status_Header],
          T0.DocNum AS [SO_No],
          T0.DocDate AS [SO_Date],
          CASE 
              WHEN OINV.DocNum IS NULL THEN 'Open'
              ELSE 'Closed'
          END AS [Status_Line],
          T1.ItemCode AS [Item_No],
          T1.Dscription AS [Item_Service_Description],
          ISNULL(T1.U_CasNo, T3.U_CasNo) AS [Cas_No],
          ISNULL(T15.U_vendorbatchno, '') AS [Batch_No],
          T3.SuppCatNum AS [Vendor_Catalog_No],
          T1.UnitMsr AS [PKZ],
          T1.U_mkt_feedback AS [MKT_Feedback],
          T1.Price AS [Unit_Price],
          T1.Quantity AS [Quantity],
          T1.LineTotal AS [Total_Price],
          T4.ItmsGrpNam AS [Category],
          CASE 
              WHEN OINV.DocNum IS NULL THEN 'N/A'
              ELSE CAST(OINV.DocNum AS VARCHAR(20))
          END AS [Invoice_No]
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
      LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                     AND T1.LineNum = DLN1.BaseLine 
                     AND DLN1.BaseType = 17
      LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                     AND DLN1.LineNum = INV1.BaseLine 
                     AND INV1.BaseType = 15
      LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry 
                     AND OINV.CANCELED = 'N'
      LEFT JOIN IBT1 T4_batch ON T4_batch.BaseEntry = DLN1.DocEntry 
                              AND T4_batch.BaseType = 15 
                              AND T4_batch.BaseLinNum = DLN1.LineNum 
                              AND T4_batch.ItemCode = T1.ItemCode
      LEFT JOIN OIBT T15 ON T4_batch.ItemCode = T15.ItemCode 
                         AND T4_batch.BatchNum = T15.BatchNum
      INNER JOIN OrderStatusCTE CTE ON T0.DocEntry = CTE.DocEntry
      WHERE T0.CANCELED = 'N'
      ${whereSQL}
      ORDER BY T0.DocDate ASC, T0.DocNum DESC, T1.LineNum;
    `;

    const results = await queryDatabase(query, params);
    
    // Cache the results for 30 minutes
    await setCache(cacheKey, results || [], 1800);
    
    // Return the plain array of objects
    res.status(200).json(results || []);

  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}