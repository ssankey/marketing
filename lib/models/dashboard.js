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
export async function getTopCustomers({ startDate, endDate, region, customer } = {}) {
  let whereClauses = [];

  // Date filters
  if (startDate && endDate) {
    whereClauses.push(`T0.DocDate BETWEEN '${startDate}' AND '${endDate}'`);
  } else {
    whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
  }

  if (region) whereClauses.push(`T2.Region = '${region}'`);
  if (customer) whereClauses.push(`T0.CardCode = '${customer}'`);
  whereClauses.push(`T1.LineTotal <> 0`);

  const whereClause = 'WHERE ' + whereClauses.join(' AND ');

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
export async function getTopCategories({ startDate, endDate, region, customer } = {}) {
  let whereClauses = [];

  // Date filters
  if (startDate && endDate) {
    whereClauses.push(`T0.DocDate BETWEEN '${startDate}' AND '${endDate}'`);
  } else {
    whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
  }

  if (region) whereClauses.push(`T2.Region = '${region}'`);
  if (customer) whereClauses.push(`T0.CardCode = '${customer}'`);
  whereClauses.push(`T1.LineTotal <> 0`);

  const whereClause = 'WHERE ' + whereClauses.join(' AND ');

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
