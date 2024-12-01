
import { queryDatabase } from "../db";

export async function getOrders(customQuery) {
  try {
    const data = await queryDatabase(customQuery);
    console.log(customQuery);
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Failed to fetch orders");
  }
}

export async function getOrderDetails(docEntry, docNum) {
  // Parse input parameters to integers
  docEntry = parseInt(docEntry, 10);
  docNum = parseInt(docNum, 10);

  // Query to fetch order header details
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

  // Query to fetch order line items
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

  // Query to fetch contact information
  const contactQuery = `
    SELECT 
      T2.Name AS ContactPerson,
      T2.Tel1 AS Phone,
      T2.E_MailL AS Email
    FROM OCPR T2
    WHERE T2.CntctCode = (SELECT CntctCode FROM ORDR WHERE DocEntry = ${docEntry})
  `;

  // Query to fetch related invoices
  const invoicesQuery = `
    SELECT 
      OINV.DocNum,
      OINV.DocEntry,
      OINV.DocDate,
      OINV.DocDueDate,
      OINV.CardCode,
      OINV.CardName,
      OINV.DocTotal,
      OINV.DocCur,
      OINV.DocStatus,
      OINV.Comments,
      OINV.SlpCode,
      OSLP.SlpName AS SalesEmployee,
      OINV.DocCur,
      OINV.NumAtCard AS CustomerPONo,
      OINV.DocRate,
      OINV.VatSum,
      OINV.DiscSum,
      OINV.TotalExpns,
      OINV.RoundDif,
      (OINV.DocTotal - OINV.VatSum - OINV.TotalExpns + OINV.DiscSum) AS Subtotal,
      CASE 
        WHEN (OINV.DocStatus='C' AND OINV.CANCELED='N') THEN 'Closed'
        WHEN (OINV.DocStatus='C' AND OINV.CANCELED='Y') THEN 'Cancelled'
        WHEN OINV.DocStatus='O' THEN 'Open' 
        ELSE 'NA' 
      END AS DocStatusDisplay
    FROM OINV
    LEFT JOIN OSLP ON OINV.SlpCode = OSLP.SlpCode
    WHERE OINV.BaseEntry = ${docEntry} AND OINV.BaseType = '17' -- '17' typically represents Sales Orders
  `;

  try {
    // Execute all queries in parallel
    const [orderHeader, orderLines, contactInfo, invoices] = await Promise.all([
      queryDatabase(orderHeaderQuery),
      queryDatabase(orderLinesQuery),
      queryDatabase(contactQuery),
      queryDatabase(invoicesQuery)
    ]);

    // If no order header is found, return null
    if (!orderHeader || orderHeader.length === 0) {
      return null;
    }

    // Construct the order object with all fetched data
    const order = {
      ...orderHeader[0],
      ...contactInfo[0],
      LineItems: orderLines,
      Invoices: invoices // Add the invoices to the order object
    };

    return order;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error; // Re-throw the error after logging
  }
}

export async function getOpenOrders() {
  // Open Orders Query
  const openOrdersQuery = `
    SELECT 
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
        WHEN T0.DocStatus='O' THEN 'Open' 
        ELSE 'NA' 
      END AS DocStatus,
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T0.NumAtCard AS CustomerPONo,
      T0.TaxDate AS PODate,
      T0.CardName,
      T4.ItmsGrpNam AS ItemGroup,
      T1.ItemCode,
      T1.Dscription AS ItemName,
      CASE 
        WHEN T1.LineStatus='C' THEN 'Closed'
        WHEN T1.LineStatus='O' THEN 'Open'
        ELSE 'NA' 
      END AS LineStatus,
      ROUND(T1.Quantity, 2) AS Quantity,
      T1.UnitMsr AS UOMName,
      ROUND(T1.OpenQty, 2) AS OpenQty,
      T3.OnHand AS StockStatus,
      T1.U_timeline,
      T3.SuppCatNum,
      T1.DelivrdQty,
      T1.ShipDate AS DeliveryDate,
      T2.Location AS PlantLocation,
      ROUND(T1.Price, 3) AS Price,
      T1.Currency,
      (T1.OpenQty * T1.Price) AS OpenAmount,
      T5.SlpName AS SalesEmployee
    FROM ORDR T0  
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
    INNER JOIN OLCT T2 ON T1.LocCode = T2.Code 
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
    LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    WHERE T1.LineStatus = 'O'
  `;

  try {
    // Execute the query to fetch open orders
    const openOrders = await queryDatabase(openOrdersQuery);

    // If no open orders are found, return an empty array
    if (!openOrders || openOrders.length === 0) {
      return [];
    }

    // Return the fetched open orders
    return openOrders;
  } catch (error) {
    console.error('Error fetching open orders:', error);
    throw error; // Re-throw the error after logging
  }
}



// // New Function: Get Orders Count by Month and Status
// export async function getMonthlyOrdersByStatus() {
//   try {
//     const query = `
//       SELECT 
//         MONTH(T0.DocDate) AS Month,
//         CASE 
//           WHEN T0.DocStatus = 'O' THEN 'Open'
//           WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
//           ELSE 'NA'
//         END AS OrderStatus,
//         COUNT(T0.DocEntry) AS OrderCount
//       FROM ORDR T0
//       WHERE YEAR(T0.DocDate) = YEAR(CURDATE()) -- Filter for the current year
//       GROUP BY 
//         MONTH(T0.DocDate),
//         CASE 
//           WHEN T0.DocStatus = 'O' THEN 'Open'
//           WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
//           ELSE 'NA'
//         END
//       ORDER BY Month ASC;
//     `;

//     const data = await queryDatabase(query);

//     // Transform the results for graph usage
//     const monthlyData = {};
//     data.forEach((row) => {
//       const month = row.Month;
//       if (!monthlyData[month]) {
//         monthlyData[month] = { Open: 0, Closed: 0 };
//       }
//       if (row.OrderStatus === "Open") {
//         monthlyData[month].Open = row.OrderCount;
//       } else if (row.OrderStatus === "Closed") {
//         monthlyData[month].Closed = row.OrderCount;
//       }
//     });

//     console.log(monthlyData);
//     return monthlyData;
    
//   } catch (error) {
//     console.error("Failed to fetch monthly order status data:", error);
//     throw new Error("Failed to fetch monthly order status data");
//   }
// }

// New Function: Get Orders Count by Month and Status
// export async function getMonthlyOrdersByStatus() {
//   const query = `
//     SELECT 
//       MONTH(T0.DocDate) AS Month,
//       CASE 
//         WHEN T0.DocStatus = 'O' THEN 'Open'
//         WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'N' THEN 'Closed'
//         ELSE 'NA'
//       END AS OrderStatus,
//       COUNT(T0.DocEntry) AS OrderCount
//     FROM ORDR T0
//     WHERE YEAR(T0.DocDate) = YEAR(CURDATE()) -- Filter for the current year
//     GROUP BY 
//       MONTH(T0.DocDate), 
//       OrderStatus
//     ORDER BY Month ASC;
//   `;

//   const results = await queryDatabase(query);
//   console.log(results);

//   // Transform results to match expected format
//   return results.map((row) => ({
//     month: row.Month,
//     openOrders: row.OrderStatus === 'Open' ? parseInt(row.OrderCount, 10) : 0,
//     closedOrders: row.OrderStatus === 'Closed' ? parseInt(row.OrderCount, 10) : 0,
//   }));
// }


// In lib/models/orders.js, update the getMonthlyOrdersByStatus function:

