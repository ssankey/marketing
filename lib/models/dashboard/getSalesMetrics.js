




import sql from "mssql";
import { queryDatabase } from "../../db";

// Helper to build WHERE clause
function buildWhereClause(alias, { startDate, endDate }) {
  const conditions = [];

  if (startDate && !endDate) {
    conditions.push(`CONVERT(DATE, ${alias}.DocDate) >= '${startDate}'`);
  } else if (!startDate && endDate) {
    conditions.push(`CONVERT(DATE, ${alias}.DocDate) <= '${endDate}'`);
  } else if (startDate && endDate) {
    conditions.push(
      `CONVERT(DATE, ${alias}.DocDate) BETWEEN '${startDate}' AND '${endDate}'`
    );
  } else {
    conditions.push(
      `CONVERT(DATE, ${alias}.DocDate) = CONVERT(DATE, GETDATE())`
    );
  }

  return conditions.join(" AND ");
}

export async function getSalesMetrics({
  startDate,
  endDate,
  role,
  contactCodes = [],
  cardCodes = [],
}) {
  const isAdmin = role === "admin";
  console.log("[DEBUG - getSalesMetrics]", {
    startDate,
    endDate,
    role,
    contactCodes,
    cardCodes,
  });


  const params = { startDate, endDate };
  const whereOINV = buildWhereClause("T0", params);
  const whereORDR = buildWhereClause("T0", params);
  const whereOQUT = buildWhereClause("T0", params);
  const whereORDR_AsO = buildWhereClause("O", params);
  const whereOQUT_AsQ = buildWhereClause("Q", params);

  const extraWhere = [];

  if (!isAdmin) {
    if (contactCodes.length > 0) {
      extraWhere.push(
        `T0.SlpCode IN (${contactCodes.map((c) => `'${c}'`).join(",")})`
      );
    } else if (cardCodes.length > 0) {
      extraWhere.push(
        `T0.CardCode IN (${cardCodes.map((c) => `'${c}'`).join(",")})`
      );
    } else {
      throw new Error("No contact codes available for this user.");
    }
  }

  const withExtra = (baseWhere) =>
    [baseWhere, ...extraWhere].filter(Boolean).join(" AND ");

  const salesQuery = `
    SELECT SUM(T1.LineTotal) AS TotalSales
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    WHERE ${withExtra(whereOINV)} AND T0.CANCELED = 'N';
  `;

  const outstandingQuery = `
    SELECT 
      COUNT(DISTINCT T0.DocEntry) AS NumberOfOutstandingInvoices,
      SUM(T0.DocTotal - T0.PaidToDate) AS TotalOutstandingAmount
    FROM OINV T0
    WHERE ${withExtra(
      whereOINV
    )} AND T0.CANCELED = 'N' AND T0.DocTotal > T0.PaidToDate;
  `;

  const ordersQuery = `
    SELECT COUNT(DISTINCT T0.DocEntry) AS NumberOfSalesOrders
    FROM ORDR T0
    WHERE ${withExtra(whereORDR)} AND T0.CANCELED = 'N';
  `;

  const quotationsQuery = `
    WITH TotalQuotations AS (
      SELECT COUNT(DISTINCT T0.DocEntry) AS Total
      FROM OQUT T0
      WHERE ${withExtra(whereOQUT)} AND T0.CANCELED = 'N'
    ),
    ConvertedQuotations AS (
      SELECT COUNT(DISTINCT O.DocEntry) AS Converted
      FROM ORDR O
      INNER JOIN OQUT Q ON O.DocNum = Q.DocNum
      WHERE ${withExtra(whereORDR_AsO)} AND ${withExtra(whereOQUT_AsQ)}
        AND O.CANCELED = 'N' AND Q.CANCELED = 'N'
    )
    SELECT 
      CASE 
        WHEN TQ.Total > 0 THEN CAST(ROUND(CAST(CQ.Converted AS FLOAT) * 100.0 / TQ.Total, 2) AS DECIMAL(5,2))
        ELSE 0 
      END AS ConversionRate
    FROM TotalQuotations TQ
    CROSS JOIN ConvertedQuotations CQ;
  `;

  try {
    const [salesResult, outstandingResult, ordersResult, quotationsResult] =
      await Promise.all([
        queryDatabase(salesQuery),
        queryDatabase(outstandingQuery),
        queryDatabase(ordersQuery),
        queryDatabase(quotationsQuery),
      ]);

    return {
      totalSales: salesResult[0]?.TotalSales || 0,
      numberOfSalesOrders: ordersResult[0]?.NumberOfSalesOrders || 0,
      outstandingInvoices: {
        count: outstandingResult[0]?.NumberOfOutstandingInvoices || 0,
        amount: outstandingResult[0]?.TotalOutstandingAmount || 0,
      },
      quotationConversionRate: quotationsResult[0]?.ConversionRate || 0,
    };
  } catch (error) {
    console.error("Error in getSalesMetrics:", error);
    throw error;
  }
}

