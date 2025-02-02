//models/orders.js
import { queryDatabase } from "../db";
import sql from "mssql";

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
      CASE 
        WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
        ELSE 'Out of Stock'
      END AS StockStatus,
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
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
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
        WHEN OITM.OnHand >= T1.OpenQty THEN 'In Stock'
        ELSE 'Out of Stock'
     END AS StockStatus,
      CASE 
        WHEN T1.LineStatus = 'O' THEN 'Open'
        WHEN T1.LineStatus = 'C' THEN  'Closed'
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


export async function getOrdersFromDatabase({
  page = 1,
  search = "",
  status = "all",
  fromDate,
  toDate,
  sortField = "DocNum",
  sortDir = "asc",
  itemsPerPage = 20,
  isAdmin = false,
  contactCodes = [],
}) {
  // Calculate offset
  const offset = (page - 1) * itemsPerPage;

  // Start building a WHERE clause
  let whereClause = "1=1";

  // 1) Search Filter
  if (search) {
    whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' 
      OR T0.CardName LIKE '%${search}%'
    )`;
  }

  // 2) Status Filter
  if (status !== "all") {
    whereClause += ` AND (
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
        WHEN T0.DocStatus='O' THEN 'Open'
        ELSE 'NA'
      END = '${status}'
    )`;
  }

  // 3) Date Filters
  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

  // 4) Role-based / ContactCodes filtering
  //    If not admin, limit the data to orders that match user's contact codes
  //    Assuming you store the contact in T0.CntctCode or T0.CardCode, 
  //    adjust the logic as needed:
  if (!isAdmin && contactCodes.length > 0) {
    // Example: If T0.CntctCode is how you link contacts -> Orders
    whereClause += ` AND T0.CntctCode IN (
      ${contactCodes.map((code) => `'${code}'`).join(", ")}
    )`;
  }

  // 5) Build your SQL queries
  const countQuery = `
    SELECT COUNT(DISTINCT T0.DocEntry) as total
    FROM ORDR T0
    WHERE ${whereClause};
  `;

  const dataQuery = `
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
      T0.DocDueDate AS DeliveryDate,
      T0.CardName,
      T0.DocTotal,
      T0.DocCur,
      T0.DocRate,
      T0.NumAtCard AS CustomerPONo,
      T5.SlpName AS SalesEmployee,
      COUNT(DISTINCT T1.ItemCode) AS ProductCount
    FROM ORDR T0
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    WHERE ${whereClause}
    GROUP BY 
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T0.DocDueDate,
      T0.CardName,
      T0.DocTotal,
      T0.DocCur,
      T0.DocRate,
      T0.NumAtCard,
      T5.SlpName,
      T0.DocStatus,
      T0.CANCELED
    ORDER BY ${sortField} ${sortDir}
    OFFSET ${offset} ROWS
    FETCH NEXT ${itemsPerPage} ROWS ONLY;
  `;

  try {
    const [totalResult, rawOrders] = await Promise.all([
      queryDatabase(countQuery),
      queryDatabase(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;

    // Format the dates as ISO strings
    const orders = rawOrders.map((order) => ({
      ...order,
      DocDate: order.DocDate ? order.DocDate.toISOString() : null,
      DeliveryDate: order.DeliveryDate
        ? order.DeliveryDate.toISOString()
        : null,
    }));

    return { orders, totalItems };
  } catch (error) {
    console.error("Error fetching orders from database:", error);
    throw error;
  }
}

export async function getOpenOrdersFromDatabase({
  search,
  fromDate,
  toDate,
  sortField,
  status,
  sortDir,
  offset,
  ITEMS_PER_PAGE,
  isAdmin = false, // Add isAdmin parameter
  contactCodes = [], // Add contactCodes parameter
}) {
  let whereClause = "T0.DocStatus = 'O' AND T1.LineStatus = 'O'";

  // Add search filters
  if (search) {
    whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' OR 
      T0.CardName LIKE '%${search}%' OR 
      T1.ItemCode LIKE '%${search}%'
    )`;
  }

  // Add date filters
  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

  // Stock status filter
  if (status === "inStock") {
    whereClause += " AND T3.OnHand > 0 AND T3.OnHand >= T1.OpenQty"; // In stock items
  } else if (status === "outOfStock") {
    whereClause += " AND T3.OnHand >= 0 AND T3.OnHand < T1.OpenQty"; // Out of stock items
  }

  // Role-based / ContactCodes filtering
  // If not admin, limit the data to orders that match user's contact codes
  if (!isAdmin && contactCodes.length > 0) {
    whereClause += ` AND T0.CntctCode IN (
      ${contactCodes.map((code) => `'${code}'`).join(", ")}
    )`;
  }

  const countQuery = `
    SELECT COUNT(T0.DocEntry) as total
    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode -- Include T3 here
    WHERE ${whereClause};
  `;

  const dataQuery = `
    SELECT 
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T0.DocRate,
      T1.LineTotal AS TotalAmount,
      T0.CardName,
      T0.NumAtCard AS CustomerPONo,
      T0.TaxDate AS PODate,
      T4.ItmsGrpNam AS ItemGroup,
      T1.ItemCode,
      T1.Dscription AS ItemName,
      CASE 
        WHEN T1.LineStatus='C' THEN 'Closed'
        WHEN T1.LineStatus='O' THEN 'Open'
        ELSE 'NA' 
      END AS LineStatus,
      ROUND(T1.Quantity, 2) AS Quantity,
      ROUND(T1.OpenQty, 2) AS OpenQty,
      T1.UnitMsr AS UOMName,
      T3.OnHand AS Stock,
      CASE 
        WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
        ELSE 'Out of Stock'
      END AS StockStatus,
      T1.Price,
      T1.LineTotal,
      ROUND(T1.Price, 3) AS RoundedPrice,
      T1.Currency,
      (T1.OpenQty * T1.Price) AS OpenAmount,
      T1.U_timeline,
      T3.SuppCatNum,
      T1.DelivrdQty,
      T1.ShipDate AS DeliveryDate,
      T2.Location AS PlantLocation,
      T5.SlpName AS SalesEmployee
    FROM ORDR T0  
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
    INNER JOIN OLCT T2 ON T1.LocCode = T2.Code 
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
    LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    WHERE ${whereClause}
    GROUP BY 
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T0.DocRate,
      T0.CardName,
      T0.NumAtCard,
      T0.TaxDate,
      T4.ItmsGrpNam,
      T1.ItemCode,
      T1.LineStatus,
      T1.Dscription,
      T1.Quantity,
      T1.OpenQty,
      T1.UnitMsr,
      T3.OnHand,
      T1.Currency,
      T1.Price,
      T1.LineTotal,
      T1.U_timeline,
      T3.SuppCatNum,
      T1.DelivrdQty,
      T1.ShipDate,
      T2.Location,
      T5.SlpName
    ORDER BY ${sortField} ${sortDir}
    OFFSET @offset ROWS
    FETCH NEXT @ITEMS_PER_PAGE ROWS ONLY;
  `;

  try {
    const [totalResult, rawOrders] = await Promise.all([
      queryDatabase(countQuery),
      queryDatabase(dataQuery, [
        { name: "offset", type: sql.Int, value: offset },
        { name: "ITEMS_PER_PAGE", type: sql.Int, value: ITEMS_PER_PAGE },
      ]),
    ]);

    const totalItems = totalResult[0]?.total || 0;
    const orders = rawOrders.map((order) => ({
      ...order,
      DocDate: order.DocDate ? order.DocDate.toISOString() : null,
      DeliveryDate: order.DeliveryDate
        ? order.DeliveryDate.toISOString()
        : null,
    }));

    return { orders, totalItems };
  } catch (error) {
    console.error("Error fetching open orders:", error);
    throw error;
  }
}