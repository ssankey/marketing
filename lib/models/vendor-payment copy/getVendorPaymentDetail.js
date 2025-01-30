import sql from "mssql";
import { queryDatabase } from "../../db";

export async function getVendorPaymentDetail(cardCode, startDate, endDate) {
  const query = `
    SELECT 
      T0.[DocNum] AS 'PO#',
      T0.[CardCode],
      T0.[CardName],
      T0.[DocDate] AS 'PO Date',
      CONCAT(CONVERT(VARCHAR, T1.[Quantity]), ' ', T1.[UnitMsr]) AS 'PO Qty',
      T1.[GTotal] AS 'PO Item Val INR',
      CASE 
        WHEN T1.[LineStatus] = 'O' THEN 'Open'
        WHEN T0.[Canceled] = 'Y' THEN 'Canceled'
        WHEN T1.[LineStatus] = 'C' THEN 'Closed'
      END AS 'PO Status',
      T3.[DocNum] AS 'GRPO#',
      T3.[DocDate] AS 'GRPO Date',
      CONCAT(CONVERT(VARCHAR, T2.[Quantity]), ' ', T2.[UnitMsr]) AS 'GRPO Qty',
      CASE 
        WHEN T2.[LineStatus] = 'O' THEN 'Open'
        WHEN T3.[Canceled] = 'Y' THEN 'Canceled'
        WHEN T1.[LineStatus] = 'C' THEN 'Closed'
      END AS 'GRPO Status',
      DATEDIFF(D, T0.[DocDate], T3.[DocDate]) AS 'PO to GRPO Days',
      T13.[DocDate] AS 'AP Invoice Date',
      T13.[DocTotal] AS 'Invoice Total',
      (T13.[DocTotal] - T13.[PaidToDate]) AS 'BalanceDue',
      T13.[NumAtCard],
      DATEDIFF(D, T13.[DocDueDate], GETDATE()) AS 'Overdue Days',
      T15.[PymntGroup]
    FROM OPOR T0
    INNER JOIN POR1 T1 ON T0.[DocEntry] = T1.[DocEntry]
    INNER JOIN PDN1 T2 ON T1.[DocEntry] = T2.[BaseEntry] AND T1.[ItemCode] = T2.[ItemCode] AND T2.[Baseline] = T1.[LineNum]
    INNER JOIN OPDN T3 ON T3.[DocEntry] = T2.[DocEntry]
    INNER JOIN PCH1 T12 ON T2.[DocEntry] = T12.[BaseEntry] AND T2.[ItemCode] = T12.[ItemCode] AND T12.[Baseline] = T2.[LineNum]
    INNER JOIN OPCH T13 ON T13.[DocEntry] = T12.[DocEntry]
    INNER JOIN OITM T10 ON T10.[ItemCode] = T1.[ItemCode]
    INNER JOIN OITB T11 ON T11.[ItmsGrpCod] = T10.[ItmsGrpCod]
    INNER JOIN OCRD T14 ON T13.[CardCode] = T14.[CardCode]
    INNER JOIN OCTG T15 ON T14.[GroupNum] = T15.[GroupNum]
    WHERE T0.[DocDate] >= @StartDate AND T0.[DocDate] <= @EndDate AND T0.[CardCode] = @CardCode
    ORDER BY T0.[DocDate] DESC
  `;

  const params = [
    { name: "CardCode", type: sql.NVarChar, value: cardCode },
    { name: "StartDate", type: sql.Date, value: startDate },
    { name: "EndDate", type: sql.Date, value: endDate },
  ];

  return await queryDatabase(query, params);
}
