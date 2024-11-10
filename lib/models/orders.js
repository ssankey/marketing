// lib/models/order.js
import { queryDatabase } from '../db';


export async function getOrders(customQuery) {
  try {
    const data = await queryDatabase(customQuery); // Execute the provided query
    console.log(customQuery);
    
    return data;
  } catch (error) {    
    console.error('Database query error:', error);
    throw new Error('Failed to fetch orders');
  }
}


export async function getOrderDetail(docNum, docEntry) {
  const query = `
    SELECT 
      CASE 
        WHEN (T1.DocStatus = 'C' AND T1.CANCELED = 'N') THEN 'Closed'
        WHEN (T1.DocStatus = 'C' AND T1.CANCELED = 'Y') THEN 'Cancelled'
        WHEN T1.DocStatus = 'O' THEN 'Open' 
        ELSE 'NA' 
      END AS DocStatus,
      T1.DocEntry,
      T1.DocNum,
      T1.CardCode,
      T1.DocDate,
      T1.TaxDate AS PODate,
      T1.NumAtCard AS CustomerPONo,
      T1.CardName,
      T1.DocCur AS Currency, -- Aliased for frontend consistency
      T1.DocTotal,
      T5.SlpName AS SalesEmployee,
      T4.ItmsGrpNam AS ItemGroup,
      T0.ItemCode,
      T0.Dscription AS ItemName,
      T0.Quantity,
      T0.OpenQty,
      T0.DelivrdQty,
      T0.ShipDate,
      T0.LineStatus,
      T0.Price,
      (T0.Quantity * T0.Price) AS LineTotal,
      T2.Location AS PlantLocation
    FROM RDR1 T0
    INNER JOIN ORDR T1 ON T1.DocEntry = T0.DocEntry
    INNER JOIN OLCT T2 ON T0.LocCode = T2.Code
    LEFT JOIN OITM T3 ON T0.ItemCode = T3.ItemCode
    LEFT JOIN OITB T4 ON T4.ItmsGrpCod = T3.ItmsGrpCod
    INNER JOIN OSLP T5 ON T1.SlpCode = T5.SlpCode
    WHERE T1.DocNum = ? AND T1.DocEntry = ?;
  `;

  const params = [docNum, docEntry]; // Parameters to prevent SQL injection

  try {
    const data = await queryDatabase(query, params);
    return data;
  } catch (error) {    
    console.error('Database query error:', error);
    throw new Error('Failed to fetch order details');
  }
}
