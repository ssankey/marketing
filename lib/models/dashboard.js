// lib/models/dashboard.js
import { queryDatabase } from '../db';

// Query for Monthly Sales and COGS
export async function getMonthlySalesAndCOGS({ month, year, region, customer } = {}) {
  let whereClauses = [];


  // Date filters
  if (month) {
    whereClauses.push(`MONTH(T0.DocDate) = ${month}`);
  }
  if (year) {
    whereClauses.push(`YEAR(T0.DocDate) = ${year}`);
  }

  // Region filter
  if (region) {
    whereClauses.push(`T2.Region = '${region}'`);
  }

  if (customer) {
    whereClauses.push(`T0.CardCode = '${customer}'`);
  }

  // Build the WHERE clause
  let whereClause = '';
  if (whereClauses.length > 0) {
    whereClause = 'WHERE ' + whereClauses.join(' AND ');
  } else {
    // Default to last 12 months if no date filters are provided
    whereClause = 'WHERE T0.DocDate BETWEEN DATEADD(MONTH, -12, GETDATE()) AND GETDATE()';
  }

  const query = `
    SELECT 
      DATENAME(MONTH, T0.DocDate) AS [Month], 
      SUM(T1.LineTotal) AS [Sales], 
      SUM(T1.GrossBuyPr * T1.Quantity) AS [COGS]
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
    ${whereClause}
    GROUP BY DATENAME(MONTH, T0.DocDate), MONTH(T0.DocDate)
    HAVING 
      SUM(T1.LineTotal) <> 0 OR
      SUM(T1.GrossBuyPr * T1.Quantity) <> 0
    ORDER BY MONTH(T0.DocDate);
  `;
  return await queryDatabase(query);
}



// Query for Top 10 Customers by Sales
export async function getTopCustomers({ month, year, region, customer } = {}) {
  try {
    // Build WHERE clause
    let whereClauses = [];
    if (month) whereClauses.push(`MONTH(T0.DocDate) = ${month}`);
    if (year) whereClauses.push(`YEAR(T0.DocDate) = ${year}`);
    if (region) whereClauses.push(`T2.Region = '${region}'`);
    if (customer) whereClauses.push(`T0.CardCode = '${customer}'`);

    let whereClause = '';
    if (whereClauses.length > 0) {
      whereClause = 'WHERE ' + whereClauses.join(' AND ');
    }

    // Fetch distinct month-year data with filters
    const monthDataQuery = `
      SELECT DISTINCT 
        DATENAME(month, T0.DocDate) + '-' + CAST(YEAR(T0.DocDate) AS VARCHAR(4)) AS MonthYear
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
      ${whereClause}
    `;
    const monthData = await queryDatabase(monthDataQuery);

    if (!monthData || monthData.length === 0) {
      return [];
    }

    const months = monthData.map(row => `[${row.MonthYear}]`);
    const monthColumns = months.join(', ');

    const query = `
      SELECT TOP 5 Customer, ${monthColumns}, GrandTotal FROM (
        SELECT 
          T0.CardName AS Customer,
          DATENAME(month, T0.DocDate) + '-' + CAST(YEAR(T0.DocDate) AS VARCHAR(4)) AS MonthYear,
          T1.LineTotal
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
        WHERE T1.LineTotal <> 0
        ${whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : ''}
      ) AS SourceTable
      PIVOT (
        SUM(LineTotal)
        FOR MonthYear IN (${monthColumns})
      ) AS PivotTable
      CROSS APPLY (
        SELECT SUM(LineTotal) AS GrandTotal
        FROM (
          SELECT T1.LineTotal
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
          WHERE T0.CardName = PivotTable.Customer
          AND T1.LineTotal <> 0
          ${whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : ''}
        ) AS SubTotal
      ) AS Total
      WHERE GrandTotal <> 0
      ORDER BY GrandTotal DESC;
    `;

    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error('Error fetching top customers:', error);
    throw error;
  }
}


// Query for Top 10 Categories by Performance
export async function getTopCategoriesMonthly({ month, year, region, customer } = {}) {
  try {
    // Build WHERE clause
    let whereClauses = [];
    if (month) whereClauses.push(`MONTH(T0.DocDate) = ${month}`);
    if (year) whereClauses.push(`YEAR(T0.DocDate) = ${year}`);
    if (region) whereClauses.push(`T2.Region = '${region}'`);
    if (customer) whereClauses.push(`T0.CardCode = '${customer}'`);

    let whereClause = '';
    if (whereClauses.length > 0) {
      whereClause = 'WHERE ' + whereClauses.join(' AND ');
    }

    // Fetch distinct month-year data with filters
    const monthDataQuery = `
      SELECT DISTINCT 
        DATENAME(month, T0.DocDate) + '-' + CAST(YEAR(T0.DocDate) AS VARCHAR(4)) AS MonthYear
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
      ${whereClause}
    `;
    const monthData = await queryDatabase(monthDataQuery);

    if (!monthData || monthData.length === 0) {
      return [];
    }

    const months = monthData.map(row => `[${row.MonthYear}]`);
    const monthColumns = months.join(', ');

    const query = `
      SELECT TOP 10 Category, ${monthColumns}, GrandTotal FROM (
        SELECT 
          T4.ItmsGrpNam AS Category,
          DATENAME(month, T0.DocDate) + '-' + CAST(YEAR(T0.DocDate) AS VARCHAR(4)) AS MonthYear,
          T1.LineTotal
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
        LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
        LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
        WHERE T1.LineTotal <> 0
        ${whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : ''}
      ) AS SourceTable
      PIVOT (
        SUM(LineTotal)
        FOR MonthYear IN (${monthColumns})
      ) AS PivotTable
      CROSS APPLY (
        SELECT SUM(LineTotal) AS GrandTotal
        FROM (
          SELECT T1.LineTotal
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
          LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
          LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
          WHERE T4.ItmsGrpNam = PivotTable.Category
          AND T1.LineTotal <> 0
          ${whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : ''}
        ) AS SubTotal
      ) AS Total
      WHERE GrandTotal <> 0
      ORDER BY GrandTotal DESC;
    `;
    console.log(query);
    

    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error('Error fetching top categories:', error);
    throw error;
  }
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
