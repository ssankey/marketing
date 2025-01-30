import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../db";


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

