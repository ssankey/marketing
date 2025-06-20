import { queryDatabase } from "../db";
import { getCache, setCache, delCache } from "../redis";
import { verify } from "jsonwebtoken";


import sql from "mssql";

// export async function getInvoicesList(params) {
//   console.time("Total Request Time");

//   const cacheKey = `invoices:list:${JSON.stringify(params)}`;
//   const cachedData = await getCache(cacheKey);
//   if (cachedData) {
//     console.log("Cache hit for invoices list");
//     console.timeEnd("Total Request Time");
//     return cachedData;
//   }

//   console.log("Cache miss for invoices list, querying database");
//   console.time("Total Database Query Time");

//   const {
//     page = 1,
//     search = "",
//     status = "all",
//     fromDate,
//     toDate,
//     sortField = "DocDate",
//     sortDir = "desc",
//     itemsPerPage = 20,
//     isAdmin = false,
//     cardCodes = [],
//     contactCodes = [],
//     getAll = false,
//   } = params;

//   const offset = (parseInt(page, 10) - 1) * itemsPerPage;

//   let whereClause = "1=1";

//   if (search) {
//     whereClause += `
//       AND (
//         T0.DocNum LIKE '%${search}%'
//         OR T0.CardCode LIKE '%${search}%'
//         OR T0.CardName LIKE '%${search}%'
//         OR T0.NumAtCard LIKE '%${search}%'
//         OR T1.ItemCode LIKE '%${search}%'
//         OR T1.Dscription LIKE '%${search}%'
//         OR T2.ItemName LIKE '%${search}%'
//         OR T2.u_Casno LIKE '%${search}%'
//         OR T1.VendorNum LIKE '%${search}%'
//       )
//     `;
//   }

//   if (status !== "all") {
//     whereClause += `
//       AND (
//         CASE 
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
//           WHEN T0.DocStatus='O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
//           WHEN T0.DocStatus='O' THEN 'Open'
//           ELSE 'NA'
//         END
//       ) = '${status}'
//     `;
//   }

//   if (fromDate) {
//     whereClause += ` AND T0.DocDate >= '${fromDate}'`;
//   }
//   if (toDate) {
//     whereClause += ` AND T0.DocDate <= '${toDate}'`;
//   }

//   if (!isAdmin) {
//     if (contactCodes.length > 0) {
//       whereClause += ` AND T0.SlpCode IN (${contactCodes
//         .map((code) => `'${code}'`)
//         .join(",")})`;
//     } else if (cardCodes.length > 0) {
//       whereClause += ` AND T0.CardCode IN (${cardCodes
//         .map((code) => `'${code}'`)
//         .join(",")})`;
//     }
//   }

//   const countQuery = `
//     SELECT COUNT(*) AS total
//     FROM OINV T0
//     JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//     LEFT JOIN OITM T2 ON T1.ItemCode = T2.ItemCode
//     WHERE ${whereClause};
//   `;

//   const dataQuery = `
//     SELECT 
//       T0.DocEntry,
//       T0.DocNum,
//       T0.DocDate AS 'Invoice Posting Dt.',
//       CASE 
//         WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//         WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
//         WHEN T0.DocStatus='O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
//         WHEN T0.DocStatus='O' THEN 'Open'
//         ELSE 'NA'
//       END AS 'Document Status',
//       T0.U_DispatchDate,
//       T4.Remark AS 'Series Name',
//       T0.CardCode AS 'Cust Code',
//       T0.CardName AS 'Customer/Vendor Name',
//       T3.Name AS ContactPerson,
//       T1.BaseRef AS 'SO No',
//       (SELECT TOP 1 DocDate FROM ORDR WHERE DocEntry = T1.BaseEntry) AS 'SO Date',
//       T0.NumAtCard AS 'Customer ref no',
//       (SELECT TOP 1 NumAtCard FROM ORDR WHERE DocEntry = T1.BaseEntry) AS 'SO Customer Ref. No',
//       T0.TrackNo AS 'Tracking Number',
//       T0.DocDueDate AS 'Delivery Date',
//       T0.TaxDate AS 'Dispatch Date',
//       T1.ItemCode AS 'Item No.',
//       T1.VendorNum AS 'Vendor Catalog No.',
//       T1.Dscription AS 'Item/Service Description',
//       (SELECT ItmsGrpNam FROM OITB WHERE ItmsGrpCod = T2.ItmsGrpCod) AS 'Group Name',
//       T1.Quantity AS 'Qty.',
//       T1.unitMsr AS 'Unit',
//       T1.U_PackSize AS 'Packsize',
//       T1.U_CasNo AS 'Cas No',
//       T1.Price AS 'Unit Sales Price',
//       (CASE WHEN T0.CurSource = 'L' THEN T1.LineTotal ELSE T1.TotalFrgn END) AS 'Total Sales Price',
//       T0.DocCur AS 'Document Currency',
//       (SELECT Country FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS 'Country',
//       (SELECT State FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS 'State',
//       T10.PymntGroup AS 'Pymnt Group',
//       CASE 
//         WHEN T0.DocTotal <= T0.PaidToDate THEN 'Paid'
//         WHEN T0.PaidToDate > 0 THEN 'Partially Paid'
//         ELSE 'Unpaid'
//       END AS 'Payment Status',
//       T0.DocRate AS 'Exchange Rate',
//       T5.SlpName AS 'Sales Employee',
//       SHP.TrnspName AS 'Transport Name',
//       T0.VatSum AS 'Tax Amount',
//       T0.Comments AS 'Comments',
//       CRD.GroupCode AS 'Customer Group Code',
//       G.GroupName AS 'Customer Group',
//       C1.GSTRegnNo AS 'GSTIN',
//       T1.LineNum AS 'Line Number',
//       T1.VatGroup AS 'VAT Group'
//     FROM OINV T0
//     JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//     LEFT JOIN OITM T2 ON T1.ItemCode = T2.ItemCode
//     LEFT JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
//     LEFT JOIN NNM1 T4 ON T4.Series = T0.Series
//     LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//     LEFT JOIN OCRD CRD ON T0.CardCode = CRD.CardCode
//     LEFT JOIN OCRG G ON CRD.GroupCode = G.GroupCode
//     LEFT JOIN CRD1 C1 ON T0.CardCode = C1.CardCode AND C1.AdresType = 'S' AND C1.Address = T0.ShipToCode
//     LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
//     LEFT JOIN OCTG T10 ON T10.GroupNum = T0.GroupNum
//     WHERE ${whereClause} AND T0.CANCELED <> 'Y' AND T0.CANCELED <> 'C'
//     ORDER BY [Invoice Posting Dt.] ${sortDir}
//     ${!getAll ? `OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY` : ""}

//   `;

//   const [totalResult, rawData] = await Promise.all([
//     queryDatabase(countQuery),
//     queryDatabase(dataQuery),
//   ]);

//   const totalItems = totalResult?.[0]?.total || 0;

//   const invoices = rawData.map((row) => ({
//     ...row,
//     "Invoice Posting Dt.": row["Invoice Posting Dt."]
//       ? row["Invoice Posting Dt."].toISOString()
//       : null,
//     "SO Date": row["SO Date"] ? row["SO Date"].toISOString() : null,
//     "Delivery Date": row["Delivery Date"]
//       ? row["Delivery Date"].toISOString()
//       : null,
//     "Dispatch Date": row["Dispatch Date"]
//       ? row["Dispatch Date"].toISOString()
//       : null,
//   }));

//   const result = { totalItems, invoices };

//   await setCache(cacheKey, result, 10 * 60);
//   console.timeEnd("Total Database Query Time");
//   console.timeEnd("Total Request Time");

//   return result;
// }
export async function getInvoicesList(params) {
  console.time("Total Request Time");

  const cacheKey = `invoices:list:${JSON.stringify(params)}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    console.log("Cache hit for invoices list");
    console.timeEnd("Total Request Time");
    return cachedData;
  }

  console.log("Cache miss for invoices list, querying database");
  console.time("Total Database Query Time");

  const {
    page = 1,
    search = "",
    status = "all",
    fromDate,
    toDate,
    sortField = "DocDate",
    sortDir = "desc",
    itemsPerPage = 20,
    isAdmin = false,
    cardCodes = [],
    contactCodes = [],
    getAll = false,
  } = params;

  const offset = (parseInt(page, 10) - 1) * itemsPerPage;

  let whereClause = "T0.CANCELED = 'N'";

  if (search) {
    whereClause += `
      AND (
        T0.DocNum LIKE '%${search}%'
        OR T0.CardCode LIKE '%${search}%'
        OR T0.CardName LIKE '%${search}%'
        OR T0.NumAtCard LIKE '%${search}%'
        OR T1.ItemCode LIKE '%${search}%'
        OR T1.Dscription LIKE '%${search}%'
        OR T1.U_CasNo LIKE '%${search}%'
        OR T1.VendorNum LIKE '%${search}%'
        OR T13.DocNum LIKE '%${search}%'
      )
    `;
  }

  if (status !== "all") {
    whereClause += `
      AND (
        CASE 
          WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'N' THEN 'Closed'
          WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'Y' THEN 'Canceled'
          WHEN T0.DocStatus = 'O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
          WHEN T0.DocStatus = 'O' THEN 'Open'
          ELSE 'NA'
        END
      ) = '${status}'
    `;
  }

  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

  if (!isAdmin) {
    if (contactCodes.length > 0) {
      whereClause += ` AND T0.SlpCode IN (${contactCodes
        .map((code) => `'${code}'`)
        .join(",")})`;
    } else if (cardCodes.length > 0) {
      whereClause += ` AND T0.CardCode IN (${cardCodes
        .map((code) => `'${code}'`)
        .join(",")})`;
    }
  }

  // Updated count query with proper joins
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN INV12 B ON T0.DocEntry = B.DocEntry
    LEFT JOIN DLN1 T2 ON T2.ItemCode = T1.ItemCode 
                      AND T2.DocEntry = T1.BaseEntry 
                      AND T1.BaseType = 15 
                      AND T1.BaseLine = T2.LineNum
    LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
    LEFT JOIN RDR1 T12 ON T12.ItemCode = T2.ItemCode 
                       AND T12.DocEntry = T2.BaseEntry 
                       AND T2.BaseType = 17 
                       AND T2.BaseLine = T12.LineNum
    LEFT JOIN ORDR T13 ON T13.DocEntry = T12.DocEntry
    LEFT JOIN OCPR CP ON T13.CntctCode = CP.CntctCode
    LEFT JOIN IBT1 T4 ON T4.CardCode = T3.CardCode 
                      AND T4.ItemCode = T2.ItemCode 
                      AND T4.BaseNum = T3.DocNum 
                      AND T4.BaseEntry = T3.DocEntry 
                      AND T4.BaseType = 15 
                      AND T4.BaseLinNum = T2.LineNum 
                      AND T4.Direction = 1
    LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode 
                       AND T4.BatchNum = T15.BatchNum
    WHERE ${whereClause};
  `;

  // Updated main query with proper joins and field mappings
  const dataQuery = `
    SELECT 
      -- Basic Invoice Info
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate AS 'Invoice Posting Dt.',
      
      -- Sales Order Info (now properly joined)
      T13.DocNum AS 'SO No',
      T13.DocDate AS 'SO Date',
      T13.NumAtCard AS 'Customer ref no',
      
      -- Contact Person (now properly joined)
      CP.Name AS ContactPerson,
      
      -- Item Details
      T1.ItemCode AS 'Item No.',
      T1.Dscription AS 'Item/Service Description',
      T1.U_CasNo AS 'Cas No',
      T1.VendorNum AS 'Vendor Catalog No.',
      T1.U_PackSize AS 'Packsize',
      
      -- Quantity (using proper calculation)
      CASE
        WHEN T4.Quantity IS NOT NULL THEN T4.Quantity
        ELSE T1.Quantity
      END AS 'Qty.',
      
      -- Document Status
      CASE 
        WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'N' THEN 'Closed'
        WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'Y' THEN 'Canceled'
        WHEN T0.DocStatus = 'O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
        WHEN T0.DocStatus = 'O' THEN 'Open'
        ELSE 'NA'
      END AS 'Document Status',
      
      -- Tracking and Dispatch
      T0.TrackNo AS 'Tracking Number',
      T0.U_DispatchDate AS 'Dispatch Date',
      
      -- Pricing (using proper calculation)
      T1.PriceBefDi AS 'Unit Sales Price',
      CASE
        WHEN T1.InvQty = 0 THEN T1.LineTotal
        WHEN T4.Quantity IS NULL THEN T1.LineTotal
        WHEN T1.InvQty <> 0 AND T4.Quantity IS NOT NULL
        THEN (T1.LineTotal / T1.InvQty) * T4.Quantity
        ELSE T1.LineTotal
      END AS 'Total Sales Price',
      
      -- Batch Info & Market Feedback (now properly included)
      T15.U_vendorbatchno AS 'BatchNum',
      T1.U_Mkt_feedback AS 'Mkt_Feedback',
      
      -- Additional fields for compatibility
      T0.CardCode AS 'Cust Code',
      T0.CardName AS 'Customer/Vendor Name',
      T0.DocCur AS 'Document Currency',
      T0.VatSum AS 'Tax Amount',
      T0.Comments AS 'Comments',
      T1.LineNum AS 'Line Number',
      T1.VatGroup AS 'VAT Group',
      
      -- Sales Employee and other info
      T5.SlpName AS 'Sales Employee',
      SHP.TrnspName AS 'Transport Name',
      T10.PymntGroup AS 'Pymnt Group',
      
      -- Payment Status
      CASE 
        WHEN T0.DocTotal <= T0.PaidToDate THEN 'Paid'
        WHEN T0.PaidToDate > 0 THEN 'Partially Paid'
        ELSE 'Unpaid'
      END AS 'Payment Status',
      
      -- Additional address and group info
      (SELECT Country FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS 'Country',
      (SELECT State FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS 'State',
      CRD.GroupCode AS 'Customer Group Code',
      G.GroupName AS 'Customer Group',
      C1.GSTRegnNo AS 'GSTIN',
      T0.DocRate AS 'Exchange Rate'
      
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN INV12 B ON T0.DocEntry = B.DocEntry
    
    -- Delivery Note joins
    LEFT JOIN DLN1 T2 ON T2.ItemCode = T1.ItemCode 
                      AND T2.DocEntry = T1.BaseEntry 
                      AND T1.BaseType = 15 
                      AND T1.BaseLine = T2.LineNum
    LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
    
    -- Sales Order joins
    LEFT JOIN RDR1 T12 ON T12.ItemCode = T2.ItemCode 
                       AND T12.DocEntry = T2.BaseEntry 
                       AND T2.BaseType = 17 
                       AND T2.BaseLine = T12.LineNum
    LEFT JOIN ORDR T13 ON T13.DocEntry = T12.DocEntry
    
    -- Contact Person join
    LEFT JOIN OCPR CP ON T13.CntctCode = CP.CntctCode
    
    -- Batch tracking joins
    LEFT JOIN IBT1 T4 ON T4.CardCode = T3.CardCode 
                      AND T4.ItemCode = T2.ItemCode 
                      AND T4.BaseNum = T3.DocNum 
                      AND T4.BaseEntry = T3.DocEntry 
                      AND T4.BaseType = 15 
                      AND T4.BaseLinNum = T2.LineNum 
                      AND T4.Direction = 1
    LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode 
                       AND T4.BatchNum = T15.BatchNum
    
    -- Additional standard joins
    LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    LEFT JOIN OCRD CRD ON T0.CardCode = CRD.CardCode
    LEFT JOIN OCRG G ON CRD.GroupCode = G.GroupCode
    LEFT JOIN CRD1 C1 ON T0.CardCode = C1.CardCode AND C1.AdresType = 'S' AND C1.Address = T0.ShipToCode
    LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
    LEFT JOIN OCTG T10 ON T10.GroupNum = T0.GroupNum
    
    WHERE ${whereClause}
    ORDER BY T0.DocDate ${sortDir}
    ${!getAll ? `OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY` : ""}
  `;

  const [totalResult, rawData] = await Promise.all([
    queryDatabase(countQuery),
    queryDatabase(dataQuery),
  ]);

  const totalItems = totalResult?.[0]?.total || 0;

  const invoices = rawData.map((row) => ({
    ...row,
    "Invoice Posting Dt.": row["Invoice Posting Dt."]
      ? row["Invoice Posting Dt."].toISOString()
      : null,
    "SO Date": row["SO Date"] ? row["SO Date"].toISOString() : null,
    "Delivery Date": row["Delivery Date"]
      ? row["Delivery Date"].toISOString()
      : null,
    "Dispatch Date": row["Dispatch Date"]
      ? row["Dispatch Date"].toISOString()
      : null,
  }));

  const result = { totalItems, invoices };

  await setCache(cacheKey, result, 10 * 60);
  console.timeEnd("Total Database Query Time");
  console.timeEnd("Total Request Time");

  return result;
}

export async function getInvoiceDetail(docEntry, docNum) {
  const cacheKey = `invoice:detail:${docEntry}:${docNum}`;
  const cachedInvoice = await getCache(cacheKey);
  if (cachedInvoice) {
    console.log(`Cache hit for invoice detail ${docEntry}:${docNum}`);
    return cachedInvoice;
  }

  console.log(
    `Cache miss for invoice detail ${docEntry}:${docNum}, querying database`
  );

  docEntry = parseInt(docEntry, 10);
  docNum = parseInt(docNum, 10);

  // Common columns for both invoice and credit note queries
  const invoiceHeaderQuery = `
    SELECT * FROM (
      SELECT 
        'IN' AS Type,
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
        T0.PaidToDate AS AmountPaid,
        T0.DpmAmnt,
        T0.DpmVat,
        T0.CurSource,
        T0.DocRate,
        T0.NumAtCard AS CustomerPONo,
        CASE 
          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
          WHEN T0.DocStatus='O' THEN 'Open' 
          ELSE 'NA' 
        END AS DocStatusDisplay,
        CASE 
          WHEN T0.DocTotal <= T0.PaidToDate THEN 'Paid'
          WHEN T0.PaidToDate > 0 THEN 'Partially Paid'
          ELSE 'Unpaid'
        END AS PaymentStatus,
        CASE 
          WHEN T0.CurSource='L' AND T0.DpmAmnt <> 0 THEN (T0.DpmAmnt + T0.DpmVat)
          ELSE T0.DocTotal
        END AS InvoiceTotal,
        (T0.DocTotal - T0.VatSum - T0.TotalExpns + T0.DiscSum) AS Subtotal,
        NULL AS ContactPerson -- Placeholder for credit note query
      FROM OINV T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      LEFT JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum

      UNION ALL

      SELECT 
        'CN' AS Type,
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
        T0.PaidToDate AS AmountPaid,
        T0.DpmAmnt,
        T0.DpmVat,
        T0.CurSource,
        T0.DocRate,
        T0.NumAtCard AS CustomerPONo,
        CASE 
          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
          WHEN T0.DocStatus='O' THEN 'Open' 
          ELSE 'NA' 
        END AS DocStatusDisplay,
        CASE 
          WHEN T0.DocTotal <= T0.PaidToDate THEN 'Paid'
          WHEN T0.PaidToDate > 0 THEN 'Partially Paid'
          ELSE 'Unpaid'
        END AS PaymentStatus,
        -CASE 
          WHEN T0.CurSource='L' THEN T0.DocTotal 
          ELSE T0.DocTotalFC 
        END AS InvoiceTotal,
        -(T0.DocTotal - T0.VatSum - T0.TotalExpns + T0.DiscSum) AS Subtotal,
        T3.Name AS ContactPerson
      FROM ORIN T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      LEFT JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
      LEFT JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
    ) AS A
    WHERE A.DocEntry = ${docEntry} AND A.DocNum = ${docNum}
  `;



//   const invoiceLinesQuery = `
//   SELECT * FROM (
//     SELECT 
//       'IN' AS Type,
//       T1.LineNum,
//       T1.ItemCode,
//       T1.Dscription AS Description,
//       T1.Quantity,
//       T1.UnitMsr,
//       T1.Price,
//       T1.LineTotal,
//       T1.Currency,
//       T1.WhsCode,
//       T1.ShipDate,
//       T1.TaxCode,
//       T1.VatPrcnt AS TaxPercent,
//       T1.DiscPrcnt AS DiscountPercent,
//       T1.U_CasNo AS CasNo,
//       CASE 
//         WHEN T1.LineStatus = 'O' THEN 'Open'
//         WHEN T1.LineStatus = 'C' THEN 'Closed'
//         ELSE 'NA'
//       END AS LineStatus,
//       CASE
//         WHEN EXISTS (
//           SELECT 1 FROM DLN1 D
//           WHERE D.BaseEntry = T1.DocEntry AND D.BaseLine = T1.LineNum
//         ) THEN 'Delivered'
//         ELSE 'Pending'
//       END AS DeliveryStatus,
//       T13.DocNum AS SONumber,
//       T13.DocDate AS SODate,
//       T13.NumAtCard AS SOCustomerRefNo,
//       ISNULL((
//         SELECT TOP 1 T4.BatchNum
//         FROM IBT1 T4
//         INNER JOIN ODLN T3 ON T3.DocEntry = T4.BaseEntry AND T4.BaseType = 15
//         INNER JOIN DLN1 T2 ON T2.DocEntry = T3.DocEntry AND T2.ItemCode = T4.ItemCode
//         WHERE T4.BaseEntry = T1.DocEntry AND T4.BaseLinNum = T1.LineNum
//       ), '') AS BatchNum,
//       (SELECT TOP 1 Indate FROM OBTN WHERE ItemCode = T1.ItemCode AND DistNumber = (
//         SELECT TOP 1 T4.BatchNum
//         FROM IBT1 T4
//         INNER JOIN ODLN T3 ON T3.DocEntry = T4.BaseEntry AND T4.BaseType = 15
//         INNER JOIN DLN1 T2 ON T2.DocEntry = T3.DocEntry AND T2.ItemCode = T4.ItemCode
//         WHERE T4.BaseEntry = T1.DocEntry AND T4.BaseLinNum = T1.LineNum
//       )) AS InwardDate
//     FROM INV1 T1
//     LEFT JOIN DLN1 D ON D.BaseEntry = T1.DocEntry AND D.BaseLine = T1.LineNum
//     LEFT JOIN RDR1 R ON R.DocEntry = D.BaseEntry AND R.LineNum = D.BaseLine AND D.BaseType = 17
//     LEFT JOIN ORDR T13 ON T13.DocEntry = R.DocEntry
//     WHERE T1.DocEntry = ${docEntry}
  
//     UNION ALL
  
//     SELECT 
//       'CN' AS Type,
//       T1.LineNum,
//       T1.ItemCode,
//       T1.Dscription AS Description,
//       -T1.Quantity AS Quantity,
//       T1.UnitMsr,
//       -T1.Price AS Price,
//       -T1.LineTotal AS LineTotal,
//       T1.Currency,
//       T1.WhsCode,
//       T1.ShipDate,
//       T1.TaxCode,
//       T1.VatPrcnt AS TaxPercent,
//       T1.DiscPrcnt AS DiscountPercent,
//       T1.U_CasNo AS CasNo,
//       CASE 
//         WHEN T1.LineStatus = 'O' THEN 'Open'
//         WHEN T1.LineStatus = 'C' THEN 'Closed'
//         ELSE 'NA'
//       END AS LineStatus,
//       'N/A' AS DeliveryStatus,
//       NULL AS SONumber,
//       NULL AS SODate,
//       NULL AS SOCustomerRefNo,
//       '' AS BatchNum,
//       NULL AS InwardDate
//     FROM RIN1 T1
//     WHERE T1.DocEntry = ${docEntry}
//   ) AS A
//   ORDER BY A.LineNum ASC;
// `;

// const invoiceLinesQuery = `
// SELECT * FROM (
//   SELECT 
//     'IN' AS Type,
//     T1.LineNum,
//     T1.ItemCode,
//     T1.Dscription AS Description,
//     T1.Quantity,
//     T1.UnitMsr,
//     T1.Price,
//     T1.LineTotal,
//     T1.Currency,
//     T1.WhsCode,
//     T1.ShipDate,
//     T1.TaxCode,
//     T1.VatPrcnt AS TaxPercent,
//     T1.DiscPrcnt AS DiscountPercent,
//     T1.U_CasNo AS CasNo,
//     CASE 
//       WHEN T1.LineStatus = 'O' THEN 'Open'
//       WHEN T1.LineStatus = 'C' THEN 'Closed'
//       ELSE 'NA'
//     END AS LineStatus,
//     CASE
//       WHEN EXISTS (
//         SELECT 1 FROM DLN1 D
//         WHERE D.BaseEntry = T1.DocEntry AND D.BaseLine = T1.LineNum
//       ) THEN 'Delivered'
//       ELSE 'Pending'
//     END AS DeliveryStatus,
//     T13.DocNum AS SONumber,
//     T13.DocDate AS SODate,
//     T13.NumAtCard AS SOCustomerRefNo,
//     ISNULL((
//       SELECT TOP 1 T4.BatchNum
//       FROM IBT1 T4
//       INNER JOIN ODLN T3 ON T3.DocEntry = T4.BaseEntry AND T4.BaseType = 15
//       INNER JOIN DLN1 T2 ON T2.DocEntry = T3.DocEntry AND T2.ItemCode = T4.ItemCode
//       WHERE T4.BaseEntry = T1.DocEntry AND T4.BaseLinNum = T1.LineNum
//     ), '') AS BatchNum,
//     (SELECT TOP 1 T15.U_vendorbatchno
//      FROM IBT1 T4
//      INNER JOIN ODLN T3 ON T3.DocEntry = T4.BaseEntry AND T4.BaseType = 15
//      INNER JOIN DLN1 T2 ON T2.DocEntry = T3.DocEntry AND T2.ItemCode = T4.ItemCode
//      INNER JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode AND T4.BatchNum = T15.BatchNum
//      WHERE T4.BaseEntry = T1.DocEntry AND T4.BaseLinNum = T1.LineNum
//     ) AS VendorBatchNum,
//     (SELECT TOP 1 Indate FROM OBTN WHERE ItemCode = T1.ItemCode AND DistNumber = (
//       SELECT TOP 1 T4.BatchNum
//       FROM IBT1 T4
//       INNER JOIN ODLN T3 ON T3.DocEntry = T4.BaseEntry AND T4.BaseType = 15
//       INNER JOIN DLN1 T2 ON T2.DocEntry = T3.DocEntry AND T2.ItemCode = T4.ItemCode
//       WHERE T4.BaseEntry = T1.DocEntry AND T4.BaseLinNum = T1.LineNum
//     )) AS InwardDate
//   FROM INV1 T1
//   LEFT JOIN DLN1 D ON D.BaseEntry = T1.DocEntry AND D.BaseLine = T1.LineNum
//   LEFT JOIN RDR1 R ON R.DocEntry = D.BaseEntry AND R.LineNum = D.BaseLine AND D.BaseType = 17
//   LEFT JOIN ORDR T13 ON T13.DocEntry = R.DocEntry
//   WHERE T1.DocEntry = ${docEntry}

//   UNION ALL

//   SELECT 
//     'CN' AS Type,
//     T1.LineNum,
//     T1.ItemCode,
//     T1.Dscription AS Description,
//     -T1.Quantity AS Quantity,
//     T1.UnitMsr,
//     -T1.Price AS Price,
//     -T1.LineTotal AS LineTotal,
//     T1.Currency,
//     T1.WhsCode,
//     T1.ShipDate,
//     T1.TaxCode,
//     T1.VatPrcnt AS TaxPercent,
//     T1.DiscPrcnt AS DiscountPercent,
//     T1.U_CasNo AS CasNo,
//     CASE 
//       WHEN T1.LineStatus = 'O' THEN 'Open'
//       WHEN T1.LineStatus = 'C' THEN 'Closed'
//       ELSE 'NA'
//     END AS LineStatus,
//     'N/A' AS DeliveryStatus,
//     NULL AS SONumber,
//     NULL AS SODate,
//     NULL AS SOCustomerRefNo,
//     '' AS BatchNum,
//     '' AS VendorBatchNum,
//     NULL AS InwardDate
//   FROM RIN1 T1
//   WHERE T1.DocEntry = ${docEntry}
// ) AS A
// ORDER BY A.LineNum ASC;
// `;

    const invoiceLinesQuery = `
SELECT * FROM (
  SELECT 
    'IN' AS Type,
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
    T1.VatPrcnt AS TaxPercent,
    T1.DiscPrcnt AS DiscountPercent,
    T1.U_CasNo AS CasNo,
    CASE 
      WHEN T1.LineStatus = 'O' THEN 'Open'
      WHEN T1.LineStatus = 'C' THEN 'Closed'
      ELSE 'NA'
    END AS LineStatus,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM DLN1 D
        WHERE D.BaseEntry = T1.DocEntry AND D.BaseLine = T1.LineNum
      ) THEN 'Delivered'
      ELSE 'Pending'
    END AS DeliveryStatus,
    T13.DocNum AS SONumber,
    T13.DocDate AS SODate,
    T13.NumAtCard AS SOCustomerRefNo,
    ISNULL(T4.BatchNum, '') AS BatchNum,
    ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum,
    (SELECT TOP 1 Indate FROM OBTN WHERE ItemCode = T1.ItemCode AND DistNumber = T4.BatchNum) AS InwardDate
  FROM INV1 T1
  LEFT JOIN DLN1 T2 ON T2.ItemCode = T1.ItemCode AND T2.DocEntry = T1.BaseEntry AND T1.BaseType = 15 AND T1.BaseLine = T2.LineNum
  LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
  LEFT JOIN RDR1 T12 ON T12.ItemCode = T2.ItemCode AND T12.DocEntry = T2.BaseEntry AND T2.BaseType = 17 AND T2.BaseLine = T12.LineNum
  LEFT JOIN ORDR T13 ON T13.DocEntry = T12.DocEntry
  LEFT JOIN IBT1 T4 ON T4.CardCode = T3.CardCode AND T4.ItemCode = T2.ItemCode AND T4.BaseNum = T3.DocNum AND T4.BaseEntry = T3.DocEntry AND T4.BaseType = 15 AND T4.BaseLinNum = T2.LineNum AND T4.Direction = 1
  LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode AND T4.BatchNum = T15.BatchNum
  WHERE T1.DocEntry = ${docEntry}

  UNION ALL

  SELECT 
    'CN' AS Type,
    T1.LineNum,
    T1.ItemCode,
    T1.Dscription AS Description,
    -T1.Quantity AS Quantity,
    T1.UnitMsr,
    -T1.Price AS Price,
    -T1.LineTotal AS LineTotal,
    T1.Currency,
    T1.WhsCode,
    T1.ShipDate,
    T1.TaxCode,
    T1.VatPrcnt AS TaxPercent,
    T1.DiscPrcnt AS DiscountPercent,
    T1.U_CasNo AS CasNo,
    CASE 
      WHEN T1.LineStatus = 'O' THEN 'Open'
      WHEN T1.LineStatus = 'C' THEN 'Closed'
      ELSE 'NA'
    END AS LineStatus,
    'N/A' AS DeliveryStatus,
    NULL AS SONumber,
    NULL AS SODate,
    NULL AS SOCustomerRefNo,
    '' AS BatchNum,
    '' AS VendorBatchNum,
    NULL AS InwardDate
  FROM RIN1 T1
  WHERE T1.DocEntry = ${docEntry}
) AS A
ORDER BY A.LineNum ASC;
`;

  const [invoiceHeader] = await queryDatabase(invoiceHeaderQuery);
  const invoiceLines = await queryDatabase(invoiceLinesQuery);

  if (!invoiceHeader) {
    return null;
  }

  const invoice = {
    ...invoiceHeader,
    LineItems: invoiceLines,
  };

  await setCache(cacheKey, invoice, 30 * 60);
  return invoice;
}
export async function invalidateInvoiceCache(docEntry, docNum) {
  // Invalidate the specific invoice detail cache
  await delCache(`invoice:detail:${docEntry}:${docNum}`);
  console.log(`Invoice ${docEntry}:${docNum} updated - cache invalidated`);
  return true;
}

export async function getInvoiceStatusFlow(docEntry) {
  // Create a cache key for the invoice status flow
  const cacheKey = `invoice:status:${docEntry}`;

  // Try to get data from cache first
  const cachedStatus = await getCache(cacheKey);
  if (cachedStatus) {
    console.log(`Cache hit for invoice status ${docEntry}`);
    return cachedStatus;
  }

  console.log(`Cache miss for invoice status ${docEntry}, querying database`);

  const statusQuery = `
    SELECT 
      T0.DocEntry,
      T0.DocNum as InvoiceNum,
      T0.DocStatus as InvoiceStatus,
      T0.PaidToDate,
      T0.DocTotal,
      T3.DocNum as DeliveryNum,
      T3.DocStatus as DeliveryStatus,
      T13.DocNum as OrderNum,
      T13.DocStatus as OrderStatus,
      CASE 
        WHEN T0.PaidToDate >= T0.DocTotal THEN 'Paid'
        WHEN T0.PaidToDate > 0 THEN 'Partially Paid'
        ELSE 'Unpaid'
      END as PaymentStatus
    FROM OINV T0  
    LEFT JOIN DLN1 T2 ON T2.DocEntry = T0.BaseEntry AND T0.BaseType = 15
    LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
    LEFT JOIN RDR1 T12 ON T12.DocEntry = T2.BaseEntry AND T2.BaseType = 17
    LEFT JOIN ORDR T13 ON T13.DocEntry = T12.DocEntry
    WHERE T0.DocEntry = ${docEntry}`;

  const [status] = await queryDatabase(statusQuery);

  // Cache the result for 15 minutes - status changes less frequently than details
  if (status) {
    await setCache(cacheKey, status, 15 * 60);
  }

  return status;
}

// Function to update invoice with API route handling
export async function updateInvoice(docEntry, docNum, updateData) {
  try {
    await invalidateInvoiceCache(docEntry, docNum);
    await delCache(`invoice:status:${docEntry}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating invoice:", error);
    return { success: false, error: error.message };
  }
}

export async function getUniqueInvoicesList(params) {
  const {
    page = 1,
    search = "",
    status = "all",
    fromDate,
    toDate,
    sortField = "DocDate",
    sortDir = "desc",
    itemsPerPage = 20,
    isAdmin = false,
    cardCodes = [],
    contactCodes = [],
    pendingDispatch = false,
    getAll = false, // ✅ Excel export flag
  } = params;

  const offset = (parseInt(page, 10) - 1) * itemsPerPage;
  let whereClause = "1=1";

  whereClause += ` AND T0.CANCELED = 'N'`;

  if (pendingDispatch) {
    whereClause += " AND T0.U_DispatchDate IS NULL";
  }

  // 🔍 Search filter
  if (search) {
    whereClause += `
      AND (
        T0.DocNum LIKE '%${search}%'
        OR T0.CardCode LIKE '%${search}%'
        OR T0.CardName LIKE '%${search}%'
        OR T0.NumAtCard LIKE '%${search}%'
      )
    `;
  }

  // 📦 Status filter
  if (status !== "all") {
    whereClause += ` 
      AND (
        CASE 
          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
          WHEN T0.DocStatus='O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
          WHEN T0.DocStatus='O' THEN 'Open'
          ELSE 'NA'
        END
      ) = '${status}'
    `;
  }

  // 📅 Date filters
  if (fromDate) whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  if (toDate) whereClause += ` AND T0.DocDate <= '${toDate}'`;

  // 👤 Customer restriction for non-admin
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

  // 🔢 Pagination logic
  const limitClause = getAll
    ? ""
    : `ORDER BY ${sortField} ${sortDir} OFFSET ${offset} ROWS FETCH NEXT ${itemsPerPage} ROWS ONLY`;

  // 🧮 Count query (skip if exporting all)
  const countQuery = `SELECT COUNT(*) AS total FROM OINV T0 WHERE ${whereClause}`;

  // 📋 Main data query
  const dataQuery = `
    SELECT 
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T0.DocDueDate,
      T0.TaxDate,
      T0.U_EmailSentDT,
      T0.U_EmailSentTM,
      T0.DocStatus,
      T0.CANCELED,
      T0.CardCode,
      T0.CardName,
      T0.NumAtCard AS CustomerPONo,
      
      T0.TrackNo,
      T0.U_DispatchDate,
      T0.DocTotal,
      T0.PaidToDate,
      T0.VatSum,
      T0.DocCur,
      T0.DocRate,
      T0.Comments,
      T0.Series,
      T0.SlpCode,
      T0.TrnspCode,
      T0.GroupNum,
      T0.CurSource,
      T0.ShipToCode,
      T3.Name AS ContactPerson,

      -- Status display
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
        WHEN T0.DocStatus='O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
        WHEN T0.DocStatus='O' THEN 'Open'
        ELSE 'NA'
      END AS DocStatusDisplay,

      -- Payment display
      CASE 
        WHEN T0.DocTotal <= T0.PaidToDate THEN 'Paid'
        WHEN T0.PaidToDate > 0 THEN 'Partially Paid'
        ELSE 'Unpaid'
      END AS PaymentStatus,

      T4.Remark AS SeriesName,
      T5.SlpName AS SalesEmployee,
      SHP.TrnspName AS TransportName,
      T10.PymntGroup AS PaymentGroup,
      CRD.GroupCode AS CustomerGroupCode,
      G.GroupName AS CustomerGroup,

      -- Subqueries for Country and State
      (SELECT Country FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS Country,
      (SELECT State FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS State,

      C1.GSTRegnNo AS GSTIN,
      (SELECT COUNT(*) FROM INV1 WHERE DocEntry = T0.DocEntry) AS LineItemCount

    FROM OINV T0
    LEFT JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
    LEFT JOIN NNM1 T4 ON T4.Series = T0.Series
    LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    LEFT JOIN OCRD CRD ON T0.CardCode = CRD.CardCode
    LEFT JOIN OCRG G ON CRD.GroupCode = G.GroupCode
    LEFT JOIN CRD1 C1 ON T0.CardCode = C1.CardCode AND C1.AdresType = 'S' AND C1.Address = T0.ShipToCode
    LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
    LEFT JOIN OCTG T10 ON T10.GroupNum = T0.GroupNum
    WHERE ${whereClause}
    ${limitClause};
  `;

  // 🔄 Run both queries in parallel
  const [totalResult, rawData] = await Promise.all([
    getAll ? Promise.resolve([{ total: 0 }]) : queryDatabase(countQuery),
    queryDatabase(dataQuery),
  ]);

  // 🧾 Format results
  const totalItems = totalResult?.[0]?.total || rawData.length;
  const invoices = rawData.map((row) => ({
    ...row,
    DocDate: row.DocDate ? row.DocDate.toISOString() : null,
    DocDueDate: row.DocDueDate ? row.DocDueDate.toISOString() : null,
    TaxDate: row.TaxDate ? row.TaxDate.toISOString() : null,
    U_DispatchDate: row.U_DispatchDate
      ? row.U_DispatchDate.toISOString()
      : null,
  }));

  return { totalItems, invoices };
}

//lib/models/invoices




// export async function getCustomerBalance() {
//   const query = `
//     SELECT
//       T13.DocNum AS [Invoice No],
//       T13.DocDate AS [AR Invoice Date],
//       T0.[DocNum]              AS 'SO#',
//       T0.[DocDate]             AS 'SO Date',
//       T13.DocDueDate,
//       T13.CardCode,
//       T13.CardName,
//       T16.[Name]               AS 'Contact Person',
//       T14.[Country]            AS 'Country',
//       T17.[State]              AS 'State',
//       T13.DocTotal AS [Invoice Total],
//       (T13.DocTotal - T13.PaidToDate) AS [BalanceDue],
//       T13.[U_Airlinename]      AS [AirlineName],
//       T13.[trackNo]            AS [TrackingNo],
//       T13.NumAtCard As 'CustomerPONo',
//       DATEDIFF(DAY, T13.DocDueDate, GETDATE()) AS [OverdueDays],
//       T15.PymntGroup,
//       T50.SlpName,
//       T13.[TaxDate]            AS 'Dispatch Date'
//     FROM OINV T13
//     INNER JOIN ORDR T0  ON T0.[DocEntry] = T13.[DocEntry]
//     INNER JOIN INV1 T1 ON T13.DocEntry = T1.DocEntry
//     INNER JOIN OITM T10 ON T10.ItemCode = T1.ItemCode
//     INNER JOIN OITB T11 ON T11.ItmsGrpCod = T10.ItmsGrpCod
//     INNER JOIN OCRD T14 ON T13.CardCode = T14.CardCode
//     INNER JOIN OCPR T16 ON T14.[CardCode] = T16.[CardCode]
//     INNER JOIN CRD1 T17 ON T14.[CardCode] = T17.[CardCode]
//     INNER JOIN OCTG T15 ON T14.GroupNum = T15.GroupNum
//     LEFT JOIN OSLP T50 ON T50.SlpCode = T13.SlpCode
//     WHERE (T13.DocTotal - T13.PaidToDate) > 0
//     GROUP BY
//       T13.DocNum, T0.[DocNum] ,T0.[DocDate]   ,T13.DocDate, T13.DocDueDate, T13.CardCode, T13.CardName,T16.[Name],T14.[Country] ,T17.[State],
//       T13.DocTotal, T13.[U_Airlinename],T13.PaidToDate, T13.[trackNo] ,T13.NumAtCard, T15.PymntGroup, T50.SlpName,T13.[TaxDate] 
//     ORDER BY [AR Invoice Date] DESC
//   `;
//   const data = await queryDatabase(query);
//   return { data, totalItems: data.length };
// }


export async function getCustomerBalance(req) {
  // Extract authentication info from request
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or malformed Authorization header');
  }

  const token = authHeader.split(' ')[1];
  let decoded;

  try {
    decoded = verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("Token verification failed:", err);
    throw new Error('Token verification failed');
  }

  const isAdmin = decoded.role === 'admin';
  const isSalesPerson = decoded.role === 'sales_person';
  const isContactPerson = decoded.role === 'contact_person';
  const contactCodes = decoded.contactCodes || [];
  const cardCodes = decoded.cardCodes || [];

  // Build role-based WHERE conditions
  const roleConditions = [];
  if (!isAdmin) {
    if (isContactPerson && contactCodes.length > 0) {
      roleConditions.push(`T13.CntctCode IN (${contactCodes.map(c => `'${c}'`).join(',')})`);
    } else if (cardCodes.length > 0) {
      roleConditions.push(`T13.CardCode IN (${cardCodes.map(c => `'${c}'`).join(',')})`);
    } else if (isSalesPerson && contactCodes.length > 0) {
      // For sales person, filter by their assigned customers
      roleConditions.push(`T13.SlpCode IN (${contactCodes.map(c => `'${c}'`).join(',')})`);
    } else {
      throw new Error('No access: insufficient permissions');
    }
  }

  const query = `
    SELECT
      T13.DocNum AS [Invoice No],
      T13.DocDate AS [AR Invoice Date],
      T0.[DocNum]              AS 'SO#',
      T0.[DocDate]             AS 'SO Date',
      T13.DocDueDate,
      T13.CardCode,
      T13.CardName,
      T16.[Name]               AS 'Contact Person',
      T14.[Country]            AS 'Country',
      T17.[State]              AS 'State',
      T13.DocTotal AS [Invoice Total],
      (T13.DocTotal - T13.PaidToDate) AS [BalanceDue],
      T13.[U_Airlinename]      AS [AirlineName],
      T13.[trackNo]            AS [TrackingNo],
      T13.NumAtCard As 'CustomerPONo',
      DATEDIFF(DAY, T13.DocDueDate, GETDATE()) AS [OverdueDays],
      T15.PymntGroup,
      T50.SlpName,
      T13.[TaxDate]            AS 'Dispatch Date'
    FROM OINV T13
    INNER JOIN ORDR T0  ON T0.[DocEntry] = T13.[DocEntry]
    INNER JOIN INV1 T1 ON T13.DocEntry = T1.DocEntry
    INNER JOIN OITM T10 ON T10.ItemCode = T1.ItemCode
    INNER JOIN OITB T11 ON T11.ItmsGrpCod = T10.ItmsGrpCod
    INNER JOIN OCRD T14 ON T13.CardCode = T14.CardCode
    INNER JOIN OCPR T16 ON T14.[CardCode] = T16.[CardCode]
    INNER JOIN CRD1 T17 ON T14.[CardCode] = T17.[CardCode]
    INNER JOIN OCTG T15 ON T14.GroupNum = T15.GroupNum
    LEFT JOIN OSLP T50 ON T50.SlpCode = T13.SlpCode
    WHERE (T13.DocTotal - T13.PaidToDate) > 0
    ${roleConditions.length > 0 ? 'AND ' + roleConditions.join(' AND ') : ''}
    GROUP BY
      T13.DocNum, T0.[DocNum] ,T0.[DocDate]   ,T13.DocDate, T13.DocDueDate, T13.CardCode, T13.CardName,T16.[Name],T14.[Country] ,T17.[State],
      T13.DocTotal, T13.[U_Airlinename],T13.PaidToDate, T13.[trackNo] ,T13.NumAtCard, T15.PymntGroup, T50.SlpName,T13.[TaxDate] 
    ORDER BY [AR Invoice Date] DESC
  `;

  const data = await queryDatabase(query);
  return { data, totalItems: data.length };
}