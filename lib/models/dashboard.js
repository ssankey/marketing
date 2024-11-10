// lib/models/dashboard.js
import { queryDatabase } from '../db';

// Query for Monthly Sales and COGS
// Update function name and parameters
export async function getSalesAndCOGS({ startDate, endDate, region, customer } = {}) {
  let whereClauses = [];

  // Date filters
  if (startDate && endDate) {
    whereClauses.push(`T0.DocDate BETWEEN '${startDate}' AND '${endDate}'`);
  } else {
    // Default to today
    whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
  }

  // Region and Customer filters
  if (region) whereClauses.push(`T2.Region = '${region}'`);
  if (customer) whereClauses.push(`T0.CardCode = '${customer}'`);

  whereClauses.push(`T1.LineTotal <> 0`);

  const whereClause = 'WHERE ' + whereClauses.join(' AND ');

  const query = `
    SELECT 
      SUM(T1.LineTotal) AS Sales, 
      SUM(T1.GrossBuyPr * T1.Quantity) AS COGS
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
    ${whereClause};
  `;
  const results = await queryDatabase(query);
  return results[0] || { Sales: 0, COGS: 0 }; // Return a single object
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
  console.log(query);
  
  console.log('Query results:', results);
  
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

  const whereClause = 'WHERE ' + whereClauses.join(' AND ');

  const query = `
    SELECT COUNT(DISTINCT T0.DocEntry) AS TotalOpenOrders 
    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
    ${whereClause};
  `;
  return await queryDatabase(query);
}

// Function to get available months, years, and regions
export async function getAvailableFilters({ month, year } = {}) {
  try {
    // Build WHERE clause for months (exclude 'month' filter)
    let whereClausesForMonths = ['T1.LineTotal <> 0'];
    if (year) whereClausesForMonths.push(`YEAR(T0.DocDate) = ${year}`);
    const whereClauseForMonths = whereClausesForMonths.length > 0 ? 'WHERE ' + whereClausesForMonths.join(' AND ') : '';

    const monthsQuery = `
      SELECT DISTINCT 
        MONTH(T0.DocDate) AS Month
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      ${whereClauseForMonths}
    `;
    const monthsResults = await queryDatabase(monthsQuery);
    const monthsSet = new Set();
    monthsResults.forEach(row => {
      if (row.Month != null) monthsSet.add(row.Month);
    });
    const months = Array.from(monthsSet).sort((a, b) => a - b);

    // Build WHERE clause for years (exclude 'year' filter)
    let whereClausesForYears = ['T1.LineTotal <> 0'];
    if (month) whereClausesForYears.push(`MONTH(T0.DocDate) = ${month}`);
    const whereClauseForYears = whereClausesForYears.length > 0 ? 'WHERE ' + whereClausesForYears.join(' AND ') : '';

    const yearsQuery = `
      SELECT DISTINCT 
        YEAR(T0.DocDate) AS Year
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      ${whereClauseForYears}
    `;
    const yearsResults = await queryDatabase(yearsQuery);
    const yearsSet = new Set();
    yearsResults.forEach(row => {
      if (row.Year != null) yearsSet.add(row.Year);
    });
    const years = Array.from(yearsSet).sort((a, b) => a - b);

    let whereClausesForCustomers = ['T1.LineTotal <> 0'];
    if (month) whereClausesForCustomers.push(`MONTH(T0.DocDate) = ${month}`);
    if (year) whereClausesForCustomers.push(`YEAR(T0.DocDate) = ${year}`);

    const whereClauseForCustomers = whereClausesForCustomers.length > 0 ? 'WHERE ' + whereClausesForCustomers.join(' AND ') : '';

    const customersQuery = `
      SELECT DISTINCT 
        T0.CardCode AS CustomerCode,
        T0.CardName AS CustomerName
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      ${whereClauseForCustomers}
    `;

    const customersResults = await queryDatabase(customersQuery);
    const customers = customersResults.map(row => ({ code: row.CustomerCode, name: row.CustomerName }));

    return {
      months,
      years,
      customers
    };
  } catch (error) {
    console.error('Error fetching available filters:', error);
    throw error;
  }
}

// Get Total Sales Revenue Today
export async function getTotalSalesRevenue({ startDate, endDate}) {
  // Date filters
  let whereClauses = [];

  if (startDate && endDate) {
    whereClauses.push(`T0.DocDate BETWEEN '${startDate}' AND '${endDate}'`);
  } else {
    // Default to today
    whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
  }
  const whereClause = 'WHERE ' + whereClauses.join(' AND ');
  const query = `
    SELECT 
      SUM(T1.LineTotal) AS TotalSales
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    ${whereClause}

  `;

  const results = await queryDatabase(query);
  return results[0]?.TotalSales || 0;
}

export async function getNumberOfSalesOrders({ startDate, endDate }) {
  let whereClauses = [];

  if (startDate && endDate) {
    whereClauses.push(`CONVERT(DATE, T0.DocDate) BETWEEN '${startDate}' AND '${endDate}'`);
  } else {
    // Default to today
    whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
  }
  
  const whereClause = 'WHERE ' + whereClauses.join(' AND ');

  const query = `
    SELECT 
      COUNT(DISTINCT T0.DocEntry) AS NumberOfSalesOrders
    FROM ORDR T0
    ${whereClause}
  `;
  console.log(query);
  
  const results = await queryDatabase(query);
  return results[0]?.NumberOfSalesOrders || 0;
}

export async function getOutstandingInvoices({ startDate, endDate }) {
  let whereClauses = [];

  if (startDate && endDate) {
    whereClauses.push(`CONVERT(DATE, T0.DocDate) BETWEEN '${startDate}' AND '${endDate}'`);
  } else {
    // Default to today
    whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
  }

  whereClauses.push(`T0.DocTotal > T0.PaidToDate`);

  const whereClause = 'WHERE ' + whereClauses.join(' AND ');

  const query = `
    SELECT 
      COUNT(DISTINCT T0.DocEntry) AS NumberOfOutstandingInvoices,
      SUM(T0.DocTotal - T0.PaidToDate) AS TotalOutstandingAmount
    FROM OINV T0
    ${whereClause}
  `;
  console.log(query);
  
  const results = await queryDatabase(query);
  return {
    count: results[0]?.NumberOfOutstandingInvoices || 0,
    amount: results[0]?.TotalOutstandingAmount || 0,
  };
}

export async function getQuotationConversionRate({ startDate, endDate }) {
  let whereClauses = [];

  if (startDate && endDate) {
    whereClauses.push(`CONVERT(DATE, T0.DocDate) BETWEEN '${startDate}' AND '${endDate}'`);
  } else {
    whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
  }

  const whereClause = 'WHERE ' + whereClauses.join(' AND ');

  // Get total quotations
  const totalQuotationsQuery = `
    SELECT 
      COUNT(DISTINCT T0.DocEntry) AS TotalQuotations
    FROM OQUT T0
    ${whereClause}
  `;
  const totalQuotationsResult = await queryDatabase(totalQuotationsQuery);
  const totalQuotations = totalQuotationsResult[0]?.TotalQuotations || 0;

  // Get converted quotations
  const convertedQuotationsQuery = `
    SELECT 
      COUNT(DISTINCT T0.DocEntry) AS ConvertedQuotations
    FROM ORDR T0
    WHERE T0.DocNum IN (
      SELECT T1.DocNum 
      FROM OQUT T1
      ${whereClause.replace('T0.', 'T1.')}
    ) AND ${whereClauses.join(' AND ').replace('T0.', 'T0.')};
  `;
  
  const convertedQuotationsResult = await queryDatabase(convertedQuotationsQuery);
  const convertedQuotations = convertedQuotationsResult[0]?.ConvertedQuotations || 0;

  // Calculate conversion rate
  const conversionRate = totalQuotations > 0 ? (convertedQuotations / totalQuotations) * 100 : 0;
  return conversionRate.toFixed(2); // Return as a percentage with two decimal places
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
