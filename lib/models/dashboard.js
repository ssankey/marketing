  // lib/models/dashboard.js
  import { verify } from 'jsonwebtoken';
  import sql from 'mssql';
  import { queryDatabase } from '../db';


  // Query for Monthly Sales and COGS
  // Update function name and parameters
  export async function getSalesAndCOGS() {
    const query = `
      SELECT 
        FORMAT(T0.DocDate, 'MMM yyyy') as month,
        SUM(T1.LineTotal) as sales,
        SUM(T1.GrossBuyPr * T1.Quantity) as cogs,
        SUM(T1.LineTotal - (T1.GrossBuyPr * T1.Quantity)) as grossMargin
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
      WHERE T1.LineTotal <> 0
      GROUP BY FORMAT(T0.DocDate, 'MMM yyyy')
      ORDER BY MIN(T0.DocDate) 
    `;

    const results = await queryDatabase(query);

    // Transform results to match expected format
    return results.map((row) => ({
      month: row.month,
      sales: parseFloat(row.sales) || 0,
      cogs: parseFloat(row.cogs) || 0,
      grossMargin: parseFloat(row.grossMargin) || 0,
    }));
  }

  // Query for Top 10 Customers by Sales
  export async function getTopCustomers({ dateFilter, startDate, endDate, region, customer } = {}) {
    let whereClauses = [];
    console.log(dateFilter);
    
    // Handle date filtering
    if (startDate && endDate) {
      // If explicit dates are provided, use them
      whereClauses.push(`T0.DocDate BETWEEN '${startDate}' AND '${endDate}'`);
    } else if (dateFilter === 'allTime') {
      // For allTime, we don't add any date restrictions to get all historical data
    } else {
      // If dateFilter is provided, use predefined date ranges
      const dateFilterClause = getDateFilter(dateFilter);
      if (dateFilterClause) {
        whereClauses.push(dateFilterClause);
      } else {
        // Default to today if no date parameters are provided
        whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
      }
    }

    // Add other filters
    whereClauses.push(`T1.LineTotal <> 0`);

    // Add region filter if provided
    if (region) {
      whereClauses.push(`T2.Region = '${region}'`);
    }

    // Add specific customer filter if provided
    if (customer) {
      whereClauses.push(`T0.CardCode = '${customer}'`);
    }

    // Only add WHERE clause if there are conditions to apply
    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    console.log('Generated WHERE clause:', whereClause);
    
    const query = `
      SELECT TOP 10 
        T0.CardName AS Customer, 
        SUM(T1.LineTotal) AS Sales
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
      ${whereClause}
      GROUP BY T0.CardName
      ORDER BY Sales DESC;
    `;
    const results = await queryDatabase(query);
    return results;
  }

  // Query for Top 10 Categories by Performance
  export async function getTopCategories({ dateFilter, startDate, endDate, region, customer } = {}) {
    let whereClauses = [];
    console.log(dateFilter);

    // Handle date filtering
    if (startDate && endDate) {
      // If explicit dates are provided, use them
      whereClauses.push(`T0.DocDate BETWEEN '${startDate}' AND '${endDate}'`);
    } else if (dateFilter === 'allTime') {
      // For allTime, we don't add any date restrictions to get all historical data
    } else {
      // If dateFilter is provided, use predefined date ranges
      const dateFilterClause = getDateFilter(dateFilter);
      if (dateFilterClause) {
        whereClauses.push(dateFilterClause);
      } else {
        // Default to today if no date parameters are provided
        whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
      }
    }

    // Add other filters
    whereClauses.push(`T1.LineTotal <> 0`);

    // Add region filter if provided
    if (region) {
      whereClauses.push(`T2.Region = '${region}'`);
    }

    // Add specific customer filter if provided
    if (customer) {
      whereClauses.push(`T0.CardCode = '${customer}'`);
    }

    // Only add WHERE clause if there are conditions to apply
    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    console.log('Generated WHERE clause:', whereClause);

    const query = `
      SELECT TOP 10 
        T4.ItmsGrpNam AS Category, 
        SUM(T1.LineTotal) AS Sales
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
      LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
      LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      ${whereClause}
      GROUP BY T4.ItmsGrpNam
      ORDER BY Sales DESC;
    `;
    const results = await queryDatabase(query);
    console.log(query);
    
    console.log('Query results:', results);
    
    return results;
  }


  // Query for Total Open Orders
  export async function getTotalOpenOrders({ region, customer } = {}) {
    let whereClauses = [`T0.DocStatus = 'O'`, `T1.LineTotal <> 0`];

    if (region) {
      whereClauses.push(`T2.Region = '${region}'`);
    }
    if (customer) {
      whereClauses.push(`T0.CardCode = '${customer}'`);
    }

    const whereClause = "WHERE " + whereClauses.join(" AND ");

    const query = `
      SELECT COUNT(DISTINCT T0.DocEntry) AS TotalOpenOrders 
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
      ${whereClause};
    `;
    return await queryDatabase(query);
  }
  // Function to fetch order statistics
  export async function getOrderStatistics({ region, customer } = {}) {
    let whereClauses = [`T1.LineTotal <> 0`]; // Common condition for all orders

    if (region) {
      whereClauses.push(`T2.Region = '${region}'`);
    }
    if (customer) {
      whereClauses.push(`T0.CardCode = '${customer}'`);
    }

    const whereClause = "WHERE " + whereClauses.join(" AND ");

    const query = `
      SELECT 
        COUNT(DISTINCT T0.DocEntry) AS TotalIncomingOrders,
        COUNT(DISTINCT CASE WHEN T0.DocStatus = 'O' THEN T0.DocEntry END) AS TotalOpenOrders,
        COUNT(DISTINCT CASE 
          WHEN T0.DocStatus = 'O' AND T3.OnHand >= T1.Quantity THEN T0.DocEntry 
        END) AS TotalInStockOrders
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
      INNER JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
      ${whereClause};
    `;

    const result = await queryDatabase(query);
    return result[0]; // Assuming result is an array with one row containing the counts
  }

  // Function to get available months, years, and regions
  export async function getAvailableFilters({ month, year } = {}) {
    try {
      // Build WHERE clause for months (exclude 'month' filter)
      let whereClausesForMonths = ["T1.LineTotal <> 0"];
      if (year) whereClausesForMonths.push(`YEAR(T0.DocDate) = ${year}`);
      const whereClauseForMonths =
        whereClausesForMonths.length > 0
          ? "WHERE " + whereClausesForMonths.join(" AND ")
          : "";

      const monthsQuery = `
        SELECT DISTINCT 
          MONTH(T0.DocDate) AS Month
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        ${whereClauseForMonths}
      `;
      const monthsResults = await queryDatabase(monthsQuery);
      const monthsSet = new Set();
      monthsResults.forEach((row) => {
        if (row.Month != null) monthsSet.add(row.Month);
      });
      const months = Array.from(monthsSet).sort((a, b) => a - b);

      // Build WHERE clause for years (exclude 'year' filter)
      let whereClausesForYears = ["T1.LineTotal <> 0"];
      if (month) whereClausesForYears.push(`MONTH(T0.DocDate) = ${month}`);
      const whereClauseForYears =
        whereClausesForYears.length > 0
          ? "WHERE " + whereClausesForYears.join(" AND ")
          : "";

      const yearsQuery = `
        SELECT DISTINCT 
          YEAR(T0.DocDate) AS Year
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        ${whereClauseForYears}
      `;
      const yearsResults = await queryDatabase(yearsQuery);
      const yearsSet = new Set();
      yearsResults.forEach((row) => {
        if (row.Year != null) yearsSet.add(row.Year);
      });
      const years = Array.from(yearsSet).sort((a, b) => a - b);

      let whereClausesForCustomers = ["T1.LineTotal <> 0"];
      if (month) whereClausesForCustomers.push(`MONTH(T0.DocDate) = ${month}`);
      if (year) whereClausesForCustomers.push(`YEAR(T0.DocDate) = ${year}`);

      const whereClauseForCustomers =
        whereClausesForCustomers.length > 0
          ? "WHERE " + whereClausesForCustomers.join(" AND ")
          : "";

      const customersQuery = `
        SELECT DISTINCT 
          T0.CardCode AS CustomerCode,
          T0.CardName AS CustomerName
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        ${whereClauseForCustomers}
      `;

      const customersResults = await queryDatabase(customersQuery);
      const customers = customersResults.map((row) => ({
        code: row.CustomerCode,
        name: row.CustomerName,
      }));

      return {
        months,
        years,
        customers,
      };
    } catch (error) {
      console.error("Error fetching available filters:", error);
      throw error;
    }
  }


export function buildWhereClause(
  alias = "T0",
  {
    startDate,
    endDate,
    cardCodes = [],
    contactCodes = [],
    isAdmin = false,
    region,
    customer,
    salesPerson,
    salesCategory,
  }
) {
  const clauses = ["1=1"];

  // 📅 Date range filter
  if (startDate) clauses.push(`${alias}.DocDate >= '${startDate}'`);
  if (endDate) clauses.push(`${alias}.DocDate <= '${endDate}'`);

  // 👤 Salesperson/customer access control
  if (!isAdmin) {
    if (contactCodes.length > 0) {
      clauses.push(
        `${alias}.SlpCode IN (${contactCodes.map((c) => `'${c}'`).join(",")})`
      );
    } else if (cardCodes.length > 0) {
      clauses.push(
        `${alias}.CardCode IN (${cardCodes.map((c) => `'${c}'`).join(",")})`
      );
    }
  }

  // 🌎 Region (if applicable — assuming region maps to `Region` field)
  if (region) {
    clauses.push(`${alias}.Region = '${region}'`);
  }

  // 🧍 Specific customer filter
  if (customer) {
    clauses.push(`${alias}.CardCode = '${customer}'`);
  }

  // 👨‍💼 Specific salesperson filter
  if (salesPerson) {
    clauses.push(`${alias}.SlpCode = '${salesPerson}'`);
  }

  // 🧩 Sales category (assuming a UDF or custom field like U_Category)
  if (salesCategory) {
    clauses.push(`${alias}.U_Category = '${salesCategory}'`);
  }

  return clauses.join(" AND ");
}


// export async function getSalesMetrics({
//   startDate,
//   endDate,
//   token,
//   region,
//   customer,
//   salesPerson,
//   salesCategory,
// }) {
//   let decoded;
//   let isAdmin;
//   let cardCodes = [];
//   let contactCodes = [];

//   if (token) {
//     try {
//       decoded = verify(token, process.env.JWT_SECRET);
//       isAdmin = decoded.role === "admin";
//       cardCodes = decoded.cardCodes || [];
//       contactCodes = decoded.contactCodes || [];
//     } catch (verifyError) {
//       throw new Error("Token verification failed: " + verifyError.message);
//     }
//   } else {
//     throw new Error("Authentication token required.");
//   }

//   if (!isAdmin && cardCodes.length === 0 && contactCodes.length === 0) {
//     throw new Error("No access codes available for this user.");
//   }

//   const params = {
//     startDate,
//     endDate,
//     cardCodes,
//     contactCodes,
//     isAdmin,
//     region,
//     customer,
//     salesPerson,
//     salesCategory,
//   };

//   const whereOINV = buildWhereClause("T0", params);
//   const whereORDR = buildWhereClause("T0", params);
//   const whereOQUT = buildWhereClause("T0", params);
//   const whereO = buildWhereClause("O", params);
//   const whereQ = buildWhereClause("Q", params);

//   const salesQuery = `
//     SELECT SUM(T1.LineTotal) AS TotalSales
//     FROM OINV T0
//     INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//     WHERE ${whereOINV} AND T0.CANCELED = 'N';
//   `;

//   const outstandingQuery = `
//     SELECT COUNT(DISTINCT T0.DocEntry) AS NumberOfOutstandingInvoices,
//            SUM(T0.DocTotal - T0.PaidToDate) AS TotalOutstandingAmount
//     FROM OINV T0
//     WHERE ${whereOINV} AND T0.CANCELED = 'N' AND T0.DocTotal > T0.PaidToDate;
//   `;

//   const ordersQuery = `
//     SELECT COUNT(DISTINCT T0.DocEntry) AS NumberOfSalesOrders
//     FROM ORDR T0
//     WHERE ${whereORDR} AND T0.CANCELED = 'N';
//   `;

//   const quotationsQuery = `
//     WITH TotalQuotations AS (
//       SELECT COUNT(DISTINCT T0.DocEntry) AS Total
//       FROM OQUT T0
//       WHERE ${whereOQUT} AND T0.CANCELED = 'N'
//     ),
//     ConvertedQuotations AS (
//       SELECT COUNT(DISTINCT O.DocEntry) AS Converted
//       FROM ORDR O
//       INNER JOIN OQUT Q ON O.DocNum = Q.DocNum
//       WHERE ${whereO} AND ${whereQ} AND O.CANCELED = 'N' AND Q.CANCELED = 'N'
//     )
//     SELECT 
//       CASE 
//         WHEN TQ.Total > 0 THEN CAST(ROUND(CAST(CQ.Converted AS FLOAT) * 100.0 / TQ.Total, 2) AS DECIMAL(5,2))
//         ELSE 0 
//       END AS ConversionRate
//     FROM TotalQuotations TQ
//     CROSS JOIN ConvertedQuotations CQ;
//   `;

//   const monthlyMetricsQuery = `
//     SELECT 
//       DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [MonthYear],
//       SUM(CASE WHEN T1.InvQty = 0 OR T4.Quantity IS NULL THEN T1.LineTotal ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity) END) AS TotalSales,
//       SUM(T1.GrossBuyPr * T4.Quantity) AS TotalCOGS,
//       CASE 
//         WHEN SUM(CASE WHEN T1.InvQty = 0 OR T4.Quantity IS NULL THEN T1.LineTotal ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity) END) = 0 THEN 0
//         ELSE (
//           (
//             SUM(CASE WHEN T1.InvQty = 0 OR T4.Quantity IS NULL THEN T1.LineTotal ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity) END)
//             - SUM(T1.GrossBuyPr * T4.Quantity)
//           ) * 100.0
//           / SUM(CASE WHEN T1.InvQty = 0 OR T4.Quantity IS NULL THEN T1.LineTotal ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity) END)
//         )
//       END AS GrossMarginPct
//     FROM OINV T0  
//     INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry 
//     LEFT JOIN DLN1 T2 ON T2.ItemCode = T1.ItemCode AND T2.DocEntry = T1.BaseEntry AND T1.BaseType = 15 AND T1.BaseLine = T2.LineNum
//     LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
//     LEFT JOIN IBT1 T4 ON T4.BsDocType = 17 AND T4.CardCode = T3.CardCode AND T4.ItemCode = T2.ItemCode AND T4.BaseNum = T3.DocNum
//                       AND T4.BaseEntry = T3.DocEntry AND T4.BaseType = 15 AND T4.BaseLinNum = T2.LineNum AND T4.Direction = 1
//     WHERE ${whereOINV} AND T0.CANCELED = 'N'
//     GROUP BY DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2)
//     ORDER BY MIN(T0.DocDate);
//   `;

//   try {
//     const [
//       salesResult,
//       outstandingResult,
//       ordersResult,
//       quotationsResult,
//       monthlyMetricsResult,
//     ] = await Promise.all([
//       queryDatabase(salesQuery),
//       queryDatabase(outstandingQuery),
//       queryDatabase(ordersQuery),
//       queryDatabase(quotationsQuery),
//       queryDatabase(monthlyMetricsQuery),
//     ]);

//     return {
//       totalSales: salesResult[0]?.TotalSales || 0,
//       numberOfSalesOrders: ordersResult[0]?.NumberOfSalesOrders || 0,
//       outstandingInvoices: {
//         count: outstandingResult[0]?.NumberOfOutstandingInvoices || 0,
//         amount: outstandingResult[0]?.TotalOutstandingAmount || 0,
//       },
//       quotationConversionRate: quotationsResult[0]?.ConversionRate || 0,
//       monthlyMetrics: monthlyMetricsResult,
//     };
//   } catch (error) {
//     console.error("Error in getSalesMetrics:", error);
//     throw error;
//   }
// }

// lib/models/dashboard.js
// REPLACE your getSalesMetrics function with this:

export async function getSalesMetrics({
  startDate,
  endDate,
  token,
  region,
  customer,
  salesPerson,
  salesCategory,
}) {
  let decoded;
  let isAdmin;
  let cardCodes = [];
  let contactCodes = [];

  if (token) {
    try {
      decoded = verify(token, process.env.JWT_SECRET);
      isAdmin = decoded.role === "admin";
      cardCodes = decoded.cardCodes || [];
      contactCodes = decoded.contactCodes || [];
    } catch (verifyError) {
      throw new Error("Token verification failed: " + verifyError.message);
    }
  } else {
    throw new Error("Authentication token required.");
  }

  if (!isAdmin && cardCodes.length === 0 && contactCodes.length === 0) {
    throw new Error("No access codes available for this user.");
  }

  const params = {
    startDate,
    endDate,
    cardCodes,
    contactCodes,
    isAdmin,
    region,
    customer,
    salesPerson,
    salesCategory,
  };

  const whereOINV = buildWhereClause("T0", params);
  const whereORDR = buildWhereClause("T0", params);
  const whereOQUT = buildWhereClause("T0", params);
  const whereO = buildWhereClause("O", params);
  const whereQ = buildWhereClause("Q", params);

  const salesQuery = `
    SELECT SUM(T1.LineTotal) AS TotalSales
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    WHERE ${whereOINV} AND T0.CANCELED = 'N';
  `;

  const outstandingQuery = `
    SELECT COUNT(DISTINCT T0.DocEntry) AS NumberOfOutstandingInvoices,
           SUM(T0.DocTotal - T0.PaidToDate) AS TotalOutstandingAmount
    FROM OINV T0
    WHERE ${whereOINV} AND T0.CANCELED = 'N' AND T0.DocTotal > T0.PaidToDate;
  `;

  const ordersQuery = `
    SELECT COUNT(DISTINCT T0.DocEntry) AS NumberOfSalesOrders
    FROM ORDR T0
    WHERE ${whereORDR} AND T0.CANCELED = 'N';
  `;

  // ✅ NEW: Total Order Value Query (replaces quotationsQuery)
  const orderValueQuery = `
    SELECT SUM(T0.DocTotal - T0.VatSum) AS TotalOrderValue
    FROM ORDR T0
    WHERE ${whereORDR} AND T0.CANCELED = 'N'
  `;

  // ❌ REMOVED: quotationsQuery
  /*
  const quotationsQuery = `
    WITH TotalQuotations AS (
      SELECT COUNT(DISTINCT T0.DocEntry) AS Total
      FROM OQUT T0
      WHERE ${whereOQUT} AND T0.CANCELED = 'N'
    ),
    ConvertedQuotations AS (
      SELECT COUNT(DISTINCT O.DocEntry) AS Converted
      FROM ORDR O
      INNER JOIN OQUT Q ON O.DocNum = Q.DocNum
      WHERE ${whereO} AND ${whereQ} AND O.CANCELED = 'N' AND Q.CANCELED = 'N'
    )
    SELECT 
      CASE 
        WHEN TQ.Total > 0 THEN CAST(ROUND(CAST(CQ.Converted AS FLOAT) * 100.0 / TQ.Total, 2) AS DECIMAL(5,2))
        ELSE 0 
      END AS ConversionRate
    FROM TotalQuotations TQ
    CROSS JOIN ConvertedQuotations CQ;
  `;
  */

  const monthlyMetricsQuery = `
    SELECT 
      DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [MonthYear],
      SUM(CASE WHEN T1.InvQty = 0 OR T4.Quantity IS NULL THEN T1.LineTotal ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity) END) AS TotalSales,
      SUM(T1.GrossBuyPr * T4.Quantity) AS TotalCOGS,
      CASE 
        WHEN SUM(CASE WHEN T1.InvQty = 0 OR T4.Quantity IS NULL THEN T1.LineTotal ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity) END) = 0 THEN 0
        ELSE (
          (
            SUM(CASE WHEN T1.InvQty = 0 OR T4.Quantity IS NULL THEN T1.LineTotal ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity) END)
            - SUM(T1.GrossBuyPr * T4.Quantity)
          ) * 100.0
          / SUM(CASE WHEN T1.InvQty = 0 OR T4.Quantity IS NULL THEN T1.LineTotal ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity) END)
        )
      END AS GrossMarginPct
    FROM OINV T0  
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry 
    LEFT JOIN DLN1 T2 ON T2.ItemCode = T1.ItemCode AND T2.DocEntry = T1.BaseEntry AND T1.BaseType = 15 AND T1.BaseLine = T2.LineNum
    LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
    LEFT JOIN IBT1 T4 ON T4.BsDocType = 17 AND T4.CardCode = T3.CardCode AND T4.ItemCode = T2.ItemCode AND T4.BaseNum = T3.DocNum
                      AND T4.BaseEntry = T3.DocEntry AND T4.BaseType = 15 AND T4.BaseLinNum = T2.LineNum AND T4.Direction = 1
    WHERE ${whereOINV} AND T0.CANCELED = 'N'
    GROUP BY DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2)
    ORDER BY MIN(T0.DocDate);
  `;

  try {
    // ✅ UPDATED: Replace quotationsResult with orderValueResult
    const [
      salesResult,
      outstandingResult,
      ordersResult,
      orderValueResult, // ← CHANGED from quotationsResult
      monthlyMetricsResult,
    ] = await Promise.all([
      queryDatabase(salesQuery),
      queryDatabase(outstandingQuery),
      queryDatabase(ordersQuery),
      queryDatabase(orderValueQuery), // ← CHANGED from quotationsQuery
      queryDatabase(monthlyMetricsQuery),
    ]);

    // ✅ UPDATED: Return totalOrderValue instead of quotationConversionRate
    return {
      totalSales: salesResult[0]?.TotalSales || 0,
      numberOfSalesOrders: ordersResult[0]?.NumberOfSalesOrders || 0,
      totalOrderValue: orderValueResult[0]?.TotalOrderValue || 0, // ← NEW
      outstandingInvoices: {
        count: outstandingResult[0]?.NumberOfOutstandingInvoices || 0,
        amount: outstandingResult[0]?.TotalOutstandingAmount || 0,
      },
      // quotationConversionRate: quotationsResult[0]?.ConversionRate || 0, // ← REMOVED
      monthlyMetrics: monthlyMetricsResult,
    };
  } catch (error) {
    console.error("Error in getSalesMetrics:", error);
    throw error;
  }
}




  function getDateFilter(dateFilter) {
    switch (dateFilter) {
        case 'today':
            return `CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`;
            
        case 'thisWeek':
            return `T0.DocDate >= DATEADD(DAY, -DATEPART(WEEKDAY, GETDATE()) + 1, CAST(GETDATE() AS DATE)) 
                    AND T0.DocDate < DATEADD(DAY, 8 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE))`;
            
        case 'thisMonth':
            return `T0.DocDate >= DATEADD(DAY, 1, EOMONTH(GETDATE(), -1)) 
                    AND T0.DocDate <= EOMONTH(GETDATE())`;
            
        case 'lastMonth':
            return `T0.DocDate >= DATEADD(MONTH, -1, DATEADD(DAY, 1, EOMONTH(GETDATE(), -1))) 
                    AND T0.DocDate <= DATEADD(DAY, 1, EOMONTH(GETDATE(), -1))`;

        case 'lastWeek':
            return `T0.DocDate >= DATEADD(WEEK, -1, DATEADD(DAY, -DATEPART(WEEKDAY, GETDATE()) + 1, CAST(GETDATE() AS DATE)))
                    AND T0.DocDate < DATEADD(DAY, -DATEPART(WEEKDAY, GETDATE()) + 1, CAST(GETDATE() AS DATE))`;
            
        default:
            return null;
    }
  }
