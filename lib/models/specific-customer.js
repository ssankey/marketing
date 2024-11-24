
import sql from "mssql";
import { queryDatabase } from "../db";

export async function getCustomerPurchaseAndRevenue(customerCode, year = 2024) {
  try {
    const query = `
      WITH MonthlyData AS (
        SELECT 
          MONTH(OINV.DocDate) AS Month,
          COUNT(DISTINCT OINV.DocEntry) AS NoOfPurchase,
          SUM(INV1.LineTotal) AS AmountSpend
        FROM 
          OINV
          JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        WHERE 
          YEAR(OINV.DocDate) = @Year
          AND OINV.CardCode = @CardCode
        GROUP BY 
          MONTH(OINV.DocDate)
      )
      SELECT 
        m.MonthNumber as month,
        ISNULL(md.NoOfPurchase, 0) as noOfPurchase,
        ISNULL(md.AmountSpend, 0) as AmountSpend
      FROM 
        (SELECT number as MonthNumber 
         FROM master..spt_values 
         WHERE type = 'P' AND number BETWEEN 1 AND 12
        ) m
        LEFT JOIN MonthlyData md ON m.MonthNumber = md.Month
      ORDER BY 
        m.MonthNumber;
    `;

    const params = [
      { name: "Year", type: sql.Int, value: year },
      { name: "CardCode", type: sql.NVarChar, value: customerCode },
    ];

    const data = await queryDatabase(query, params);
    return data;
  } catch (error) {
    console.error("Error fetching customer purchase and revenue data:", error);
    throw new Error("Failed to fetch customer metrics");
  }
}