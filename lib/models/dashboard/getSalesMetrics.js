
// import { verify } from "jsonwebtoken";
// import sql from "mssql";
// import { queryDatabase } from "../../db";



// // . Main function
// export async function getSalesMetrics({ startDate, endDate, token }) {
//   // Verify token
//   console.log('startDate,endDate', startDate, endDate);
  
//   let decoded;
//   try {
//     decoded = verify(token, process.env.JWT_SECRET);
//   } catch (verifyError) {
//     throw new Error('Token verification failed: ' + verifyError.message);
//   }

//   // Extract role/contactCodes
//   const { role, contactCodes = [] } = decoded;
//   const isAdmin = role === 'admin';

//   // If user is contact_person but no codes, throw an error
//   if (!isAdmin && (!contactCodes || !contactCodes.length)) {
//     throw new Error('No contact codes available for this user.');
//   }

//   // Build the WHERE clauses for each table/alias
//   const params = {
//     startDate,
//     endDate,
//     contactCodes,
//     isAdmin,
//   };

//   // For OINV T0
//   const whereOINV = buildWhereClause('T0', params);

//   // For ORDR T0
//   const whereORDR = buildWhereClause('T0', params);

//   // For OQUT T0
//   const whereOQUT = buildWhereClause('T0', params);

//   // For the sub-query references (ORDR as O, OQUT as Q)
//   // We need separate aliases for the second CTE in quotations query
//   const whereORDR_AsO = buildWhereClause('O', params);
//   const whereOQUT_AsQ = buildWhereClause('Q', params);

//   // Now define our queries:

//   // 1) Sales (OINV + INV1)
//   const salesQuery = `
//     SELECT 
//       SUM(T1.LineTotal) AS TotalSales
//     FROM OINV T0
//     INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//     WHERE ${whereOINV}
//       AND T0.CANCELED = 'N';
//   `;
//   console.log('salesQuery', salesQuery);
  
//   // 2) Outstanding Invoices (OINV)
//   const outstandingQuery = `
//     SELECT 
//       COUNT(DISTINCT T0.DocEntry) AS NumberOfOutstandingInvoices,
//       SUM(T0.DocTotal - T0.PaidToDate) AS TotalOutstandingAmount
//     FROM OINV T0
//     WHERE ${whereOINV}
//       AND T0.CANCELED = 'N'
//       AND T0.DocTotal > T0.PaidToDate;
//   `;

//   // 3) Sales Orders (ORDR)
//   const ordersQuery = `
//     SELECT 
//       COUNT(DISTINCT T0.DocEntry) AS NumberOfSalesOrders
//     FROM ORDR T0
//     WHERE ${whereORDR}
//       AND T0.CANCELED = 'N';
//   `;

//   // 4) Quotations + Conversion Rate
//   const quotationsQuery = `
//     WITH TotalQuotations AS (
//       SELECT COUNT(DISTINCT T0.DocEntry) AS Total
//       FROM OQUT T0
//       WHERE ${whereOQUT}
//         AND T0.CANCELED = 'N'
//     ),
//     ConvertedQuotations AS (
//       SELECT COUNT(DISTINCT O.DocEntry) AS Converted
//       FROM ORDR O
//       INNER JOIN OQUT Q ON O.DocNum = Q.DocNum
//       WHERE ${whereORDR_AsO}
//         AND ${whereOQUT_AsQ}
//         AND O.CANCELED = 'N'
//         AND Q.CANCELED = 'N'
//     )
//     SELECT 
//       CASE 
//         WHEN TQ.Total > 0 
//           THEN CAST(ROUND(CAST(CQ.Converted AS FLOAT) * 100.0 / TQ.Total, 2) AS DECIMAL(5,2))
//           ELSE 0 
//       END AS ConversionRate
//     FROM TotalQuotations TQ
//     CROSS JOIN ConvertedQuotations CQ;
//   `;

//   try {
//     // Execute queries concurrently
//     const [
//       salesResult,
//       outstandingResult,
//       ordersResult,
//       quotationsResult,
//     ] = await Promise.all([
//       queryDatabase(salesQuery),
//       queryDatabase(outstandingQuery),
//       queryDatabase(ordersQuery),
//       queryDatabase(quotationsQuery),
//     ]);

//     // Consolidate results
//     return {
//       totalSales: salesResult[0]?.TotalSales || 0,
//       numberOfSalesOrders: ordersResult[0]?.NumberOfSalesOrders || 0,
//       outstandingInvoices: {
//         count: outstandingResult[0]?.NumberOfOutstandingInvoices || 0,
//         amount: outstandingResult[0]?.TotalOutstandingAmount || 0,
//       },
//       quotationConversionRate: quotationsResult[0]?.ConversionRate || 0,
//     };
//   } catch (error) {
//     console.error('Error in getSalesMetrics:', error);
//     throw error;
//   }
// }



import sql from "mssql";
import { queryDatabase } from "../../db";
// import buildWhereClause from "../buildWhereClause";

// Main function
export async function getSalesMetrics({ startDate, endDate }) {
  console.log("startDate, endDate:", startDate, endDate);

  // Parameters for building WHERE clauses
  const params = {
    startDate,
    endDate,
  };

  // Build the WHERE clauses for each table/alias
  const whereOINV = buildWhereClause("T0", params);
  const whereORDR = buildWhereClause("T0", params);
  const whereOQUT = buildWhereClause("T0", params);
  const whereORDR_AsO = buildWhereClause("O", params);
  const whereOQUT_AsQ = buildWhereClause("Q", params);

  // Now define our queries:

  // 1) Sales (OINV + INV1)
  const salesQuery = `
    SELECT 
      SUM(T1.LineTotal) AS TotalSales
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    WHERE ${whereOINV}
      AND T0.CANCELED = 'N';
  `;
  console.log("salesQuery", salesQuery);

  // 2) Outstanding Invoices (OINV)
  const outstandingQuery = `
    SELECT 
      COUNT(DISTINCT T0.DocEntry) AS NumberOfOutstandingInvoices,
      SUM(T0.DocTotal - T0.PaidToDate) AS TotalOutstandingAmount
    FROM OINV T0
    WHERE ${whereOINV}
      AND T0.CANCELED = 'N'
      AND T0.DocTotal > T0.PaidToDate;
  `;

  // 3) Sales Orders (ORDR)
  const ordersQuery = `
    SELECT 
      COUNT(DISTINCT T0.DocEntry) AS NumberOfSalesOrders
    FROM ORDR T0
    WHERE ${whereORDR}
      AND T0.CANCELED = 'N';
  `;

  // 4) Quotations + Conversion Rate
  const quotationsQuery = `
    WITH TotalQuotations AS (
      SELECT COUNT(DISTINCT T0.DocEntry) AS Total
      FROM OQUT T0
      WHERE ${whereOQUT}
        AND T0.CANCELED = 'N'
    ),
    ConvertedQuotations AS (
      SELECT COUNT(DISTINCT O.DocEntry) AS Converted
      FROM ORDR O
      INNER JOIN OQUT Q ON O.DocNum = Q.DocNum
      WHERE ${whereORDR_AsO}
        AND ${whereOQUT_AsQ}
        AND O.CANCELED = 'N'
        AND Q.CANCELED = 'N'
    )
    SELECT 
      CASE 
        WHEN TQ.Total > 0 
          THEN CAST(ROUND(CAST(CQ.Converted AS FLOAT) * 100.0 / TQ.Total, 2) AS DECIMAL(5,2))
          ELSE 0 
      END AS ConversionRate
    FROM TotalQuotations TQ
    CROSS JOIN ConvertedQuotations CQ;
  `;

  try {
    // Execute queries concurrently
    const [
      salesResult,
      outstandingResult,
      ordersResult,
      quotationsResult,
    ] = await Promise.all([
      queryDatabase(salesQuery),
      queryDatabase(outstandingQuery),
      queryDatabase(ordersQuery),
      queryDatabase(quotationsQuery),
    ]);

    // Consolidate results
    return {
      totalSales: salesResult[0]?.TotalSales || 0,
      numberOfSalesOrders: ordersResult[0]?.NumberOfSalesOrders || 0,
      outstandingInvoices: {
        count: outstandingResult[0]?.NumberOfOutstandingInvoices || 0,
        amount: outstandingResult[0]?.TotalOutstandingAmount || 0,
      },
      quotationConversionRate: quotationsResult[0]?.ConversionRate || 0,
    };
  } catch (error) {
    console.error("Error in getSalesMetrics:", error);
    throw error;
  }
}

// Helper function for building WHERE clause
function buildWhereClause(alias, { startDate, endDate }) {
  const conditions = [];

  // Date range filter - handle dates more flexibly
  if (startDate || endDate) {
    if (startDate && !endDate) {
      conditions.push(`CONVERT(DATE, ${alias}.DocDate) >= '${startDate}'`);
    } else if (!startDate && endDate) {
      conditions.push(`CONVERT(DATE, ${alias}.DocDate) <= '${endDate}'`);
    } else {
      conditions.push(
        `CONVERT(DATE, ${alias}.DocDate) BETWEEN '${startDate}' AND '${endDate}'`
      );
    }
  } else {
    // Default to today if no dates provided
    conditions.push(
      `CONVERT(DATE, ${alias}.DocDate) = CONVERT(DATE, GETDATE())`
    );
  }

  return conditions.join(" AND ");
}

