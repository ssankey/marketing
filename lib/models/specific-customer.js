

import sql from "mssql";
import { queryDatabase } from "../db";

export async function getCustomerPurchaseAndRevenue(
  customerCode,
  salesPerson = null,
  category = null
) {
  try {
    console.log("Model function called with params:", {
      customerCode,
      salesPerson,
      category,
    });

    let query = `
      -- 1. Monthly Invoice Summary with Category filter
      WITH InvoiceData AS (
        SELECT 
          YEAR(I.DocDate) AS Year,
          MONTH(I.DocDate) AS Month,
          COUNT(L.DocEntry) AS InvoiceCount,
          SUM(L.LineTotal) AS InvoiceAmount
        FROM OINV I
        JOIN INV1 L ON I.DocEntry = L.DocEntry
        JOIN OITM IT ON L.ItemCode = IT.ItemCode
        JOIN OITB IB ON IT.ItmsGrpCod = IB.ItmsGrpCod
        WHERE I.CardCode = @CustomerCode
          AND I.CANCELED = 'N'
          AND (@SalesPerson IS NULL OR I.SlpCode = @SalesPerson)
          AND (@Category IS NULL OR IB.ItmsGrpNam = @Category)
        GROUP BY YEAR(I.DocDate), MONTH(I.DocDate)
      ),

      -- 2. Base Order Table with Category filter
      OrderBase AS (
        SELECT
          O.DocEntry,
          O.DocDate,
          O.DocTotal,
          O.VatSum
        FROM ORDR O
        JOIN RDR1 R ON O.DocEntry = R.DocEntry
        JOIN OITM IT ON R.ItemCode = IT.ItemCode
        JOIN OITB IB ON IT.ItmsGrpCod = IB.ItmsGrpCod
        WHERE 
          O.CANCELED = 'N'
          AND O.CardCode = @CustomerCode
          AND (@SalesPerson IS NULL OR O.SlpCode = @SalesPerson)
          AND (@Category IS NULL OR IB.ItmsGrpNam = @Category)
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
        GROUP BY O.DocEntry, O.DocDate, O.DocTotal, O.VatSum
      ),

      -- 3. Monthly Aggregation
      OrderData AS (
        SELECT
          YEAR(DocDate) AS Year,
          MONTH(DocDate) AS Month,
          COUNT(DISTINCT DocEntry) AS OrderCount,
          SUM(DocTotal) AS OrderAmount
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
      {
        name: "SalesPerson",
        type: sql.Int,
        value: salesPerson ? parseInt(salesPerson, 10) : null,
      },
      {
        name: "Category",
        type: sql.NVarChar,
        value: category || null,
      },
    ];

    console.log("Query params:", params);
    const data = await queryDatabase(query, params);
    console.log(`Retrieved ${data.length} records from database`);

    // Format the data
    const formattedData = data.map((row) => ({
      Date: new Date(row.Year, row.Month - 1),
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
