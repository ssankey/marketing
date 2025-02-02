import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../db";
import getDateFilter from "lib/models/dashboard/getDateFilter";


// Query for Top 10 Categories by Performance
export async function getTopCategories({
  dateFilter,
  startDate,
  endDate,
  region,
  customer,
} = {}) {
  let whereClauses = [];
  console.log(dateFilter);

  // Handle date filtering
  if (startDate && endDate) {
    // If explicit dates are provided, use them
    whereClauses.push(`T0.DocDate BETWEEN '${startDate}' AND '${endDate}'`);
  } else if (dateFilter === "allTime") {
    // For allTime, we don't add any date restrictions to get all historical data
  } else {
    // If dateFilter is provided, use predefined date ranges
    const dateFilterClause = getDateFilter(dateFilter);
    if (dateFilterClause) {
      whereClauses.push(dateFilterClause);
    } else {
      // Default to today if no date parameters are provided
      whereClauses.push(`CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`);
    }
  }

  // Add other filters
  whereClauses.push(`T1.LineTotal <> 0`);

  // Add region filter if provided
  if (region) {
    whereClauses.push(`T2.Region = '${region}'`);
  }

  // Add specific customer filter if provided
  if (customer) {
    whereClauses.push(`T0.CardCode = '${customer}'`);
  }

  // Only add WHERE clause if there are conditions to apply
  const whereClause =
    whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";
  console.log("Generated WHERE clause:", whereClause);

  const query = `
    SELECT TOP 10 
      T4.ItmsGrpNam AS Category, 
      SUM(T1.LineTotal) AS Sales
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
    LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    ${whereClause}
    GROUP BY T4.ItmsGrpNam
    ORDER BY Sales DESC;
  `;
  const results = await queryDatabase(query);
  console.log(query);

  console.log("Query results:", results);

  return results;
}
