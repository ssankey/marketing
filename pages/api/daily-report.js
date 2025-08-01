// // // pages/api/daily-report.js
// // import { verify } from "jsonwebtoken";
// // import sql from "mssql";
// // import { queryDatabase } from '../../lib/db';
// // import { getCache, setCache } from "../../lib/redis";

// // export default async function handler(req, res) {
// //   if (req.method !== 'GET') {
// //     return res.status(405).json({ error: 'Method Not Allowed' });
// //   }

// //   try {
// //     const { year, month, slpCode, itmsGrpCod, itemCode, cntctCode, cardCode } = req.query;
// //     const authHeader = req.headers.authorization;

// //     // Check for authorization header
// //     if (!authHeader || !authHeader.startsWith("Bearer ")) {
// //       return res.status(401).json({
// //         error: "Missing or malformed Authorization header",
// //         received: authHeader,
// //       });
// //     }

// //     const token = authHeader.split(" ")[1];
// //     let decoded;

// //     // Verify JWT token
// //     try {
// //       decoded = verify(token, process.env.JWT_SECRET);
// //     } catch (verifyError) {
// //       console.error("Token verification failed:", verifyError);
// //       return res.status(401).json({ error: "Token verification failed" });
// //     }

// //     // Extract user role and access codes
// //     const isAdmin = decoded.role === "admin";
// //     const contactCodes = decoded.contactCodes || [];
// //     const cardCodes = decoded.cardCodes || [];

// //     // Create cache key
// //     const userIdentifier = isAdmin
// //       ? "admin"
// //       : contactCodes.length
// //         ? contactCodes.join("-")
// //         : cardCodes.join("-");
    
// //     const cacheKey = `daily-report:${userIdentifier}:${year || "all"}:${month || "all"}:${
// //       slpCode || "all"
// //     }:${cardCode || "all"}:${cntctCode || "all"}:${itmsGrpCod || "all"}:${itemCode || "all"}`;

// //     // Check cache first
// //     const cachedResult = await getCache(cacheKey);
// //     if (cachedResult) {
// //       return res.status(200).json(cachedResult);
// //     }

// //     // Build WHERE clauses for authorization
// //     const whereClauses = ["T0.CANCELED = 'N'"];
// //     const params = [];

// //     // Apply role-based filtering
// //     if (!isAdmin) {
// //       if (contactCodes.length > 0) {
// //         whereClauses.push(
// //           `T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})`
// //         );
// //       } else if (cardCodes.length > 0) {
// //         whereClauses.push(
// //           `T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`
// //         );
// //       } else {
// //         return res.status(403).json({
// //           error: "No access: cardCodes or contactCodes not provided",
// //         });
// //       }
// //     }

// //     // Apply optional filters
// //     if (year) {
// //       whereClauses.push(`YEAR(T0.DocDate) = @year`);
// //       params.push({ name: "year", type: sql.Int, value: parseInt(year) });
// //     }

// //     if (month) {
// //       whereClauses.push(`MONTH(T0.DocDate) = @month`);
// //       params.push({ name: "month", type: sql.Int, value: parseInt(month) });
// //     }

// //     if (slpCode) {
// //       whereClauses.push(`T0.SlpCode = @slpCode`);
// //       params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
// //     }

// //     if (cntctCode) {
// //       whereClauses.push(`T0.CntctCode = @cntctCode`);
// //       params.push({ name: "cntctCode", type: sql.Int, value: parseInt(cntctCode) });
// //     }

// //     if (itmsGrpCod) {
// //       whereClauses.push(`T3.ItmsGrpCod = @itmsGrpCod`);
// //       params.push({ name: "itmsGrpCod", type: sql.Int, value: parseInt(itmsGrpCod) });
// //     }

// //     if (cardCode) {
// //       whereClauses.push(`T0.CardCode = @cardCode`);
// //       params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
// //     }

// //     if (itemCode) {
// //       whereClauses.push(`T1.ItemCode = @itemCode`);
// //       params.push({ name: "itemCode", type: sql.VarChar, value: itemCode });
// //     }

// //     const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

// //     const query = `
// //       SELECT 
// //           YEAR(T0.DocDate) AS [Year],
// //           MONTH(T0.DocDate) AS [MonthNumber],
// //           DAY(T0.DocDate) AS [Day],
// //           DATENAME(MONTH, T0.DocDate) AS [Month],
// //           T0.DocNum AS [SO_No],
// //           T0.DocDate AS [SO_Date],
// //           T0.CardName AS [Customer],
// //           T0.CardCode AS [CardCode],
// //           T5.SlpName AS [Sales_Person],
// //           T6.Name AS [Contact_Person],
// //           T1.LineTotal AS [Total_Price],
// //           T4.ItmsGrpNam AS [Category],
// //           T1.ItemCode AS [Item_No],
// //           T1.Dscription AS [Item_Description]
// //       FROM ORDR T0
// //       INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
// //       INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
// //       INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
// //       LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
// //       LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
// //       ${whereSQL}
// //       ORDER BY T0.DocDate ASC;
// //     `;

// //     const results = await queryDatabase(query, params);
    
// //     // Cache the results for 30 minutes
// //     await setCache(cacheKey, results || [], 1800);
    
// //     // Return the plain array of objects
// //     res.status(200).json(results || []);

// //   } catch (error) {
// //     console.error('API handler error:', error);
// //     res.status(500).json({ 
// //       error: 'Internal Server Error',
// //       details: process.env.NODE_ENV === "development" ? error.message : undefined,
// //     });
// //   }
// // }


// // pages/api/daily-report.js
// import { verify } from "jsonwebtoken";
// import sql from "mssql";
// import { queryDatabase } from '../../lib/db';
// import { getCache, setCache } from "../../lib/redis";

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   try {
//     const { year, month, slpCode, itmsGrpCod, itemCode, cntctCode, cardCode } = req.query;
//     const authHeader = req.headers.authorization;

//     // Check for authorization header
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         error: "Missing or malformed Authorization header",
//         received: authHeader,
//       });
//     }

//     const token = authHeader.split(" ")[1];
//     let decoded;

//     // Verify JWT token
//     try {
//       decoded = verify(token, process.env.JWT_SECRET);
//     } catch (verifyError) {
//       console.error("Token verification failed:", verifyError);
//       return res.status(401).json({ error: "Token verification failed" });
//     }

//     // Extract user role and access codes
//     const isAdmin = decoded.role === "admin";
//     const contactCodes = decoded.contactCodes || [];
//     const cardCodes = decoded.cardCodes || [];

//     // Create cache key
//     const userIdentifier = isAdmin
//       ? "admin"
//       : contactCodes.length
//         ? contactCodes.join("-")
//         : cardCodes.join("-");
    
//     const cacheKey = `daily-report:${userIdentifier}:${year || "all"}:${month || "all"}:${
//       slpCode || "all"
//     }:${cardCode || "all"}:${cntctCode || "all"}:${itmsGrpCod || "all"}:${itemCode || "all"}`;

//     // Check cache first
//     const cachedResult = await getCache(cacheKey);
//     if (cachedResult) {
//       return res.status(200).json(cachedResult);
//     }

//     // Build WHERE clauses for authorization
//     const whereClauses = ["T0.CANCELED = 'N'"];
//     const params = [];

//     // Apply role-based filtering
//     if (!isAdmin) {
//       if (contactCodes.length > 0) {
//         whereClauses.push(
//           `T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})`
//         );
//       } else if (cardCodes.length > 0) {
//         whereClauses.push(
//           `T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`
//         );
//       } else {
//         return res.status(403).json({
//           error: "No access: cardCodes or contactCodes not provided",
//         });
//       }
//     }

//     // Apply optional filters
//     if (year) {
//       whereClauses.push(`YEAR(T0.DocDate) = @year`);
//       params.push({ name: "year", type: sql.Int, value: parseInt(year) });
//     }

//     if (month) {
//       whereClauses.push(`MONTH(T0.DocDate) = @month`);
//       params.push({ name: "month", type: sql.Int, value: parseInt(month) });
//     }

//     if (slpCode) {
//       whereClauses.push(`T0.SlpCode = @slpCode`);
//       params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
//     }

//     if (cntctCode) {
//       whereClauses.push(`T0.CntctCode = @cntctCode`);
//       params.push({ name: "cntctCode", type: sql.Int, value: parseInt(cntctCode) });
//     }

//     if (itmsGrpCod) {
//       whereClauses.push(`T3.ItmsGrpCod = @itmsGrpCod`);
//       params.push({ name: "itmsGrpCod", type: sql.Int, value: parseInt(itmsGrpCod) });
//     }

//     if (cardCode) {
//       whereClauses.push(`T0.CardCode = @cardCode`);
//       params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
//     }

//     if (itemCode) {
//       whereClauses.push(`T1.ItemCode = @itemCode`);
//       params.push({ name: "itemCode", type: sql.VarChar, value: itemCode });
//     }

//     const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

//     const query = `
//       SELECT 
//           YEAR(T0.DocDate) AS [Year],
//           MONTH(T0.DocDate) AS [MonthNumber],
//           DAY(T0.DocDate) AS [Day],
//           DATENAME(MONTH, T0.DocDate) AS [Month],
//           T5.SlpName AS [Sales_Person],
//           T0.CardName AS [Customer],
//           T0.CardCode AS [CardCode],
//           T0.NumAtCard AS [CustomerRefNo],
//           T6.Name AS [Contact_Person],
//           CASE 
//               WHEN T0.DocStatus = 'O' AND 
//                    EXISTS (SELECT 1 FROM RDR1 WHERE DocEntry = T0.DocEntry AND LineStatus = 'O') AND
//                    EXISTS (SELECT 1 FROM RDR1 WHERE DocEntry = T0.DocEntry AND LineStatus = 'C')
//               THEN 'Partial'
//               WHEN T0.DocStatus = 'O' THEN 'Open'
//               WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
//               WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'Cancelled'
//               ELSE 'NA'
//           END AS [Status_Header],
//           T0.DocNum AS [SO_No],
//           T0.DocDate AS [SO_Date],
//           CASE 
//               WHEN T1.LineStatus = 'O' THEN 'Open'
//               WHEN T1.LineStatus = 'C' THEN 'Closed'
//               ELSE 'NA'
//           END AS [Status_Line],
//           T1.ItemCode AS [Item_No],
//           T3.SuppCatNum AS [Vendor_Catalog_No],
//           T1.UnitMsr AS [PKZ],
//           T1.Dscription AS [Item_Service_Description],
//           ISNULL(T1.U_CasNo, T3.U_CasNo) AS [Cas_No],
//           ISNULL(T15.U_vendorbatchno, '') AS [Batch_No],
//           ROUND(T1.OpenQty, 2) AS [Open Qty],
//           T1.DelivrdQty AS [Delivered Quantity],
//           CASE 
//               WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
//               ELSE 'Out of Stock'
//           END AS [Stock Status-In hyd],
//           T1.ShipDate AS [Delivery Date],
//           T1.U_timeline AS [Timeline],
//           T1.Quantity AS [Quantity],
//           T1.Price AS [Unit_Price],
//           T1.LineTotal AS [Total_Price],
//           T4.ItmsGrpNam AS [Category],
//           CASE 
//               WHEN OINV.DocNum IS NULL THEN 'N/A'
//               ELSE CAST(OINV.DocNum AS VARCHAR(20))
//           END AS [Invoice_No],
//           T1.U_mkt_feedback AS [MKT_Feedback]
//       FROM ORDR T0
//       INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
//       INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//       INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
//       LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
//       LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
//       LEFT JOIN OLCT T2 ON T1.LocCode = T2.Code
//       LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
//                     AND T1.LineNum = DLN1.BaseLine 
//                     AND DLN1.BaseType = 17
//       LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
//                     AND DLN1.LineNum = INV1.BaseLine 
//                     AND INV1.BaseType = 15
//       LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry 
//                     AND OINV.CANCELED = 'N'
//       LEFT JOIN IBT1 T4_batch ON T4_batch.BaseEntry = DLN1.DocEntry 
//                              AND T4_batch.BaseType = 15 
//                              AND T4_batch.BaseLinNum = DLN1.LineNum 
//                              AND T4_batch.ItemCode = T1.ItemCode
//       LEFT JOIN OIBT T15 ON T4_batch.ItemCode = T15.ItemCode 
//                          AND T4_batch.BatchNum = T15.BatchNum
//       ${whereSQL}
//       ORDER BY T0.DocDate ASC, T0.DocNum DESC, T1.LineNum;
//     `;

//     const results = await queryDatabase(query, params);
    
//     // Cache the results for 30 minutes
//     await setCache(cacheKey, results || [], 1800);
    
//     // Return the plain array of objects
//     res.status(200).json(results || []);

//   } catch (error) {
//     console.error('API handler error:', error);
//     res.status(500).json({ 
//       error: 'Internal Server Error',
//       details: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// }

// pages/api/daily-report.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from '../../lib/db';
import { getCache, setCache } from "../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { year, month, slpCode, itmsGrpCod, itemCode, cntctCode, cardCode } = req.query;
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
    
    const cacheKey = `daily-report:${userIdentifier}:${year || "all"}:${month || "all"}:${
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

    if (month) {
      whereClauses.push(`MONTH(T0.DocDate) = @month`);
      params.push({ name: "month", type: sql.Int, value: parseInt(month) });
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
          YEAR(T0.DocDate) AS [Year],
          MONTH(T0.DocDate) AS [MonthNumber],
          DAY(T0.DocDate) AS [Day],
          DATENAME(MONTH, T0.DocDate) AS [Month],
          T5.SlpName AS [Sales_Person],
          T0.CardName AS [Customer],
          T0.CardCode AS [CardCode],
          T0.NumAtCard AS [CustomerRefNo],
          T6.Name AS [Contact_Person],
          CASE 
              WHEN T0.DocStatus = 'O' AND 
                   EXISTS (SELECT 1 FROM RDR1 WHERE DocEntry = T0.DocEntry AND LineStatus = 'O') AND
                   EXISTS (SELECT 1 FROM RDR1 WHERE DocEntry = T0.DocEntry AND LineStatus = 'C')
              THEN 'Partial'
              WHEN T0.DocStatus = 'O' THEN 'Open'
              WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
              WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'Cancelled'
              ELSE 'NA'
          END AS [Status_Header],
          T0.DocNum AS [SO_No],
          T0.DocDate AS [SO_Date],
          CASE 
              WHEN T1.LineStatus = 'O' THEN 'Open'
              WHEN T1.LineStatus = 'C' THEN 'Closed'
              ELSE 'NA'
          END AS [Status_Line],
          T1.ItemCode AS [Item_No],
          T3.SuppCatNum AS [Vendor_Catalog_No],
          T1.UnitMsr AS [PKZ],
          T1.Dscription AS [Item_Service_Description],
          ISNULL(T1.U_CasNo, T3.U_CasNo) AS [Cas_No],
          ISNULL(T15.U_vendorbatchno, '') AS [Batch_No],
          ROUND(T1.OpenQty, 2) AS [Open Qty],
          T1.DelivrdQty AS [Delivered Quantity],
          CASE 
              WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
              ELSE 'Out of Stock'
          END AS [Stock Status-In hyd],
          T1.ShipDate AS [Delivery Date],
          T1.U_timeline AS [Timeline],
          T1.Quantity AS [Quantity],
          T1.Price AS [Unit_Price],
          T1.LineTotal AS [Total_Price],
          T4.ItmsGrpNam AS [Category],
          CASE 
              WHEN OINV.DocNum IS NULL THEN 'N/A'
              ELSE CAST(OINV.DocNum AS VARCHAR(20))
          END AS [Invoice_No],
          T1.U_mkt_feedback AS [MKT_Feedback]
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
      LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      LEFT JOIN OLCT T2 ON T1.LocCode = T2.Code
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