

import sql from "mssql";
import { queryDatabase } from "../../db";

export async function getCustomerBalanceDetail(cardCode, startDate, endDate) {
  // Build the SQL query dynamically based on the presence of `cardCode`
  const query = `
    SELECT DISTINCT 
      T0.[DocNum] AS 'SO#',
      T0.[CardCode],
      T0.[CardName],
      T0.[DocDate] AS 'SO Date',
      T3.[DocNum] AS 'Delivery#',
      T3.[DocDate] AS 'Delivery Date',
      DATEDIFF(D, T0.[DocDate], T3.[DocDate]) AS 'SO to Delivery Days',
      T13.[DocNum] AS 'Invoice No.',
      T13.[DocDate] AS 'AR Invoice Date',
      T13.[DocTotal] AS 'Invoice Total',
      (T13.[DocTotal] - T13.[PaidToDate]) AS 'BalanceDue',
      T13.[NumAtCard],
      DATEDIFF(D, T13.[DocDueDate], GETDATE()) AS 'Overdue Days',
      T15.[PymntGroup]
    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.[DocEntry] = T1.[DocEntry]
    INNER JOIN DLN1 T2 ON T1.[DocEntry] = T2.[BaseEntry] AND T1.[ItemCode] = T2.[ItemCode] AND T2.[Baseline] = T1.[LineNum]
    INNER JOIN ODLN T3 ON T3.[DocEntry] = T2.[DocEntry]
    INNER JOIN INV1 T12 ON T2.[DocEntry] = T12.[BaseEntry] AND T2.[ItemCode] = T12.[ItemCode] AND T12.[Baseline] = T2.[LineNum]
    INNER JOIN OINV T13 ON T13.[DocEntry] = T12.[DocEntry]
    INNER JOIN OITM T10 ON T10.[ItemCode] = T1.[ItemCode]
    INNER JOIN OITB T11 ON T11.[ItmsGrpCod] = T10.[ItmsGrpCod]
    INNER JOIN OCRD T14 ON T13.[CardCode] = T14.[CardCode]
    INNER JOIN OCTG T15 ON T14.[GroupNum] = T15.[GroupNum]
    LEFT JOIN OSLP T50 ON T50.[SlpCode] = T13.[SlpCode]
    WHERE T0.[DocDate] >= @StartDate 
      AND T0.[DocDate] <= @EndDate
      ${cardCode ? "AND T0.[CardCode] = @CardCode" : ""}
    ORDER BY T0.[DocDate] DESC
  `;

  const params = [
    { name: "StartDate", type: sql.Date, value: startDate },
    { name: "EndDate", type: sql.Date, value: endDate },
  ];

  // Include the `CardCode` parameter only if it is provided
  if (cardCode) {
    params.push({ name: "CardCode", type: sql.NVarChar, value: cardCode });
  }

  
  
  return await queryDatabase(query, params);
}



