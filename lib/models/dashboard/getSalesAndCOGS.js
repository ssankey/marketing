 import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../db";
// Query for Monthly Sales and COGS
// Update function name and parameters
export async function getSalesAndCOGS() {
  const query = `
    SELECT 
      FORMAT(T0.DocDate, 'MMM yyyy') as month,
      SUM(T1.LineTotal) as sales,
      SUM(T1.GrossBuyPr * T1.Quantity) as cogs,
      SUM(T1.LineTotal - (T1.GrossBuyPr * T1.Quantity)) as grossMargin
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
    WHERE T1.LineTotal <> 0
    GROUP BY FORMAT(T0.DocDate, 'MMM yyyy')
    ORDER BY MIN(T0.DocDate) 
  `;

  const results = await queryDatabase(query);

  // Transform results to match expected format
  return results.map((row) => ({
    month: row.month,
    sales: parseFloat(row.sales) || 0,
    cogs: parseFloat(row.cogs) || 0,
    grossMargin: parseFloat(row.grossMargin) || 0,
  }));
}
