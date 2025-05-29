//models/orders.js
import { queryDatabase } from "../db";
import sql from "mssql";

export async function getOrders(customQuery) {
  try {
    const data = await queryDatabase(customQuery);
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Failed to fetch orders");
  }
}

// lib/models/orders.js
export async function getOrderDetails(docEntry, docNum) {
  docEntry = parseInt(docEntry, 10);
  docNum = parseInt(docNum, 10);

  // 1) Fetch the order header with joined invoice info (if any)
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
      T3.U_CasNo,
      T6.PymntGroup AS PaymentTerms,
      T0.Address2 AS ShipToAddress,
      T0.Address AS BillToAddress,
      T0.DiscSum AS DiscountTotal,
      T0.VatSum AS TaxTotal,
      T0.TotalExpns AS ShippingFee,
      T0.RoundDif AS RoundingDiff,
      (T0.DocTotal - T0.VatSum - T0.TotalExpns + T0.DiscSum) AS Subtotal,
      T0.NumAtCard AS CustomerPONo,
      OINV.trackno AS TrackingNumber,
      OINV.U_DeliveryDate AS DeliveryDate,
      OINV.U_DispatchDate AS DispatchDate,
      T5.Email AS SalesPerson_Email,
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
        WHEN T0.DocStatus='O' THEN 'Open' 
        ELSE 'NA' 
      END AS DocStatusDisplay,
      
      -- Invoice Information (from joined INV1/OINV via Delivery)
      INV1.DocEntry AS InvoiceDocEntry,
      OINV.DocNum AS InvoiceNumber,
      OINV.DocDate AS InvoiceDate,
      OINV.DocTotal AS InvoiceTotal,
      OINV.DocCur AS InvoiceCurrency,
      OINV.DocStatus AS InvoiceStatus,
      OINV.VatSum AS InvoiceTaxTotal,
      OINV.DiscSum AS InvoiceDiscountTotal,
      OINV.TotalExpns AS InvoiceShippingFee,
      OINV.RoundDif AS InvoiceRoundingDiff,
      (OINV.DocTotal - OINV.VatSum - OINV.TotalExpns + OINV.DiscSum) AS InvoiceSubtotal,
      CASE 
        WHEN (OINV.DocStatus='C' AND OINV.CANCELED='N') THEN 'Closed'
        WHEN (OINV.DocStatus='C' AND OINV.CANCELED='Y') THEN 'Cancelled'
        WHEN OINV.DocStatus='O' THEN 'Open' 
        ELSE 'NA' 
      END AS InvoiceStatusDisplay
      
    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
    LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    LEFT JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
    
    -- Delivery -> Invoice chain
    LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                   AND T1.LineNum = DLN1.BaseLine 
                   AND DLN1.BaseType = 17
    LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                   AND DLN1.LineNum = INV1.BaseLine 
                   AND INV1.BaseType = 15
    LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
    
    WHERE T0.DocEntry = ${docEntry} AND T0.DocNum = ${docNum}
    order by T0.DocDate desc
  `;


  console.log('orderHeaderQuery',orderHeaderQuery)

  // 2) Fetch the order lines (including joined invoice docentry)
  const orderLinesQuery = `
  SELECT 
    T1.LineNum,
    T1.ItemCode,
    OITM.U_CasNo,
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
      WHEN T1.LineStatus = 'C' THEN 'Closed'
      ELSE 'NA'
    END AS LineStatus,

    -- Invoice Line Information
    INV1.LineNum       AS InvoiceLineNumber,
    INV1.Quantity      AS InvoicedQuantity,
    INV1.Price         AS InvoiceUnitPrice,
    INV1.LineTotal     AS InvoiceLineTotal,
    
    -- Invoice Header Information for each line
    INV1.DocEntry      AS InvoiceDocEntry,
    OINV.DocNum        AS InvoiceNumber,
    OINV.trackno       AS InvoiceTrackingNumber,
    OINV.U_DeliveryDate AS InvoiceDeliveryDate,
    OINV.U_DispatchDate AS InvoiceDispatchDate,
    OINV.U_Airlinename as Airlinename

  FROM RDR1 T1
  LEFT JOIN OITM ON T1.ItemCode = OITM.ItemCode
  LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                 AND T1.LineNum = DLN1.BaseLine 
                 AND DLN1.BaseType = 17
  LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                 AND DLN1.LineNum = INV1.BaseLine 
                 AND INV1.BaseType = 15
  LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
  
  WHERE T1.DocEntry = ${docEntry}
  ORDER BY T1.LineNum ASC
`;


  // 3) Fetch the contact info
  const contactQuery = `
    SELECT 
      T2.Name AS ContactPerson,
      T2.Tel1 AS Phone,
      T2.E_MailL AS Email
    FROM OCPR T2
    WHERE T2.CntctCode = (SELECT CntctCode FROM ORDR WHERE DocEntry = ${docEntry})
  `;

  try {
    // 4) Execute queries in parallel
    const [orderHeader, orderLines, contactInfo] = await Promise.all([
      queryDatabase(orderHeaderQuery),
      queryDatabase(orderLinesQuery),
      queryDatabase(contactQuery),
    ]);

    // 5) If no header found, return null
    if (!orderHeader || orderHeader.length === 0) {
      return null;
    }

    // 6) Combine the first (header) row, contact info, and line items
    const order = {
      ...orderHeader[0],       // main order + invoice references
      ...contactInfo[0] || {}, // contact info
      LineItems: orderLines,   // array of lines
    };

    return order;
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw error;
  }
}


export async function getOrdersFromDatabase({
  page = 1,
  search = "",
  status = "all",
  fromDate,
  toDate,
  sortField = "DocDate",
  sortDir = "desc",
  itemsPerPage = 20,
  isAdmin = false,
  contactCodes = [],
  cardCodes=[],
  getAll = false, // New flag to determine if we fetch all records
  excludeCancelled = true
}) {
  // Calculate offset
  const offset = (page - 1) * itemsPerPage;

  // Start building a WHERE clause
  let whereClause = "1=1";

  // 1) Search Filter
  if (search) {
    whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' OR 
      T0.CardName LIKE '%${search}%' OR 
      T0.NumAtCard LIKE '%${search}%'
    )`;
  }

  // 2) Status Filter
  if (status !== "all") {
    whereClause += `
      AND (
        CASE
          WHEN (
            T0.DocStatus = 'O'
            AND EXISTS (
              SELECT 1
              FROM RDR1 T1
              LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
                             AND T1.LineNum = DLN1.BaseLine
                             AND DLN1.BaseType = 17
              LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
                             AND DLN1.LineNum = INV1.BaseLine
                             AND INV1.BaseType = 15
              LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
                             AND OINV.CANCELED = 'N'
              WHERE T1.DocEntry = T0.DocEntry
                AND OINV.DocNum IS NOT NULL
                AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
            )
            AND EXISTS (
              SELECT 1
              FROM RDR1 T1
              LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
                             AND T1.LineNum = DLN1.BaseLine
                             AND DLN1.BaseType = 17
              LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
                             AND DLN1.LineNum = INV1.BaseLine
                             AND INV1.BaseType = 15
              LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
                             AND OINV.CANCELED = 'N'
              WHERE T1.DocEntry = T0.DocEntry
                AND (
                  OINV.DocNum IS NULL
                  OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'
                )
            )
          )
          THEN 'Partial'

          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
          WHEN T0.DocStatus='O' THEN 'Open'
          ELSE 'NA'
        END
      ) = '${status}'
    `;
  }

  // 3) Date Filters
  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

  if (excludeCancelled) {
    whereClause += " AND T0.CANCELED = 'N'";
  }

 
  // ✅ Use cardCodes for customer login
  if (!isAdmin && cardCodes.length > 0) {
    whereClause += `  
    AND T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})
  `;
  }

  // ✅ Use contactCodes for salesperson login
  if (!isAdmin && cardCodes.length === 0 && contactCodes.length > 0) {
    whereClause += ` 
    AND T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})
  `;
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
        WHEN (
          T0.DocStatus = 'O'
          AND EXISTS (
            SELECT 1
            FROM RDR1 T1
              LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
                             AND T1.LineNum = DLN1.BaseLine
                             AND DLN1.BaseType = 17
              LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
                             AND DLN1.LineNum = INV1.BaseLine
                             AND INV1.BaseType = 15
              LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
                             AND OINV.CANCELED = 'N'
            WHERE T1.DocEntry = T0.DocEntry
              AND OINV.DocNum IS NOT NULL
              AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
          )
          AND EXISTS (
            SELECT 1
            FROM RDR1 T1
              LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
                             AND T1.LineNum = DLN1.BaseLine
                             AND DLN1.BaseType = 17
              LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
                             AND DLN1.LineNum = INV1.BaseLine
                             AND INV1.BaseType = 15
              LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
                             AND OINV.CANCELED = 'N'
            WHERE T1.DocEntry = T0.DocEntry
              AND (
                OINV.DocNum IS NULL
                OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'
              )
          )
        )
        THEN 'Partial'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
        WHEN T0.DocStatus='O' THEN 'Open'
        ELSE 'NA'
      END AS DocStatus,
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T3.Name AS ContactPerson,
      T0.DocDueDate AS DeliveryDate,
      T0.CardName,
      T0.DocTotal - MAX(T0.VatSum) AS DocTotal,
      T0.U_EmailSentDT   AS EmailSentDT,
     T0.U_EmailSentTM   AS EmailSentTM,

      T0.DocCur,
      T0.DocRate,
      T0.NumAtCard AS CustomerPONo,
      T5.SlpName AS SalesEmployee,
      COUNT(DISTINCT T1.ItemCode) AS ProductCount
    FROM ORDR T0
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode

    WHERE ${whereClause}
    GROUP BY 
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T3.Name,
      T0.DocDueDate,
      T0.CardName,
      T0.DocTotal,
      T0.U_EmailSentDT,
     T0.U_EmailSentTM,
      T0.DocCur,
      T0.DocRate,
      T0.NumAtCard,
      T5.SlpName,
      T0.DocStatus,
      T0.CANCELED
    ORDER BY ${sortField} ${sortDir}
    ${
      getAll ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY`
    };
  `;

  try {
    const [totalResult, rawOrders] = await Promise.all([
      queryDatabase(countQuery),
      queryDatabase(dataQuery),
    ]);

    const totalItems = totalResult[0]?.total || 0;

    // Convert date fields to ISO strings (if using JS Date)
    const orders = rawOrders.map((order) => ({
      ...order,
      DocDate: order.DocDate ? order.DocDate.toISOString() : null,
      DeliveryDate: order.DeliveryDate
        ? order.DeliveryDate.toISOString()
        : null,
      EmailSentDT: order.EmailSentDT ? order.EmailSentDT.toISOString() : null,
      EmailSentTM: order.EmailSentTM ?? null,
    }));

    return {
      orders,
      totalItems: getAll ? orders.length : totalItems,
    };
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
    isAdmin = false,
    contactCodes = [],
    cardCodes = [],
    getAll = false, // New flag
  }) {
    let whereClause = "T1.LineStatus = 'O'";

    // Add search filters - expanded to include all relevant fields
    if (search) {
      whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' OR 
      T0.CardName LIKE '%${search}%' OR 
      T0.NumAtCard LIKE '%${search}%' OR
      T1.ItemCode LIKE '%${search}%' OR
      T1.Dscription LIKE '%${search}%' OR
      T1.U_CasNo LIKE '%${search}%' OR
      T3.SuppCatNum LIKE '%${search}%' OR
      T2.Location LIKE '%${search}%' OR
      T4.ItmsGrpNam LIKE '%${search}%' OR
      T5.SlpName LIKE '%${search}%' OR
      T1.U_timeline LIKE '%${search}%' OR
      T1.U_mkt_feedback LIKE '%${search}%'
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

     if (!isAdmin && cardCodes.length > 0) {
       whereClause += ` 
      AND T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})
    `;
     }
     if (!isAdmin && contactCodes.length > 0) {
       whereClause += ` 
      AND T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})
    `;
     }

    const countQuery = `
    SELECT COUNT(T0.DocEntry) as total
    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OLCT T2 ON T1.LocCode = T2.Code
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
    LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    WHERE ${whereClause};
  `;

    const dataQuery = `
    SELECT 
      CASE 
        WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
        WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'Cancel'
        WHEN T0.DocStatus = 'O' THEN 'Open'
        ELSE 'NA'
      END AS DocumentStatus,
      T0.DocEntry,
      T0.DocNum AS DocumentNumber,
      T0.DocDate AS PostingDate,
      T0.DocRate,
      T0.NumAtCard AS CustomerPONo,
      T0.TaxDate AS PODate,
      T0.CardName AS CustomerVendorName,
      T4.ItmsGrpNam AS ItemGroup,
      T1.ItemCode AS ItemNo,
      T3.SuppCatNum AS MfrCatalogNo,
      T1.Dscription AS ItemName,
      T1.U_CasNo AS CasNo,
      CASE 
        WHEN T1.LineStatus = 'C' THEN 'Closed'
        WHEN T1.LineStatus = 'O' THEN 'Open'
        ELSE 'NA'
      END AS LineStatus,
      ROUND(T1.Quantity, 2) AS Quantity,
      T1.UnitMsr AS UOMName,
      ROUND(T1.OpenQty, 2) AS OpenQty,
      T3.OnHand AS Stock,
      CASE 
        WHEN T3.OnHand >= T1.OpenQty THEN 'In Stock'
        ELSE 'Out of Stock'
      END AS StockStatus,
      T1.U_timeline AS Timeline,
      T6.Name AS ContactPerson,
      T1.U_mkt_feedback AS MktFeedback,
      T1.DelivrdQty AS DeliveredQuantity,
      T1.ShipDate AS DeliveryDate,
      T2.Location AS PlantLocation,
      ROUND(T1.Price, 3) AS Price,
      T1.Currency AS PriceCurrency,
      (T1.OpenQty * T1.Price) AS OpenAmount,
      T5.SlpName AS SalesEmployee
    FROM ORDR T0  
    INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry 
    INNER JOIN OLCT T2 ON T1.LocCode = T2.Code 
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode 
    LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    WHERE ${whereClause}
    ORDER BY T0.DocDate DESC
    ${getAll ? "" : "OFFSET @offset ROWS FETCH NEXT @ITEMS_PER_PAGE ROWS ONLY"}
  `;

    try {
      const queryParams = getAll
        ? []
        : [
            { name: "offset", type: sql.Int, value: offset },
            { name: "ITEMS_PER_PAGE", type: sql.Int, value: ITEMS_PER_PAGE },
          ];

      const [totalResult, rawOrders] = await Promise.all([
        queryDatabase(countQuery),
        queryDatabase(dataQuery, queryParams),
      ]);

      const totalItems = totalResult[0]?.total || 0;
      const orders = rawOrders.map((order) => ({
        ...order,
        PostingDate: order.PostingDate ? order.PostingDate.toISOString() : null,
        PODate: order.PODate ? order.PODate.toISOString() : null,
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