

import sql from "mssql";
import { queryDatabase } from "../db";

export async function getCustomerPurchaseAndRevenue(
  customerCode,
  salesPerson = null
) {
  try {
    console.log("Model function called with params:", {
      customerCode,
      salesPerson,
    });

    // Start building the query with the comprehensive format
    let query = `
      -- Declare input parameters
      DECLARE @CardCode NVARCHAR(20) = @CustomerCode;  -- Using parameter
      DECLARE @SlpCode INT = ${salesPerson ? "@SalesPerson" : "NULL"};  -- Using parameter if provided

      -- 1. Monthly Invoice Summary
      WITH InvoiceData AS (
        SELECT 
          YEAR(I.DocDate) AS Year,
          MONTH(I.DocDate) AS Month,
          COUNT(L.DocEntry) AS InvoiceCount,
          SUM(L.LineTotal) AS InvoiceAmount
        FROM OINV I
        JOIN INV1 L ON I.DocEntry = L.DocEntry
        WHERE I.CardCode = @CardCode
          AND I.CANCELED = 'N'
          AND (@SlpCode IS NULL OR I.SlpCode = @SlpCode)
        GROUP BY YEAR(I.DocDate), MONTH(I.DocDate)
      ),

      -- 2. Base Order Table (filtered just like getOrdersFromDatabase model)
      OrderBase AS (
        SELECT
          O.DocEntry,
          O.DocDate,
          O.DocTotal,
          O.VatSum
        FROM ORDR O
        WHERE 
          O.CANCELED = 'N'
          AND O.CardCode = @CardCode
          AND (@SlpCode IS NULL OR O.SlpCode = @SlpCode)
          AND (
            -- Partial (open with partial invoices)
            (
              O.DocStatus = 'O'
              AND EXISTS (
                SELECT 1 FROM RDR1 T1
                LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17
                LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15
                LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
                WHERE T1.DocEntry = O.DocEntry
                  AND OINV.DocNum IS NOT NULL
                  AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
              )
              AND EXISTS (
                SELECT 1 FROM RDR1 T1
                LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17
                LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15
                LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
                WHERE T1.DocEntry = O.DocEntry
                  AND (OINV.DocNum IS NULL OR CAST(OINV.DocNum AS VARCHAR) = 'N/A')
              )
            )
            OR (O.DocStatus = 'C' AND O.CANCELED = 'N') -- Closed
            OR (O.DocStatus = 'O')                      -- Open
          )
      ),

      -- 3. Monthly Aggregation
      OrderData AS (
        SELECT
          YEAR(DocDate) AS Year,
          MONTH(DocDate) AS Month,
          COUNT(DISTINCT DocEntry) AS OrderCount,
          SUM(DocTotal ) AS OrderAmount
        FROM OrderBase
        GROUP BY YEAR(DocDate), MONTH(DocDate)
      )

      -- 4. Final Merge
      SELECT 
        COALESCE(i.Year, o.Year) AS Year,
        COALESCE(i.Month, o.Month) AS Month,
        DATENAME(MONTH, DATEFROMPARTS(COALESCE(i.Year, o.Year), COALESCE(i.Month, o.Month), 1)) 
          + ' ' + CAST(COALESCE(i.Year, o.Year) AS VARCHAR) AS MonthName,
        ISNULL(i.InvoiceCount, 0) AS InvoiceCount,
        ISNULL(i.InvoiceAmount, 0) AS InvoiceAmount,
        ISNULL(o.OrderCount, 0) AS OrderCount,
        ISNULL(o.OrderAmount, 0) AS OrderAmount
      FROM InvoiceData i
      FULL OUTER JOIN OrderData o 
        ON i.Year = o.Year AND i.Month = o.Month
      ORDER BY COALESCE(i.Year, o.Year), COALESCE(i.Month, o.Month);
    `;

    // Setup parameters
    const params = [
      { name: "CustomerCode", type: sql.NVarChar, value: customerCode },
    ];

    // Add salesPerson parameter if provided
    if (salesPerson) {
      params.push({
        name: "SalesPerson",
        type: sql.Int,
        value: parseInt(salesPerson, 10),
      });
    }

    console.log("Query params:", params);
    const data = await queryDatabase(query, params);
    console.log(`Retrieved ${data.length} records from database`);

    // Format the data to include a Date field for easier frontend processing
    const formattedData = data.map((row) => ({
      Date: new Date(row.Year, row.Month - 1), // JavaScript months are 0-based
      Year: row.Year,
      Month: row.Month,
      MonthName: row.MonthName,
      InvoiceCount: row.InvoiceCount,
      InvoiceAmount: row.InvoiceAmount,
      OrderCount: row.OrderCount,
      OrderAmount: row.OrderAmount,
    }));

    return formattedData;
  } catch (error) {
    console.error("Error fetching customer purchase and revenue data:", error);
    throw new Error("Failed to fetch customer metrics");
  }
}