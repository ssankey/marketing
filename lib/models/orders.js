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

export async function getOrderDetails(docEntry, docNum) {
  // Ensure parameters are properly typed
  docEntry = parseInt(docEntry, 10);
  docNum = parseInt(docNum, 10);

  // Fetch order header with both DocEntry and DocNum
  const orderHeaderQuery = `
    SELECT 
      T0.DocNum,
      T0.DocEntry,
      T0.DocDate,
      T0.DocDueDate,
      T0.TaxDate AS ShipDate,
      T0.CardCode,
      T0.CardName,
      T0.CntctCode,
      T0.DocStatus,
      T0.DocTotal,
      T0.DocCur,
      T0.Comments,
      T0.SlpCode,
      T5.SlpName AS SalesEmployee,
      T0.GroupNum,
      T6.PymntGroup AS PaymentTerms,
      T0.Address2 AS ShipToAddress,
      T0.Address AS BillToAddress,
      T0.DiscSum AS DiscountTotal,
      T0.VatSum AS TaxTotal,
      T0.TotalExpns AS ShippingFee,
      T0.RoundDif AS RoundingDiff,
      (T0.DocTotal - T0.VatSum - T0.TotalExpns + T0.DiscSum) AS Subtotal,
      T0.NumAtCard AS CustomerPONo,
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
        WHEN T0.DocStatus='O' THEN 'Open' 
        ELSE 'NA' 
      END AS DocStatusDisplay
    FROM ORDR T0
    LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    LEFT JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
    WHERE T0.DocEntry = ${docEntry} AND T0.DocNum = ${docNum}
  `;

  // Fetch order line items with additional fields
  const orderLinesQuery = `
    SELECT 
      T1.LineNum,
      T1.ItemCode,
      T1.Dscription AS Description,
      T1.Quantity,
      T1.UnitMsr,
      T1.Price,
      T1.LineTotal,
      T1.Currency,
      T1.WhsCode,
      T1.ShipDate,
      T1.TaxCode,
      T1.DiscPrcnt AS DiscountPercent,
      CASE 
        WHEN T1.LineStatus = 'O' THEN 'Open'
        WHEN T1.LineStatus = 'C' THEN 'Closed'
        ELSE 'NA'
      END AS LineStatus
    FROM RDR1 T1
    LEFT JOIN OITM ON T1.ItemCode = OITM.ItemCode
    WHERE T1.DocEntry = ${docEntry}
    ORDER BY T1.LineNum ASC
  `;

  // Fetch customer contact information
  const contactQuery = `
    SELECT 
      T2.Name AS ContactPerson,
      T2.Tel1 AS Phone,
      T2.E_MailL AS Email
    FROM OCPR T2
    WHERE T2.CntctCode = (SELECT CntctCode FROM ORDR WHERE DocEntry = ${docEntry})
  `;

  // Execute queries
  const [orderHeader] = await queryDatabase(orderHeaderQuery);
  const orderLines = await queryDatabase(orderLinesQuery);
  const [contactInfo] = await queryDatabase(contactQuery);

  if (!orderHeader) {
    return null;
  }

  // Merge contact information into order header
  const order = {
    ...orderHeader,
    ...contactInfo,
    LineItems: orderLines,
  };

  return order;
}
