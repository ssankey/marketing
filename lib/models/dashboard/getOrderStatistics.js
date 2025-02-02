import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../db";

// Function to fetch order statistics
export async function getOrderStatistics({ region, customer } = {}) {
  let whereClauses = [`T1.LineTotal <> 0`]; // Common condition for all orders

  if (region) {
    whereClauses.push(`T2.Region = '${region}'`);
  }
  if (customer) {
    whereClauses.push(`T0.CardCode = '${customer}'`);
  }

  const whereClause = "WHERE " + whereClauses.join(" AND ");

  const query = `
    SELECT 
      COUNT(DISTINCT T0.DocEntry) AS TotalIncomingOrders,
      COUNT(DISTINCT CASE WHEN T0.DocStatus = 'O' THEN T0.DocEntry END) AS TotalOpenOrders,
      COUNT(DISTINCT CASE 
        WHEN T0.DocStatus = 'O' AND T3.OnHand >= T1.Quantity THEN T0.DocEntry 
      END) AS TotalInStockOrders
    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
    INNER JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
    ${whereClause};
  `;

  const result = await queryDatabase(query);
  return result[0]; // Assuming result is an array with one row containing the counts
}
