

// pages/api/customers/[id]/aging.js
import sql from "mssql";
import { queryDatabase } from "lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const { salesPerson, product, category } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    // Base query
    let query = `
      SELECT
        SUM(CASE WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 0 AND 30 THEN (T0.Debit - T0.Credit) ELSE 0 END) AS [0-30 Days],
        SUM(CASE WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 31 AND 60 THEN (T0.Debit - T0.Credit) ELSE 0 END) AS [31-60 Days],
        SUM(CASE WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 61 AND 90 THEN (T0.Debit - T0.Credit) ELSE 0 END) AS [61-90 Days],
        SUM(CASE WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) > 90 THEN (T0.Debit - T0.Credit) ELSE 0 END) AS [91+ Days],
        SUM(T0.Debit - T0.Credit) AS [Total Balance]
      FROM JDT1 T0
    `;
    
    // Only add JOINs that are needed based on filters
    if (salesPerson || product || category) {
      query += `
        LEFT JOIN OINV T2 ON T0.TransId = T2.TransId
      `;
    }
    
    if (product || category) {
      query += `
        LEFT JOIN INV1 T12 ON T2.DocEntry = T12.DocEntry
        LEFT JOIN OITM T3 ON T12.ItemCode = T3.ItemCode
      `;
    }
    
    if (category) {
      query += `
        LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      `;
    }
    
    // WHERE clause
    query += `
      WHERE T0.ShortName = @CardCode
        AND T0.DueDate <= GETDATE()
        AND (T0.Debit - T0.Credit) > 0
    `;

    // Add filter conditions
    if (salesPerson) {
      query += ` AND T2.SlpCode = @SlpCode`;
    }

    if (product) {
      query += ` AND T3.ItemCode = @ItemCode`;
    }

    if (category) {
      query += ` AND T4.ItmsGrpNam = @Category`;
    }

    // Setup parameters
    const params = [{ name: "CardCode", type: sql.NVarChar, value: id }];

    if (salesPerson) {
      params.push({
        name: "SlpCode",
        type: sql.Int,
        value: parseInt(salesPerson, 10) || salesPerson
      });
    }

    if (product) {
      params.push({
        name: "ItemCode",
        type: sql.NVarChar,
        value: product
      });
    }

    if (category) {
      params.push({
        name: "Category",
        type: sql.NVarChar,
        value: category
      });
    }

    console.log("Executing query:", query);
    console.log("With parameters:", params);

    const data = await queryDatabase(query, params);

    // If no data returned, return zero values
    if (!data || data.length === 0) {
      return res.status(200).json({
        "0-30 Days": 0,
        "31-60 Days": 0,
        "61-90 Days": 0,
        "91+ Days": 0,
        "Total Balance": 0
      });
    }

    // Return the first row of results
    res.status(200).json(data[0]);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Failed to fetch customer aging data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}