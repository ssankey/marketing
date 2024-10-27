// lib/models/dashboard.js
import { queryDatabase } from '../db';

// Query for Monthly Sales and COGS
export async function getMonthlySalesAndCOGS() {
  const query = `
    SELECT 
      DATENAME(MONTH, T0.DocDate) AS [Month], 
      SUM(T1.LineTotal) AS [Sales], 
      SUM(T1.GrossBuyPr * T1.Quantity) AS [COGS]
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    WHERE T0.DocDate BETWEEN DATEADD(MONTH, -12, GETDATE()) AND GETDATE()
    GROUP BY DATENAME(MONTH, T0.DocDate), MONTH(T0.DocDate)
    ORDER BY MONTH(T0.DocDate);
  `;
  return await queryDatabase(query);
}

// Query for Top 10 Customers by Sales
export async function getTopCustomers() {
    try {
        // Fetch distinct month-year data
        const monthData = await queryDatabase(`
            SELECT DISTINCT 
              DATENAME(month, T0.DocDate) + '-' + CAST(YEAR(T0.DocDate) AS VARCHAR(4)) AS MonthYear
            FROM OINV T0
            INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry;
        `);

        // Check if monthData has content
        if (!monthData || monthData.length === 0) {
            throw new Error("No month data found.");
        }

        // Extract month names into an array
        const months = monthData.map(row => `[${row.MonthYear}]`);

        // Join month columns for the SQL statement
        const monthColumns = months.join(', ');

        // Build the dynamic SQL query
        const query = `
    SELECT TOP 5 Customer, ${monthColumns}, GrandTotal FROM (
      SELECT 
        T0.CardName AS Customer,
        DATENAME(month, T0.DocDate) + '-' + CAST(YEAR(T0.DocDate) AS VARCHAR(4)) AS MonthYear,
        T1.LineTotal
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
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
        WHERE T0.CardName = PivotTable.Customer
      ) AS SubTotal
    ) AS Total
    ORDER BY GrandTotal DESC;
`;


        // Execute the dynamic query
        const results = await queryDatabase(query);
        console.log(results);
        
        return results; // Return the query results
    } catch (error) {
        console.error("Error fetching top customers:", error);
        throw error; // Re-throw the error to handle it upstream
    }
}


// Query for Top 10 Categories by Performance
// Query for Top Categories by Monthly Performance
export async function getTopCategoriesMonthly() {
  try {
      // Fetch distinct month-year data
      const monthData = await queryDatabase(`
          SELECT DISTINCT 
            DATENAME(month, T0.DocDate) + '-' + CAST(YEAR(T0.DocDate) AS VARCHAR(4)) AS MonthYear
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      `);

      // Check if monthData has content
      if (!monthData || monthData.length === 0) {
          throw new Error("No month data found.");
      }

      // Extract month names into an array
      const months = monthData.map(row => `[${row.MonthYear}]`);

      // Join month columns for the SQL statement
      const monthColumns = months.join(', ');

      // Build the dynamic SQL query
      const query = `
          SELECT TOP 10 Category, ${monthColumns}, GrandTotal FROM (
              SELECT 
                  T4.ItmsGrpNam AS Category,
                  DATENAME(month, T0.DocDate) + '-' + CAST(YEAR(T0.DocDate) AS VARCHAR(4)) AS MonthYear,
                  T1.LineTotal
              FROM OINV T0
              INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
              LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
              LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
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
                  LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
                  LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
                  WHERE T4.ItmsGrpNam = PivotTable.Category
              ) AS SubTotal
          ) AS Total
          ORDER BY GrandTotal DESC;
      `;

      // Execute the dynamic query
      const results = await queryDatabase(query);
      console.log(results);

      return results; // Return the query results
  } catch (error) {
      console.error("Error fetching top categories:", error);
      throw error; // Re-throw the error to handle it upstream
  }
}


// Query for Total Open Orders
export async function getTotalOpenOrders() {
  const query = `
    SELECT COUNT(*) AS TotalOpenOrders 
    FROM ORDR 
    WHERE DocStatus = 'O';
  `;
  return await queryDatabase(query);
}
