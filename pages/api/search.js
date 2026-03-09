
// // pages/api/search.js
// import { queryDatabase } from '../../lib/db';
// import sql from 'mssql';
// import { verify } from "jsonwebtoken";
// import { getCache, setCache } from "../../lib/redis";

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   const { query: searchTerm } = req.query;

//   // Handle empty query parameter
//   if (!searchTerm || searchTerm.trim() === '') {
//     return res.status(400).json({ error: 'Query parameter is required' });
//   }

//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({
//       error: "Missing or malformed Authorization header",
//       received: authHeader,
//     });
//   }

//   const token = authHeader.split(" ")[1];
//   let decoded;

//   try {
//     decoded = verify(token, process.env.JWT_SECRET);
//   } catch (verifyError) {
//     console.error("Token verification failed:", verifyError);
//     return res.status(401).json({ error: "Token verification failed" });
//   }

//   const isAdmin = decoded.role === "admin";
//   const contactCodes = decoded.contactCodes || [];
//   const cardCodes = decoded.cardCodes || [];

  

//   // Build role-based filtering
//   const baseWhereClause = "T0.CANCELED = 'N'";
//   let roleWhereClause = "";

//   if (!isAdmin) {
//     if (contactCodes.length > 0) {
//       roleWhereClause = `AND T0.SlpCode IN (${contactCodes.map(code => `'${code}'`).join(",")})`;
//     } else if (cardCodes.length > 0) {
//       roleWhereClause = `AND T0.CardCode IN (${cardCodes.map(code => `'${code}'`).join(",")})`;
//     } else {
//       return res.status(403).json({
//         error: "No access: cardCodes or contactCodes not provided",
//       });
//     }
//   }

//   try {
//     // Prepare the search term with wildcards
//     const searchPattern = `%${searchTerm}%`;
//     const params = [{ name: 'search', type: sql.VarChar, value: searchPattern }];

//     // Invoice search query with role filtering - ALWAYS include Sales Employee column
//     const invoiceQuery = `
//       SELECT TOP 10
//           T0.DocNum AS 'Invoice No',
//           CASE 
//               WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'N' THEN 'Closed'
//               WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'Y' THEN 'Canceled'
//               WHEN T0.DocStatus = 'O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
//               WHEN T0.DocStatus = 'O' THEN 'Open'
//               ELSE 'NA'
//           END AS 'Status',
//           T0.NumAtCard AS 'Ref No',
//           T0.CardName AS 'Customer Name',
//           T0.DocTotal AS 'Total Amount',
//           T0.U_DispatchDate AS 'Dispatch Date',
//           T1.SlpName AS 'Sales Employee'
//       FROM OINV T0
//       LEFT JOIN OSLP T1 ON T0.SlpCode = T1.SlpCode
//       WHERE ${baseWhereClause}
//       ${roleWhereClause}
//       AND (
//           CAST(T0.DocNum AS VARCHAR(50)) LIKE @search
//           OR T0.NumAtCard LIKE @search
//           OR T0.CardName LIKE @search
//           ${isAdmin ? "OR T1.SlpName LIKE @search" : ""}
//       )
//       ORDER BY T0.DocNum DESC
//     `;

//     // Order search query with role filtering - ALWAYS include Sales Employee column
//     const orderQuery = `
//       SELECT TOP 10
//           T0.DocNum AS 'SO No',
//           CASE 
//               WHEN (
//                   T0.DocStatus = 'O'
//                   AND EXISTS (
//                       SELECT 1
//                       FROM RDR1 T1
//                       LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                                      AND T1.LineNum = DLN1.BaseLine
//                                      AND DLN1.BaseType = 17
//                       LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                                      AND DLN1.LineNum = INV1.BaseLine
//                                      AND INV1.BaseType = 15
//                       LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                                      AND OINV.CANCELED = 'N'
//                       WHERE T1.DocEntry = T0.DocEntry
//                         AND OINV.DocNum IS NOT NULL
//                         AND CAST(OINV.DocNum AS VARCHAR(50)) <> 'N/A'
//                   )
//                   AND EXISTS (
//                       SELECT 1
//                       FROM RDR1 T1
//                       LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                                      AND T1.LineNum = DLN1.BaseLine
//                                      AND DLN1.BaseType = 17
//                       LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                                      AND DLN1.LineNum = INV1.BaseLine
//                                      AND INV1.BaseType = 15
//                       LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                                      AND OINV.CANCELED = 'N'
//                       WHERE T1.DocEntry = T0.DocEntry
//                         AND (
//                           OINV.DocNum IS NULL
//                           OR CAST(OINV.DocNum AS VARCHAR(50)) = 'N/A'
//                         )
//                   )
//               ) THEN 'Partial'
//               WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//               WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
//               WHEN T0.DocStatus='O' THEN 'Open'
//               ELSE 'NA'
//           END AS 'Status',
//           T0.NumAtCard AS 'PO No',
//           T0.CardName AS 'Customer Name',
//           T0.DocTotal AS 'Total Amount',
//           T1.SlpName AS 'Sales Employee'
//       FROM ORDR T0
//       LEFT JOIN OSLP T1 ON T0.SlpCode = T1.SlpCode
//       WHERE ${baseWhereClause}
//       ${roleWhereClause}
//       AND (
//           CAST(T0.DocNum AS VARCHAR(50)) LIKE @search
//           OR T0.NumAtCard LIKE @search
//           OR T0.CardName LIKE @search
//           ${isAdmin ? "OR T1.SlpName LIKE @search" : ""}
//       )
//       ORDER BY T0.DocNum DESC
//     `;

//     // Execute both queries
//     const [invoiceResults, orderResults] = await Promise.all([
//       queryDatabase(invoiceQuery, params),
//       queryDatabase(orderQuery, params)
//     ]);

//     // Format the grouped results - EXACT SAME STRUCTURE AS UNCOMMENTED CODE
//     const groupedResults = [];

//     // Add Invoice header and results if any invoices found
//     if (invoiceResults && invoiceResults.length > 0) {
//       // Add header row - EXACT SAME STRUCTURE
//       groupedResults.push({
//         type: 'header',
//         category: 'Invoice',
//         data: ['Invoice No', 'Status', 'Ref No', 'Customer Name', 'Total Amount', 'Dispatch Date', 'Sales Employee']
//       });

//       // Add invoice data rows - EXACT SAME STRUCTURE
//       invoiceResults.forEach(invoice => {
//         groupedResults.push({
//           type: 'data',
//           category: 'Invoice',
//           data: [
//             invoice['Invoice No'],
//             invoice['Status'],
//             invoice['Ref No'] || '',
//             invoice['Customer Name'],
//             invoice['Total Amount'],
//             invoice['Dispatch Date'] || '',
//             invoice['Sales Employee'] || ''
//           ]
//         });
//       });
//     }

//     // Add Order header and results if any orders found
//     if (orderResults && orderResults.length > 0) {
//       // Add header row - EXACT SAME STRUCTURE
//       groupedResults.push({
//         type: 'header',
//         category: 'Order',
//         data: ['SO No', 'Status', 'PO No', 'Customer Name', 'Total Amount', 'Sales Employee']
//       });

//       // Add order data rows - EXACT SAME STRUCTURE
//       orderResults.forEach(order => {
//         groupedResults.push({
//           type: 'data',
//           category: 'Order',
//           data: [
//             order['SO No'],
//             order['Status'],
//             order['PO No'] || '',
//             order['Customer Name'],
//             order['Total Amount'],
//             order['Sales Employee'] || ''
//           ]
//         });
//       });
//     }

//     // CACHING LOGIC CONTINUED (commented out)
//     /*
//     // Cache the results for 5 minutes
//     await setCache(cacheKey, groupedResults, 300);
//     */

//     return res.status(200).json(groupedResults);
//   } catch (error) {
//     console.error('Database error:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// }

// pages/api/search.js
import { queryDatabase } from '../../lib/db';
import sql from 'mssql';
import { verify } from "jsonwebtoken";
import { getCache, setCache } from "../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query: searchTerm } = req.query;

  if (!searchTerm || searchTerm.trim() === '') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or malformed Authorization header",
      received: authHeader,
    });
  }

  const token = authHeader.split(" ")[1];
  let decoded;

  try {
    decoded = verify(token, process.env.JWT_SECRET);
  } catch (verifyError) {
    console.error("Token verification failed:", verifyError);
    return res.status(401).json({ error: "Token verification failed" });
  }

  const isAdmin = decoded.role === "admin";
  const contactCodes = decoded.contactCodes || [];
  const cardCodes = decoded.cardCodes || [];

  // Build role-based filtering
  const baseWhereClause = "T0.CANCELED = 'N'";
  let roleWhereClause = "";

  if (!isAdmin) {
    if (contactCodes.length > 0) {
      roleWhereClause = `AND T0.SlpCode IN (${contactCodes.map(code => `'${code}'`).join(",")})`;
    } else if (cardCodes.length > 0) {
      roleWhereClause = `AND T0.CardCode IN (${cardCodes.map(code => `'${code}'`).join(",")})`;
    } else {
      return res.status(403).json({
        error: "No access: cardCodes or contactCodes not provided",
      });
    }
  }

  try {
    const searchPattern = `%${searchTerm}%`;
    const params = [{ name: 'search', type: sql.VarChar, value: searchPattern }];

    // Invoice search query with DISPATCH-BASED STATUS
    const invoiceQuery = `
      SELECT TOP 10
          T0.DocNum AS 'Invoice No',
          CASE 
              -- All line items dispatched
              WHEN NOT EXISTS (
                  SELECT 1 
                  FROM INV1 
                  WHERE INV1.DocEntry = T0.DocEntry 
                  AND (T0.U_DispatchDate IS NULL OR T0.U_DispatchDate = '')
              ) THEN 'Closed'
              
              -- No line items dispatched
              WHEN NOT EXISTS (
                  SELECT 1 
                  FROM INV1 
                  WHERE INV1.DocEntry = T0.DocEntry 
                  AND T0.U_DispatchDate IS NOT NULL 
                  AND T0.U_DispatchDate <> ''
              ) THEN 'Open'
              
              -- Some line items dispatched, some not
              WHEN EXISTS (
                  SELECT 1 
                  FROM INV1 
                  WHERE INV1.DocEntry = T0.DocEntry 
                  AND T0.U_DispatchDate IS NOT NULL 
                  AND T0.U_DispatchDate <> ''
              ) 
              AND EXISTS (
                  SELECT 1 
                  FROM INV1 
                  WHERE INV1.DocEntry = T0.DocEntry 
                  AND (T0.U_DispatchDate IS NULL OR T0.U_DispatchDate = '')
              ) THEN 'Partial'
              
              -- Document is canceled
              WHEN T0.CANCELED = 'Y' THEN 'Canceled'
              
              ELSE 'Open'
          END AS 'Status',
          T0.NumAtCard AS 'Ref No',
          T0.CardName AS 'Customer Name',
          T0.DocTotal AS 'Total Amount',
          T0.U_DispatchDate AS 'Dispatch Date',
          T1.SlpName AS 'Sales Employee'
      FROM OINV T0
      LEFT JOIN OSLP T1 ON T0.SlpCode = T1.SlpCode
      WHERE ${baseWhereClause}
      ${roleWhereClause}
      AND (
          CAST(T0.DocNum AS VARCHAR(50)) LIKE @search
          OR T0.NumAtCard LIKE @search
          OR T0.CardName LIKE @search
          ${isAdmin ? "OR T1.SlpName LIKE @search" : ""}
      )
      ORDER BY T0.DocNum DESC
    `;

    // Order search query with role filtering - Keep existing logic
    const orderQuery = `
      SELECT TOP 10
          T0.DocNum AS 'SO No',
          CASE 
              WHEN (
                  T0.DocStatus = 'O'
                  AND EXISTS (
                      SELECT 1
                      FROM RDR1 T1
                      LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
                                     AND T1.LineNum = DLN1.BaseLine
                                     AND DLN1.BaseType = 17
                      LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
                                     AND DLN1.LineNum = INV1.BaseLine
                                     AND INV1.BaseType = 15
                      LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
                                     AND OINV.CANCELED = 'N'
                      WHERE T1.DocEntry = T0.DocEntry
                        AND OINV.DocNum IS NOT NULL
                        AND CAST(OINV.DocNum AS VARCHAR(50)) <> 'N/A'
                  )
                  AND EXISTS (
                      SELECT 1
                      FROM RDR1 T1
                      LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
                                     AND T1.LineNum = DLN1.BaseLine
                                     AND DLN1.BaseType = 17
                      LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
                                     AND DLN1.LineNum = INV1.BaseLine
                                     AND INV1.BaseType = 15
                      LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
                                     AND OINV.CANCELED = 'N'
                      WHERE T1.DocEntry = T0.DocEntry
                        AND (
                          OINV.DocNum IS NULL
                          OR CAST(OINV.DocNum AS VARCHAR(50)) = 'N/A'
                        )
                  )
              ) THEN 'Partial'
              WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
              WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
              WHEN T0.DocStatus='O' THEN 'Open'
              ELSE 'NA'
          END AS 'Status',
          T0.NumAtCard AS 'PO No',
          T0.CardName AS 'Customer Name',
          T0.DocTotal AS 'Total Amount',
          T1.SlpName AS 'Sales Employee'
      FROM ORDR T0
      LEFT JOIN OSLP T1 ON T0.SlpCode = T1.SlpCode
      WHERE ${baseWhereClause}
      ${roleWhereClause}
      AND (
          CAST(T0.DocNum AS VARCHAR(50)) LIKE @search
          OR T0.NumAtCard LIKE @search
          OR T0.CardName LIKE @search
          ${isAdmin ? "OR T1.SlpName LIKE @search" : ""}
      )
      ORDER BY T0.DocNum DESC
    `;

    // Execute both queries
    const [invoiceResults, orderResults] = await Promise.all([
      queryDatabase(invoiceQuery, params),
      queryDatabase(orderQuery, params)
    ]);

    // Format the grouped results
    const groupedResults = [];

    // Add Invoice header and results if any invoices found
    if (invoiceResults && invoiceResults.length > 0) {
      groupedResults.push({
        type: 'header',
        category: 'Invoice',
        data: ['Invoice No', 'Status', 'Ref No', 'Customer Name', 'Total Amount', 'Dispatch Date', 'Sales Employee']
      });

      invoiceResults.forEach(invoice => {
        groupedResults.push({
          type: 'data',
          category: 'Invoice',
          data: [
            invoice['Invoice No'],
            invoice['Status'],
            invoice['Ref No'] || '',
            invoice['Customer Name'],
            invoice['Total Amount'],
            invoice['Dispatch Date'] || '',
            invoice['Sales Employee'] || ''
          ]
        });
      });
    }

    // Add Order header and results if any orders found
    if (orderResults && orderResults.length > 0) {
      groupedResults.push({
        type: 'header',
        category: 'Order',
        data: ['SO No', 'Status', 'PO No', 'Customer Name', 'Total Amount', 'Sales Employee']
      });

      orderResults.forEach(order => {
        groupedResults.push({
          type: 'data',
          category: 'Order',
          data: [
            order['SO No'],
            order['Status'],
            order['PO No'] || '',
            order['Customer Name'],
            order['Total Amount'],
            order['Sales Employee'] || ''
          ]
        });
      });
    }

    return res.status(200).json(groupedResults);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}