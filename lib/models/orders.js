//models/orders.js
import { queryDatabase } from "../db";
import sql from "mssql";

export async function getOrders(customQuery) {
  try {
    const data = await queryDatabase(customQuery);
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Failed to fetch orders");
  }
}

// lib/models/orders.js
export async function getOrderDetails(docEntry, docNum) {
  docEntry = parseInt(docEntry, 10);
  docNum = parseInt(docNum, 10);

  // 1) Fetch the order header with joined invoice info (if any)
  const orderHeaderQuery = `
    SELECT 
      T0.DocNum,
      T0.DocEntry,
      T0.DocDate,
      T0.DocDueDate,
      T0.TaxDate AS ShipDate,
      T1.ShipDate AS DeliveryDate,
      T0.CardCode,
      T0.CardName,
      T0.CntctCode,
      T0.DocStatus,
      T0.DocTotal,
      T0.DocCur,
      T0.Comments,
      T0.SlpCode,
      T5.SlpName AS SalesEmployee,
      T0.GroupNum,
      CASE 
        WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
        ELSE 'Out of Stock'
      END AS StockStatus,
      T3.U_CasNo,
      T6.PymntGroup AS PaymentTerms,
      T0.Address2 AS ShipToAddress,
      T0.Address AS BillToAddress,
      T0.DiscSum AS DiscountTotal,
      T0.VatSum AS TaxTotal,
      T0.TotalExpns AS ShippingFee,
      T7.E_MailL          AS "ContactPersonEmail",
      T0.RoundDif AS RoundingDiff,
      (T0.DocTotal - T0.VatSum - T0.TotalExpns + T0.DiscSum) AS Subtotal,
      T0.NumAtCard AS CustomerPONo,
      OINV.trackno AS TrackingNumber,
      OINV.U_DeliveryDate AS DeliveryDate,
      OINV.U_DispatchDate AS DispatchDate,
      T5.Email AS SalesPerson_Email,
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
        WHEN T0.DocStatus='O' THEN 'Open' 
        ELSE 'NA' 
      END AS DocStatusDisplay,
      
      -- Invoice Information (from joined INV1/OINV via Delivery)
      INV1.DocEntry AS InvoiceDocEntry,
      OINV.DocNum AS InvoiceNumber,
      OINV.DocDate AS InvoiceDate,
      OINV.DocTotal AS InvoiceTotal,
      OINV.DocCur AS InvoiceCurrency,
      OINV.DocStatus AS InvoiceStatus,
      OINV.VatSum AS InvoiceTaxTotal,
      OINV.DiscSum AS InvoiceDiscountTotal,
      OINV.TotalExpns AS InvoiceShippingFee,
      OINV.RoundDif AS InvoiceRoundingDiff,
      (OINV.DocTotal - OINV.VatSum - OINV.TotalExpns + OINV.DiscSum) AS InvoiceSubtotal,
      CASE 
        WHEN (OINV.DocStatus='C' AND OINV.CANCELED='N') THEN 'Closed'
        WHEN (OINV.DocStatus='C' AND OINV.CANCELED='Y') THEN 'Cancelled'
        WHEN OINV.DocStatus='O' THEN 'Open' 
        ELSE 'NA' 
      END AS InvoiceStatusDisplay
      
    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
    LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    LEFT JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
    LEFT JOIN OCPR T7
      ON T0.CntctCode = T7.CntctCode
    
    -- Delivery -> Invoice chain
    LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                   AND T1.LineNum = DLN1.BaseLine 
                   AND DLN1.BaseType = 17
    LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                   AND DLN1.LineNum = INV1.BaseLine 
                   AND INV1.BaseType = 15
    LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
    
    WHERE T0.DocEntry = ${docEntry} AND T0.DocNum = ${docNum}
    order by T0.DocDate desc
  `;


  console.log('orderHeaderQuery',orderHeaderQuery)

  // 2) Fetch the order lines (including joined invoice docentry)
  const orderLinesQuery = `
  SELECT 
    T1.LineNum,
    T1.ItemCode,
    OITM.U_CasNo,
    T1.Dscription AS Description,
    T1.Quantity,
    T1.UnitMsr,
    T1.Price,
    T1.LineTotal,
    T1.Currency,
    T1.WhsCode,
    T1.ShipDate AS DeliveryDate,

    T1.TaxCode,
    T1.DiscPrcnt AS DiscountPercent,

    T1.U_timeline AS Timeline,
    
    CASE 
      WHEN OITM.OnHand >= T1.OpenQty THEN 'In Stock'
      ELSE 'Out of Stock'
    END AS StockStatus,
    CASE 
      WHEN T1.LineStatus = 'O' THEN 'Open'
      WHEN T1.LineStatus = 'C' THEN 'Closed'
      ELSE 'NA'
    END AS LineStatus,

    -- Invoice Line Information
    INV1.LineNum       AS InvoiceLineNumber,
    INV1.Quantity      AS InvoicedQuantity,
    INV1.Price         AS InvoiceUnitPrice,
    INV1.LineTotal     AS InvoiceLineTotal,
    
    -- Invoice Header Information for each line
    INV1.DocEntry      AS InvoiceDocEntry,
    OINV.DocNum        AS InvoiceNumber,
    OINV.trackno       AS InvoiceTrackingNumber,
    OINV.U_DeliveryDate AS InvoiceDeliveryDate,
    OINV.U_DispatchDate AS InvoiceDispatchDate,
    OINV.U_Airlinename as Airlinename

  FROM RDR1 T1
  LEFT JOIN OITM ON T1.ItemCode = OITM.ItemCode
  LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                 AND T1.LineNum = DLN1.BaseLine 
                 AND DLN1.BaseType = 17
  LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                 AND DLN1.LineNum = INV1.BaseLine 
                 AND INV1.BaseType = 15
  LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
  
  WHERE T1.DocEntry = ${docEntry}
  ORDER BY T1.LineNum ASC
`;


  // 3) Fetch the contact info
  const contactQuery = `
    SELECT 
      T2.Name AS ContactPerson,
      T2.Tel1 AS Phone,
      T2.E_MailL AS Email
    FROM OCPR T2
    WHERE T2.CntctCode = (SELECT CntctCode FROM ORDR WHERE DocEntry = ${docEntry})
  `;

  try {
    // 4) Execute queries in parallel
    const [orderHeader, orderLines, contactInfo] = await Promise.all([
      queryDatabase(orderHeaderQuery),
      queryDatabase(orderLinesQuery),
      queryDatabase(contactQuery),
    ]);

    // 5) If no header found, return null
    if (!orderHeader || orderHeader.length === 0) {
      return null;
    }

    // 6) Combine the first (header) row, contact info, and line items
    const order = {
      ...orderHeader[0],       // main order + invoice references
      ...contactInfo[0] || {}, // contact info
      LineItems: orderLines,   // array of lines
    };

    return order;
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw error;
  }
}



// // lib/models/orders.js
// export async function getOrdersFromDatabase({
//   page = 1,
//   search = "",
//   status = "all",
//   fromDate,
//   toDate,
//   sortField = "DocDate",
//   sortDir = "desc",
//   itemsPerPage = 20,
//   isAdmin = false,
//   contactCodes = [],
//   cardCodes = [],
//   getAll = false, // Flag to determine if we fetch all records
//   excludeCancelled = true
// }) {
//   // Calculate offset only if not getting all records
//   const offset = getAll ? 0 : (page - 1) * itemsPerPage;

//   // Start building a WHERE clause
//   let whereClause = "1=1";

//   // 1) Search Filter - Search across multiple fields
//   if (search && search.trim()) {
//     const searchTerm = search.trim();
//     whereClause += ` AND (
//       T0.DocNum LIKE '%${searchTerm}%' OR 
//       T0.CardName LIKE '%${searchTerm}%' OR 
//       T0.NumAtCard LIKE '%${searchTerm}%' OR
//       T5.SlpName LIKE '%${searchTerm}%' OR
//       T3.Name LIKE '%${searchTerm}%'
//     )`;
//   }

//   // 2) Status Filter with proper case handling
//   if (status !== "all") {
//     const statusUpper = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
//     whereClause += `
//       AND (
//         CASE
//           WHEN (
//             T0.DocStatus = 'O'
//             AND EXISTS (
//               SELECT 1
//               FROM RDR1 T1
//               LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                              AND T1.LineNum = DLN1.BaseLine
//                              AND DLN1.BaseType = 17
//               LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                              AND DLN1.LineNum = INV1.BaseLine
//                              AND INV1.BaseType = 15
//               LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                              AND OINV.CANCELED = 'N'
//               WHERE T1.DocEntry = T0.DocEntry
//                 AND OINV.DocNum IS NOT NULL
//                 AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
//             )
//             AND EXISTS (
//               SELECT 1
//               FROM RDR1 T1
//               LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                              AND T1.LineNum = DLN1.BaseLine
//                              AND DLN1.BaseType = 17
//               LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                              AND DLN1.LineNum = INV1.BaseLine
//                              AND INV1.BaseType = 15
//               LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                              AND OINV.CANCELED = 'N'
//               WHERE T1.DocEntry = T0.DocEntry
//                 AND (
//                   OINV.DocNum IS NULL
//                   OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'
//                 )
//             )
//           )
//           THEN 'Partial'

//           WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
//           WHEN T0.DocStatus='O' THEN 'Open'
//           ELSE 'NA'
//         END
//       ) = '${statusUpper}'
//     `;
//   }

//   // 3) Date Filters
//   if (fromDate) {
//     whereClause += ` AND T0.DocDate >= '${fromDate}'`;
//   }
//   if (toDate) {
//     whereClause += ` AND T0.DocDate <= '${toDate}'`;
//   }

//   // 4) Exclude cancelled orders by default
//   if (excludeCancelled) {
//     whereClause += " AND T0.CANCELED = 'N'";
//   }

//   // 5) Role-based filtering
//   // if (!isAdmin && cardCodes.length > 0) {
//   //   whereClause += `  
//   //     AND T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})
//   //   `;
//   // }

//   // if (!isAdmin && cardCodes.length === 0 && contactCodes.length > 0) {
//   //   whereClause += ` 
//   //     AND T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})
//   //   `;
//   // }

//   if (!isAdmin) {
//   if (cardCodes.length > 0) {
//     whereClause += `  
//       AND T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})
//     `;
//   } else if (contactCodes.length > 0) {
//     // ✅ Filter out non-numeric values before using in SlpCode
//     const numericContactCodes = contactCodes.filter(code => !isNaN(code));
//     if (numericContactCodes.length > 0) {
//       whereClause += ` 
//         AND T0.SlpCode IN (${numericContactCodes.join(",")})
//       `;
//     }
//   }
// }

//   // 6) Validate sort field to prevent SQL injection
//   const validSortFields = [
//     'DocDate', 'DocNum', 'CardName', 'DocTotal', 'DeliveryDate', 
//     'CreateTs', 'CustomerPONo', 'SalesEmployee', 'ContactPerson', 'DocStatus'
//   ];
  
//   const safeSortField = validSortFields.includes(sortField) ? sortField : 'DocDate';
//   const safeSortDir = (sortDir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

//   // 7) Build the count query (always needed for pagination info)
//   const countQuery = `
//     SELECT COUNT(DISTINCT T0.DocEntry) as total
//     FROM ORDR T0
//     INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//     INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
//     INNER JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
//     WHERE ${whereClause};
//   `;

//   // 8) Build the data query
//   const dataQuery = `
//     SELECT 
//       CASE 
//         WHEN (
//           T0.DocStatus = 'O'
//           AND EXISTS (
//             SELECT 1
//             FROM RDR1 T1
//               LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                              AND T1.LineNum = DLN1.BaseLine
//                              AND DLN1.BaseType = 17
//               LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                              AND DLN1.LineNum = INV1.BaseLine
//                              AND INV1.BaseType = 15
//               LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                              AND OINV.CANCELED = 'N'
//             WHERE T1.DocEntry = T0.DocEntry
//               AND OINV.DocNum IS NOT NULL
//               AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
//           )
//           AND EXISTS (
//             SELECT 1
//             FROM RDR1 T1
//               LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                              AND T1.LineNum = DLN1.BaseLine
//                              AND DLN1.BaseType = 17
//               LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                              AND DLN1.LineNum = INV1.BaseLine
//                              AND INV1.BaseType = 15
//               LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                              AND OINV.CANCELED = 'N'
//             WHERE T1.DocEntry = T0.DocEntry
//               AND (
//                 OINV.DocNum IS NULL
//                 OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'
//               )
//           )
//         )
//         THEN 'Partial'
//         WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//         WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
//         WHEN T0.DocStatus='O' THEN 'Open'
//         ELSE 'NA'
//       END AS DocStatus,
//       T0.CreateTs,
//       T0.DocEntry,
//       T0.DocNum,
//       T0.DocDate,
//       T3.Name AS ContactPerson,
//       T0.DocDueDate AS DeliveryDate,
//       T0.CardName,
//       T0.DocTotal - T0.VatSum AS DocTotal,
//       T0.U_EmailSentDT AS EmailSentDT,
//       T0.U_EmailSentTM AS EmailSentTM,
//       T0.DocCur,
//       T0.DocRate AS ExchangeRate,
//       T0.NumAtCard AS CustomerPONo,
//       T5.SlpName AS SalesEmployee,
//       COUNT(DISTINCT T1.ItemCode) AS ProductCount
//     FROM ORDR T0
//     INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//     INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
//     INNER JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
//     WHERE ${whereClause}
//     GROUP BY 
//       T0.DocEntry,
//       T0.CreateTs,
//       T0.DocNum,
//       T0.DocDate,
//       T3.Name,
//       T0.DocDueDate,
//       T0.CardName,
//       T0.DocTotal,
//       T0.VatSum,
//       T0.U_EmailSentDT,
//       T0.U_EmailSentTM,
//       T0.DocCur,
//       T0.DocRate,
//       T0.NumAtCard,
//       T5.SlpName,
//       T0.DocStatus,
//       T0.CANCELED
//     ORDER BY 
//       ${safeSortField === 'DocStatus' ? 
//         `CASE 
//           WHEN (T0.DocStatus = 'O' AND EXISTS (SELECT 1 FROM RDR1 T1 LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17 LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15 LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N' WHERE T1.DocEntry = T0.DocEntry AND OINV.DocNum IS NOT NULL AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A') AND EXISTS (SELECT 1 FROM RDR1 T1 LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17 LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15 LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N' WHERE T1.DocEntry = T0.DocEntry AND (OINV.DocNum IS NULL OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'))) THEN 'Partial'
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
//           WHEN T0.DocStatus='O' THEN 'Open'
//           ELSE 'NA'
//         END` : 
//         (safeSortField === 'DocTotal' ? '(T0.DocTotal - T0.VatSum)' : 
//          safeSortField === 'CustomerPONo' ? 'T0.NumAtCard' :
//          safeSortField === 'SalesEmployee' ? 'T5.SlpName' :
//          safeSortField === 'ContactPerson' ? 'T3.Name' :
//          safeSortField === 'DeliveryDate' ? 'T0.DocDueDate' :
//          `T0.${safeSortField}`)
//       } ${safeSortDir}
//     ${
//       getAll ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY`
//     };
//   `;

//   try {
//     console.log('Executing count query:', countQuery);
//     console.log('Executing data query:', dataQuery);
    
//     // Execute both queries
//     const [totalResult, rawOrders] = await Promise.all([
//       queryDatabase(countQuery),
//       queryDatabase(dataQuery),
//     ]);

//     const totalItems = totalResult[0]?.total || 0;

//     // Convert date fields to ISO strings and ensure proper formatting
//     const orders = rawOrders.map((order) => ({
//       ...order,
//       DocDate: order.DocDate ? order.DocDate.toISOString() : null,
//       DeliveryDate: order.DeliveryDate ? order.DeliveryDate.toISOString() : null,
//       EmailSentDT: order.EmailSentDT ? order.EmailSentDT.toISOString() : null,
//       EmailSentTM: order.EmailSentTM ?? null,
//       DocTotal: parseFloat(order.DocTotal || 0),
//       ExchangeRate: parseFloat(order.ExchangeRate || 1),
//     }));

//     console.log(`Fetched ${orders.length} orders out of ${totalItems} total`);

//     return {
//       orders,
//       totalItems,
//     };
//   } catch (error) {
//     console.error("Error fetching orders from database:", error);
//     console.error("Count query:", countQuery);
//     console.error("Data query:", dataQuery);
//     throw error;
//   }
// }

// export async function getOrdersFromDatabase({
//   page = 1,
//   search = "",
//   status = "all",
//   fromDate,
//   toDate,
//   sortField = "DocDate",
//   sortDir = "desc",
//   itemsPerPage = 20,
//   isAdmin = false,
//   contactCodes = [],
//   cardCodes = [],
//   // ADD: Category filtering parameters
//   filterByCategory = false,
//   category = "",
//   getAll = false,
//   excludeCancelled = true
// }) {
//   // Calculate offset only if not getting all records
//   const offset = getAll ? 0 : (page - 1) * itemsPerPage;

//   // Start building a WHERE clause
//   let whereClause = "1=1";

//   // 1) Search Filter - Search across multiple fields
//   if (search && search.trim()) {
//     const searchTerm = search.trim();
//     whereClause += ` AND (
//       T0.DocNum LIKE '%${searchTerm}%' OR 
//       T0.CardName LIKE '%${searchTerm}%' OR 
//       T0.NumAtCard LIKE '%${searchTerm}%' OR
//       T5.SlpName LIKE '%${searchTerm}%' OR
//       T3.Name LIKE '%${searchTerm}%'
//     )`;
//   }

//   // 2) Status Filter with proper case handling
//   if (status !== "all") {
//     const statusUpper = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
//     whereClause += `
//       AND (
//         CASE
//           WHEN (
//             T0.DocStatus = 'O'
//             AND EXISTS (
//               SELECT 1
//               FROM RDR1 T1
//               LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                              AND T1.LineNum = DLN1.BaseLine
//                              AND DLN1.BaseType = 17
//               LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                              AND DLN1.LineNum = INV1.BaseLine
//                              AND INV1.BaseType = 15
//               LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                              AND OINV.CANCELED = 'N'
//               WHERE T1.DocEntry = T0.DocEntry
//                 AND OINV.DocNum IS NOT NULL
//                 AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
//             )
//             AND EXISTS (
//               SELECT 1
//               FROM RDR1 T1
//               LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                              AND T1.LineNum = DLN1.BaseLine
//                              AND DLN1.BaseType = 17
//               LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                              AND DLN1.LineNum = INV1.BaseLine
//                              AND INV1.BaseType = 15
//               LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                              AND OINV.CANCELED = 'N'
//               WHERE T1.DocEntry = T0.DocEntry
//                 AND (
//                   OINV.DocNum IS NULL
//                   OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'
//                 )
//             )
//           )
//           THEN 'Partial'

//           WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
//           WHEN T0.DocStatus='O' THEN 'Open'
//           ELSE 'NA'
//         END
//       ) = '${statusUpper}'
//     `;
//   }

//   // 3) Date Filters
//   if (fromDate) {
//     whereClause += ` AND T0.DocDate >= '${fromDate}'`;
//   }
//   if (toDate) {
//     whereClause += ` AND T0.DocDate <= '${toDate}'`;
//   }

//   // 4) Exclude cancelled orders by default
//   if (excludeCancelled) {
//     whereClause += " AND T0.CANCELED = 'N'";
//   }

//   // 5) NEW: Category-based filtering (for 3ASenrise and similar roles)
//   if (filterByCategory && category) {
//     // Filter orders by item category
//     // We'll add a condition that requires at least one line item to be in the specified category
//     whereClause += ` AND EXISTS (
//       SELECT 1 
//       FROM RDR1 T1_CAT
//       INNER JOIN OITM ITM ON T1_CAT.ItemCode = ITM.ItemCode
//       INNER JOIN OITB ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
//       WHERE T1_CAT.DocEntry = T0.DocEntry
//       AND ITMGRP.ItmsGrpNam = '${category}'
//     )`;
//   }
//   // 6) OLD: Role-based filtering (for other users)
//   else if (!isAdmin) {
//     if (Array.isArray(cardCodes) && cardCodes.length > 0) {
//       // Filter out empty strings
//       const validCardCodes = cardCodes.filter(code => code && code.trim() !== '');
//       if (validCardCodes.length > 0) {
//         whereClause += `  
//           AND T0.CardCode IN (${validCardCodes.map((code) => `'${code}'`).join(",")})
//         `;
//       }
//     } else if (Array.isArray(contactCodes) && contactCodes.length > 0) {
//       // ✅ Filter out non-numeric values before using in SlpCode
//       const numericContactCodes = contactCodes.filter(code => !isNaN(code) && code !== '' && code !== null);
//       if (numericContactCodes.length > 0) {
//         whereClause += ` 
//           AND T0.SlpCode IN (${numericContactCodes.join(",")})
//         `;
//       }
//     }
//   }

//   // 7) Validate sort field to prevent SQL injection
//   const validSortFields = [
//     'DocDate', 'DocNum', 'CardName', 'DocTotal', 'DeliveryDate', 
//     'CreateTs', 'CustomerPONo', 'SalesEmployee', 'ContactPerson', 'DocStatus'
//   ];
  
//   const safeSortField = validSortFields.includes(sortField) ? sortField : 'DocDate';
//   const safeSortDir = (sortDir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

//   // 8) Build the count query (always needed for pagination info)
//   const countQuery = `
//     SELECT COUNT(DISTINCT T0.DocEntry) as total
//     FROM ORDR T0
//     INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//     INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
//     INNER JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
//     ${filterByCategory && category ? `
//       -- Additional joins for category filtering
//       INNER JOIN OITM ITM ON T1.ItemCode = ITM.ItemCode
//       INNER JOIN OITB ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
//     ` : ''}
//     WHERE ${whereClause}
//     ${filterByCategory && category ? `AND ITMGRP.ItmsGrpNam = '${category}'` : ''};
//   `;

//   // 9) Build the data query
//   const dataQuery = `
//     SELECT DISTINCT
//       CASE 
//         WHEN (
//           T0.DocStatus = 'O'
//           AND EXISTS (
//             SELECT 1
//             FROM RDR1 T1
//               LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                              AND T1.LineNum = DLN1.BaseLine
//                              AND DLN1.BaseType = 17
//               LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                              AND DLN1.LineNum = INV1.BaseLine
//                              AND INV1.BaseType = 15
//               LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                              AND OINV.CANCELED = 'N'
//             WHERE T1.DocEntry = T0.DocEntry
//               AND OINV.DocNum IS NOT NULL
//               AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
//           )
//           AND EXISTS (
//             SELECT 1
//             FROM RDR1 T1
//               LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                              AND T1.LineNum = DLN1.BaseLine
//                              AND DLN1.BaseType = 17
//               LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                              AND DLN1.LineNum = INV1.BaseLine
//                              AND INV1.BaseType = 15
//               LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                              AND OINV.CANCELED = 'N'
//             WHERE T1.DocEntry = T0.DocEntry
//               AND (
//                 OINV.DocNum IS NULL
//                 OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'
//               )
//           )
//         )
//         THEN 'Partial'
//         WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//         WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
//         WHEN T0.DocStatus='O' THEN 'Open'
//         ELSE 'NA'
//       END AS DocStatus,
//       T0.CreateTs,
//       T0.DocEntry,
//       T0.DocNum,
//       T0.DocDate,
//       T3.Name AS ContactPerson,
//       T0.DocDueDate AS DeliveryDate,
//       T0.CardName,
//       T0.DocTotal - T0.VatSum AS DocTotal,
//       T0.U_EmailSentDT AS EmailSentDT,
//       T0.U_EmailSentTM AS EmailSentTM,
//       T0.DocCur,
//       T0.DocRate AS ExchangeRate,
//       T0.NumAtCard AS CustomerPONo,
//       T5.SlpName AS SalesEmployee,
//       COUNT(DISTINCT T1.ItemCode) AS ProductCount
//     FROM ORDR T0
//     INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//     INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
//     INNER JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
//     ${filterByCategory && category ? `
//       -- Additional joins for category filtering
//       INNER JOIN OITM ITM ON T1.ItemCode = ITM.ItemCode
//       INNER JOIN OITB ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
//     ` : ''}
//     WHERE ${whereClause}
//     ${filterByCategory && category ? `AND ITMGRP.ItmsGrpNam = '${category}'` : ''}
//     GROUP BY 
//       T0.DocEntry,
//       T0.CreateTs,
//       T0.DocNum,
//       T0.DocDate,
//       T3.Name,
//       T0.DocDueDate,
//       T0.CardName,
//       T0.DocTotal,
//       T0.VatSum,
//       T0.U_EmailSentDT,
//       T0.U_EmailSentTM,
//       T0.DocCur,
//       T0.DocRate,
//       T0.NumAtCard,
//       T5.SlpName,
//       T0.DocStatus,
//       T0.CANCELED
//     ORDER BY 
//       ${safeSortField === 'DocStatus' ? 
//         `CASE 
//           WHEN (T0.DocStatus = 'O' AND EXISTS (SELECT 1 FROM RDR1 T1 LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17 LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15 LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N' WHERE T1.DocEntry = T0.DocEntry AND OINV.DocNum IS NOT NULL AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A') AND EXISTS (SELECT 1 FROM RDR1 T1 LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17 LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15 LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N' WHERE T1.DocEntry = T0.DocEntry AND (OINV.DocNum IS NULL OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'))) THEN 'Partial'
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
//           WHEN T0.DocStatus='O' THEN 'Open'
//           ELSE 'NA'
//         END` : 
//         (safeSortField === 'DocTotal' ? '(T0.DocTotal - T0.VatSum)' : 
//          safeSortField === 'CustomerPONo' ? 'T0.NumAtCard' :
//          safeSortField === 'SalesEmployee' ? 'T5.SlpName' :
//          safeSortField === 'ContactPerson' ? 'T3.Name' :
//          safeSortField === 'DeliveryDate' ? 'T0.DocDueDate' :
//          `T0.${safeSortField}`)
//       } ${safeSortDir}
//     ${
//       getAll ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY`
//     };
//   `;

//   try {
//     console.log('Executing count query:', countQuery);
//     console.log('Executing data query:', dataQuery);
    
//     // Execute both queries
//     const [totalResult, rawOrders] = await Promise.all([
//       queryDatabase(countQuery),
//       queryDatabase(dataQuery),
//     ]);

//     const totalItems = totalResult[0]?.total || 0;

//     // Convert date fields to ISO strings and ensure proper formatting
//     const orders = rawOrders.map((order) => ({
//       ...order,
//       DocDate: order.DocDate ? order.DocDate.toISOString() : null,
//       DeliveryDate: order.DeliveryDate ? order.DeliveryDate.toISOString() : null,
//       EmailSentDT: order.EmailSentDT ? order.EmailSentDT.toISOString() : null,
//       EmailSentTM: order.EmailSentTM ?? null,
//       // FIX for CreateTs - check if it's a Date object first
//       CreateTs: order.CreateTs && typeof order.CreateTs.toISOString === 'function' 
//         ? order.CreateTs.toISOString() 
//         : null,
//       DocTotal: parseFloat(order.DocTotal || 0),
//       ExchangeRate: parseFloat(order.ExchangeRate || 1),
//     }));

//     console.log(`Fetched ${orders.length} orders out of ${totalItems} total`);

//     return {
//       orders,
//       totalItems,
//     };
//   } catch (error) {
//     console.error("Error fetching orders from database:", error);
//     console.error("Count query:", countQuery);
//     console.error("Data query:", dataQuery);
//     throw error;
//   }
// }


export async function getOrdersFromDatabase({
  page = 1,
  search = "",
  status = "all",
  fromDate,
  toDate,
  sortField = "DocDate",
  sortDir = "desc",
  itemsPerPage = 20,
  isAdmin = false,
  contactCodes = [],
  cardCodes = [],
  filterByCategory = false,
  category = "",
  getAll = false,
  excludeCancelled = true
}) {
  // Calculate offset only if not getting all records
  const offset = getAll ? 0 : (page - 1) * itemsPerPage;

  // Start building a WHERE clause
  let whereClause = "1=1";

  // 1) Search Filter
  if (search && search.trim()) {
    const searchTerm = search.trim();
    whereClause += ` AND (
      T0.DocNum LIKE '%${searchTerm}%' OR 
      T0.CardName LIKE '%${searchTerm}%' OR 
      T0.NumAtCard LIKE '%${searchTerm}%' OR
      T5.SlpName LIKE '%${searchTerm}%' OR
      T3.Name LIKE '%${searchTerm}%'
    )`;
  }

  // 2) Status Filter
  if (status !== "all") {
    const statusUpper = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    whereClause += `
      AND (
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
                AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
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
                  OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'
                )
            )
          )
          THEN 'Partial'

          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
          WHEN T0.DocStatus='O' THEN 'Open'
          ELSE 'NA'
        END
      ) = '${statusUpper}'
    `;
  }

  // 3) Date Filters
  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

  // 4) Exclude cancelled orders
  if (excludeCancelled) {
    whereClause += " AND T0.CANCELED = 'N'";
  }

  // 5) Category-based filtering
  if (filterByCategory && category) {
    whereClause += ` AND EXISTS (
      SELECT 1 
      FROM RDR1 T1_CAT
      INNER JOIN OITM ITM ON T1_CAT.ItemCode = ITM.ItemCode
      INNER JOIN OITB ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
      WHERE T1_CAT.DocEntry = T0.DocEntry
      AND ITMGRP.ItmsGrpNam = '${category}'
    )`;
  }
  // 6) Role-based filtering
  else if (!isAdmin) {
    if (Array.isArray(cardCodes) && cardCodes.length > 0) {
      const validCardCodes = cardCodes.filter(code => code && code.trim() !== '');
      if (validCardCodes.length > 0) {
        whereClause += `  
          AND T0.CardCode IN (${validCardCodes.map((code) => `'${code}'`).join(",")})
        `;
      }
    } else if (Array.isArray(contactCodes) && contactCodes.length > 0) {
      const numericContactCodes = contactCodes.filter(code => !isNaN(code) && code !== '' && code !== null);
      if (numericContactCodes.length > 0) {
        whereClause += ` 
          AND T0.SlpCode IN (${numericContactCodes.join(",")})
        `;
      }
    }
  }

  // 7) Validate sort field
  const validSortFields = [
    'DocDate', 'DocNum', 'CardName', 'DocTotal', 'DeliveryDate', 
    'CreateTs', 'CustomerPONo', 'SalesEmployee', 'ContactPerson', 'DocStatus'
  ];
  
  const safeSortField = validSortFields.includes(sortField) ? sortField : 'DocDate';
  const safeSortDir = (sortDir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

  // 8) Build the count query - SIMPLIFIED: No duplicate category filtering
  const countQuery = `
    SELECT COUNT(DISTINCT T0.DocEntry) as total
    FROM ORDR T0
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
    WHERE ${whereClause};
  `;

  // 9) Build the data query - SIMPLIFIED: No duplicate category filtering
  const dataQuery = `
    SELECT DISTINCT
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
              AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
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
                OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'
              )
          )
        )
        THEN 'Partial'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
        WHEN T0.DocStatus='O' THEN 'Open'
        ELSE 'NA'
      END AS DocStatus,
      T0.CreateTs,
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T3.Name AS ContactPerson,
      T0.DocDueDate AS DeliveryDate,
      T0.CardName,
      T0.DocTotal - T0.VatSum AS DocTotal,
      T0.U_EmailSentDT AS EmailSentDT,
      T0.U_EmailSentTM AS EmailSentTM,
      T0.DocCur,
      T0.DocRate AS ExchangeRate,
      T0.NumAtCard AS CustomerPONo,
      T5.SlpName AS SalesEmployee,
      COUNT(DISTINCT T1.ItemCode) AS ProductCount
    FROM ORDR T0
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
    WHERE ${whereClause}
    GROUP BY 
      T0.DocEntry,
      T0.CreateTs,
      T0.DocNum,
      T0.DocDate,
      T3.Name,
      T0.DocDueDate,
      T0.CardName,
      T0.DocTotal,
      T0.VatSum,
      T0.U_EmailSentDT,
      T0.U_EmailSentTM,
      T0.DocCur,
      T0.DocRate,
      T0.NumAtCard,
      T5.SlpName,
      T0.DocStatus,
      T0.CANCELED
    ORDER BY 
      ${safeSortField === 'DocStatus' ? 
        `CASE 
          WHEN (T0.DocStatus = 'O' AND EXISTS (SELECT 1 FROM RDR1 T1 LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17 LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15 LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N' WHERE T1.DocEntry = T0.DocEntry AND OINV.DocNum IS NOT NULL AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A') AND EXISTS (SELECT 1 FROM RDR1 T1 LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17 LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15 LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N' WHERE T1.DocEntry = T0.DocEntry AND (OINV.DocNum IS NULL OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'))) THEN 'Partial'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
          WHEN T0.DocStatus='O' THEN 'Open'
          ELSE 'NA'
        END` : 
        (safeSortField === 'DocTotal' ? '(T0.DocTotal - T0.VatSum)' : 
         safeSortField === 'CustomerPONo' ? 'T0.NumAtCard' :
         safeSortField === 'SalesEmployee' ? 'T5.SlpName' :
         safeSortField === 'ContactPerson' ? 'T3.Name' :
         safeSortField === 'DeliveryDate' ? 'T0.DocDueDate' :
         `T0.${safeSortField}`)
      } ${safeSortDir}
    ${
      getAll ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY`
    };
  `;

  try {
    console.log('Executing count query:', countQuery);
    console.log('Executing data query:', dataQuery);
    
    const [totalResult, rawOrders] = await Promise.all([
      queryDatabase(countQuery),
      queryDatabase(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;

    const orders = rawOrders.map((order) => ({
      ...order,
      DocDate: order.DocDate ? order.DocDate.toISOString() : null,
      DeliveryDate: order.DeliveryDate ? order.DeliveryDate.toISOString() : null,
      EmailSentDT: order.EmailSentDT ? order.EmailSentDT.toISOString() : null,
      EmailSentTM: order.EmailSentTM ?? null,
      CreateTs: order.CreateTs && typeof order.CreateTs.toISOString === 'function' 
        ? order.CreateTs.toISOString() 
        : null,
      DocTotal: parseFloat(order.DocTotal || 0),
      ExchangeRate: parseFloat(order.ExchangeRate || 1),
    }));

    console.log(`Fetched ${orders.length} orders out of ${totalItems} total`);

    return {
      orders,
      totalItems,
    };
  } catch (error) {
    console.error("Error fetching orders from database:", error);
    console.error("Count query:", countQuery);
    console.error("Data query:", dataQuery);
    throw error;
  }
}
  

  // lib/models/openOrders.js
export async function getOpenOrdersFromDatabase({
  page = 1,
  search = "",
  status = "all",
  fromDate,
  toDate,
  sortField = "PostingDate",
  sortDir = "desc",
  itemsPerPage = 20,
  isAdmin = false,
  contactCodes = [],
  cardCodes = [],
  getAll = false, // Flag to determine if we fetch all records
}) {
  // Calculate offset only if not getting all records
  const offset = getAll ? 0 : (page - 1) * itemsPerPage;

  // Start building a WHERE clause - open orders only
  let whereClause = "T1.LineStatus = 'O'";

  // 1) Search Filter - Search across multiple fields
  if (search && search.trim()) {
    const searchTerm = search.trim();
    whereClause += ` AND (
      T0.DocNum LIKE '%${searchTerm}%' OR 
      T0.CardName LIKE '%${searchTerm}%' OR 
      T0.NumAtCard LIKE '%${searchTerm}%' OR
      T1.ItemCode LIKE '%${searchTerm}%' OR
      T1.Dscription LIKE '%${searchTerm}%' OR
      T1.U_CasNo LIKE '%${searchTerm}%' OR
      T3.SuppCatNum LIKE '%${searchTerm}%' OR
      T2.Location LIKE '%${searchTerm}%' OR
      T4.ItmsGrpNam LIKE '%${searchTerm}%' OR
      T5.SlpName LIKE '%${searchTerm}%' OR
      T1.U_timeline LIKE '%${searchTerm}%' OR
      T1.U_mkt_feedback LIKE '%${searchTerm}%' OR
      T6.Name LIKE '%${searchTerm}%'
    )`;
  }

  // 2) Stock Status Filter
  if (status !== "all") {
    if (status === "instock") {
      whereClause += " AND T3.OnHand > 0 AND T3.OnHand >= T1.OpenQty";
    } else if (status === "outofstock") {
      whereClause += " AND (T3.OnHand IS NULL OR T3.OnHand < T1.OpenQty)";
    }
  }

  // 3) Date Filters
  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

  // 4) Role-based filtering
  if (!isAdmin && cardCodes.length > 0) {
    whereClause += `  
      AND T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})
    `;
  }

  if (!isAdmin && cardCodes.length === 0 && contactCodes.length > 0) {
    whereClause += ` 
      AND T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})
    `;
  }

  // 5) Validate sort field to prevent SQL injection
  const validSortFields = [
    'PostingDate', 'DocumentNumber', 'CustomerVendorName', 'ItemName', 
    'Price', 'OpenAmount', 'DeliveryDate', 'Quantity', 'OpenQty', 
    'CustomerPONo', 'PODate', 'SalesEmployee', 'LineStatus'
  ];
  
  const safeSortField = validSortFields.includes(sortField) ? sortField : 'PostingDate';
  const safeSortDir = (sortDir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

  // 6) Build the count query
  const countQuery = `
    SELECT COUNT(DISTINCT CONCAT(T0.DocEntry, '-', T1.LineNum)) as total
    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
    INNER JOIN OLCT T2 ON T1.LocCode = T2.Code
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
    LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    WHERE ${whereClause};
  `;

  // 7) Build the data query
  const dataQuery = `
    SELECT 
      CASE 
        WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
        WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'Cancelled'
        WHEN T0.DocStatus = 'O' THEN 'Open'
        ELSE 'NA'
      END AS DocumentStatus,
      
      T0.DocEntry,
      T0.DocNum AS DocumentNumber,
      T0.DocDate AS PostingDate,
      T0.DocRate AS ExchangeRate,
      T0.NumAtCard AS CustomerPONo,
      T0.TaxDate AS PODate,
      T0.CardName AS CustomerVendorName,
      T6.Name AS ContactPerson,
      
      T4.ItmsGrpNam AS ItemGroup,
      T1.ItemCode AS ItemNo,
      T3.SuppCatNum AS MfrCatalogNo,
      T1.Dscription AS ItemName,
      T1.U_CasNo AS CasNo,
      T1.UnitMsr AS UOMName,
      
      CASE 
        WHEN T1.LineStatus = 'C' THEN 'Closed'
        WHEN T1.LineStatus = 'O' THEN 'Open'
        ELSE 'NA'
      END AS LineStatus,
      
      ROUND(T1.Quantity, 2) AS Quantity,
      ROUND(T1.OpenQty, 2) AS OpenQty,
      ROUND(T1.DelivrdQty, 2) AS DeliveredQuantity,
      
      COALESCE(T3.OnHand, 0) AS Stock,
      CASE 
        WHEN T3.OnHand IS NULL THEN 'Unknown'
        WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
        ELSE 'Out of Stock'
      END AS StockStatus,
      
      T1.U_timeline AS Timeline,
      T1.U_mkt_feedback AS MktFeedback,
      T1.ShipDate AS DeliveryDate,
      T2.Location AS PlantLocation,
      
      ROUND(T1.Price, 3) AS Price,
      T1.Currency AS PriceCurrency,
      ROUND(T1.OpenQty * T1.Price, 2) AS OpenAmount,
      T5.SlpName AS SalesEmployee
      
    FROM ORDR T0  
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
    INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
    INNER JOIN OLCT T2 ON T1.LocCode = T2.Code 
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
    LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    WHERE ${whereClause}
    ORDER BY 
      ${safeSortField === 'DocumentNumber' ? 'T0.DocNum' :
        safeSortField === 'CustomerVendorName' ? 'T0.CardName' :
        safeSortField === 'ItemName' ? 'T1.Dscription' :
        safeSortField === 'Price' ? 'T1.Price' :
        safeSortField === 'OpenAmount' ? '(T1.OpenQty * T1.Price)' :
        safeSortField === 'DeliveryDate' ? 'T1.ShipDate' :
        safeSortField === 'CustomerPONo' ? 'T0.NumAtCard' :
        safeSortField === 'PODate' ? 'T0.TaxDate' :
        safeSortField === 'SalesEmployee' ? 'T5.SlpName' :
        safeSortField === 'LineStatus' ? 'T1.LineStatus' :
        'T0.DocDate'
      } ${safeSortDir}
    ${
      getAll ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY`
    };
  `;

  try {
    console.log('Executing count query:', countQuery);
    console.log('Executing data query:', dataQuery);
    
    // Execute both queries
    const [totalResult, rawOrders] = await Promise.all([
      queryDatabase(countQuery),
      queryDatabase(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;

    // Convert date fields to ISO strings and ensure proper formatting
    const orders = rawOrders.map((order) => ({
      ...order,
      PostingDate: order.PostingDate ? order.PostingDate.toISOString() : null,
      PODate: order.PODate ? order.PODate.toISOString() : null,
      DeliveryDate: order.DeliveryDate ? order.DeliveryDate.toISOString() : null,
      Price: parseFloat(order.Price || 0),
      OpenAmount: parseFloat(order.OpenAmount || 0),
      Quantity: parseFloat(order.Quantity || 0),
      OpenQty: parseFloat(order.OpenQty || 0),
      DeliveredQuantity: parseFloat(order.DeliveredQuantity || 0),
      Stock: parseFloat(order.Stock || 0),
      ExchangeRate: parseFloat(order.ExchangeRate || 1),
    }));

    console.log(`Fetched ${orders.length} open orders out of ${totalItems} total`);

    return {
      orders,
      totalItems,
    };
  } catch (error) {
    console.error("Error fetching open orders from database:", error);
    console.error("Count query:", countQuery);
    console.error("Data query:", dataQuery);
    throw error;
  }
}