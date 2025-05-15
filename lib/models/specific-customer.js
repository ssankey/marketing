

import sql from "mssql";
import { queryDatabase } from "../db";

export async function getCustomerPurchaseAndRevenue(customerCode, salesPerson = null) {
  try {
    console.log("Model function called with params:", { customerCode, salesPerson });
    
    // Base query with optional salesPerson filter
    let query = `
      WITH MonthlyData AS (
        SELECT 
          YEAR(OINV.DocDate) AS Year,
          MONTH(OINV.DocDate) AS Month,
          COUNT(INV1.DocEntry) AS NoOfPurchase,
          SUM(INV1.LineTotal) AS AmountSpend
        FROM 
          OINV
          JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        WHERE 
          OINV.CardCode = @CardCode
          AND OINV.CANCELED = 'N'
    `;

    // Add salesPerson filter if provided
    if (salesPerson) {
      // Check if salesPerson is numerical only or has a prefix/format
      const salesPersonValue = salesPerson.toString().trim();
      console.log("Filtering by salesPerson:", salesPersonValue);
      
      query += `
          AND OINV.SlpCode = @SlpCode
      `;
    }

    // Close the query
    query += `
        GROUP BY 
          YEAR(OINV.DocDate), MONTH(OINV.DocDate)
      )
      SELECT 
        md.Year AS Year,
        md.Month AS Month,
        md.NoOfPurchase AS NoOfPurchase,
        md.AmountSpend AS AmountSpend
      FROM 
        MonthlyData md
      ORDER BY 
        md.Year, md.Month;
    `;

    // Setup parameters
    const params = [
      { name: "CardCode", type: sql.NVarChar, value: customerCode },
    ];

    // Add salesPerson parameter if provided
    if (salesPerson) {
      params.push({ name: "SlpCode", type: sql.Int, value: parseInt(salesPerson, 10) });
    }
    
    console.log("Query params:", params);
    const data = await queryDatabase(query, params);
    console.log(`Retrieved ${data.length} records from database`);

    // Format the data to include a Date field for easier frontend processing
    const formattedData = data.map((row) => ({
      Date: new Date(row.Year, row.Month - 1), // JavaScript months are 0-based
      AmountSpend: row.AmountSpend,
      NoOfPurchase: row.NoOfPurchase,
    }));

    return formattedData;
  } catch (error) {
    console.error("Error fetching customer purchase and revenue data:", error);
    throw new Error("Failed to fetch customer metrics");
  }
}