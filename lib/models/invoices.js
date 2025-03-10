// lib/models/invoice.js
// lib/models/invoice.js
import { queryDatabase } from "../db";

export async function getInvoicesList(params) {
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
  } = params;

  const offset = (parseInt(page, 10) - 1) * itemsPerPage;

  // -----------------------------------------
  // 1. Build the WHERE clause
  // -----------------------------------------
  let whereClause = "1=1";

  // (A) Search across invoice header & line-item/product fields
  if (search) {
    whereClause += `
      AND (
        T0.DocNum LIKE '%${search}%'
        OR T0.CardCode LIKE '%${search}%'
        OR T0.CardName LIKE '%${search}%'
        OR T0.NumAtCard LIKE '%${search}%'
        OR T1.ItemCode LIKE '%${search}%'
        OR T1.Dscription LIKE '%${search}%'
        OR T2.ItemName LIKE '%${search}%'
        OR T2.u_Casno LIKE '%${search}%'
        OR T1.VendorNum LIKE '%${search}%'
        )
    `;
  }

  // (B) Status filter
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

  // (C) Date filters
  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

  // (D) Role-based restriction
  if (!isAdmin && cardCodes.length > 0) {
    whereClause += ` 
      AND T0.CardCode IN (
        ${cardCodes.map((code) => `'${code}'`).join(",")}
      )
    `;
  }

  // -----------------------------------------
  // 2. Count Query (rows = line items)
  // -----------------------------------------
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM OINV T0
    JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    LEFT JOIN OITM T2 ON T1.ItemCode = T2.ItemCode
    WHERE ${whereClause};
  `;

  // -----------------------------------------
  // 3. Data Query (each row is product-wise) - Enhanced to include all columns
  // -----------------------------------------
  const dataQuery = `
    SELECT 
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate AS 'Invoice Posting Dt.',
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
        WHEN T0.DocStatus='O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
        WHEN T0.DocStatus='O' THEN 'Open'
        ELSE 'NA'
      END AS 'Document Status',
      T4.Remark AS 'Series Name',
      T0.CardCode AS 'Cust Code',
      T0.CardName AS 'Customer/Vendor Name',
      T1.BaseRef AS 'SO No',
      (SELECT TOP 1 DocDate FROM ORDR WHERE DocEntry = T1.BaseEntry) AS 'SO Date',
      T0.NumAtCard AS 'Customer ref no',
      (SELECT TOP 1 NumAtCard FROM ORDR WHERE DocEntry = T1.BaseEntry) AS 'SO Customer Ref. No',
      T0.TrackNo AS 'Tracking Number',
      T0.DocDueDate AS 'Delivery Date',
      T0.TaxDate AS 'Dispatch Date',
      T1.ItemCode AS 'Item No.',
      T1.VendorNum AS 'Vendor Catalog No.',
      T1.Dscription AS 'Item/Service Description',
      (SELECT ItmsGrpNam FROM OITB WHERE ItmsGrpCod = T2.ItmsGrpCod) AS 'Group Name',
      T9.BatchNum AS 'BatchNum',
      T1.Quantity AS 'Qty.',
      T1.unitMsr AS 'Unit',
      T1.U_PackSize AS 'Packsize',
      T1.U_CasNo AS 'Cas No',
      T1.Price AS 'Unit Sales Price',
      (CASE WHEN T0.CurSource = 'L' THEN T1.LineTotal ELSE T1.TotalFrgn END) AS 'Total Sales Price',
      T0.DocCur AS 'Document Currency',
      (SELECT Country FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS 'Country',
      (SELECT State FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS 'State',
      T10.PymntGroup AS 'Pymnt Group',
      -- Additional useful fields from original getInvoicesList
      CASE 
        WHEN T0.DocTotal <= T0.PaidToDate THEN 'Paid'
        WHEN T0.PaidToDate > 0 THEN 'Partially Paid'
        ELSE 'Unpaid'
      END AS 'Payment Status',
      T0.DocRate AS 'Exchange Rate',
      T5.SlpName AS 'Sales Employee',
      SHP.TrnspName AS 'Transport Name',
      T0.VatSum AS 'Tax Amount',
      T0.Comments AS 'Comments',
      CRD.GroupCode AS 'Customer Group Code',
      G.GroupName AS 'Customer Group',
      C1.GSTRegnNo AS 'GSTIN',
      T1.LineNum AS 'Line Number',
      T1.VatGroup AS 'VAT Group'
    FROM OINV T0
    JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    LEFT JOIN OITM T2 ON T1.ItemCode = T2.ItemCode
    LEFT JOIN NNM1 T4 ON T4.Series = T0.Series
    LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    LEFT JOIN OCRD CRD ON T0.CardCode = CRD.CardCode
    LEFT JOIN OCRG G ON CRD.GroupCode = G.GroupCode
    LEFT JOIN CRD1 C1 ON T0.CardCode = C1.CardCode AND C1.AdresType = 'S' AND C1.Address = T0.ShipToCode
    LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
    -- Joins to fetch batch details:
    LEFT JOIN DLN1 T7 ON T7.ItemCode = T1.ItemCode 
         AND T7.DocEntry = T1.BaseEntry 
         AND T1.BaseType = 15 
         AND T1.BaseLine = T7.LineNum
    LEFT JOIN ODLN T8 ON T8.DocEntry = T7.DocEntry
    LEFT JOIN IBT1 T9 ON T9.BsDocType = 17 
         AND T9.CardCode = T8.CardCode 
         AND T9.ItemCode = T7.ItemCode 
         AND T9.BaseNum = T8.DocNum 
         AND T9.BaseEntry = T8.DocEntry 
         AND T9.BaseType = 15 
         AND T9.BaseLinNum = T7.LineNum 
         AND T9.Direction = 1
    -- Join OCTG to fetch Payment Group based on GroupNum
    LEFT JOIN OCTG T10 ON T10.GroupNum = T0.GroupNum
    WHERE ${whereClause} AND T0.CANCELED <> 'Y' AND T0.CANCELED <> 'C'
    
    UNION ALL
    
    -- Adding Credit Notes (ORIN) to the results
    SELECT 
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate AS 'Invoice Posting Dt.',
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
        WHEN T0.DocStatus='O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
        WHEN T0.DocStatus='O' THEN 'Open'
        ELSE 'NA'
      END AS 'Document Status',
      T4.Remark AS 'Series Name',
      T0.CardCode AS 'Cust Code',
      T0.CardName AS 'Customer/Vendor Name',
      T1.BaseRef AS 'SO No',
      (SELECT TOP 1 DocDate FROM ORDR WHERE DocEntry = T1.BaseEntry) AS 'SO Date',
      T0.NumAtCard AS 'Customer ref no',
      (SELECT TOP 1 NumAtCard FROM ORDR WHERE DocEntry = T1.BaseEntry) AS 'SO Customer Ref. No',
      T0.TrackNo AS 'Tracking Number',
      T0.DocDueDate AS 'Delivery Date',
      T0.TaxDate AS 'Dispatch Date',
      T1.ItemCode AS 'Item No.',
      T1.VendorNum AS 'Vendor Catalog No.',
      T1.Dscription AS 'Item/Service Description',
      (SELECT ItmsGrpNam FROM OITB WHERE ItmsGrpCod = T2.ItmsGrpCod) AS 'Group Name',
      T9.BatchNum AS 'BatchNum',
      -T1.Quantity AS 'Qty.',
      T1.unitMsr AS 'Unit',
      T1.U_PackSize AS 'Packsize',
      T1.U_CasNo AS 'Cas No',
      -T1.Price AS 'Unit Sales Price',
      -(CASE WHEN T0.CurSource = 'L' THEN T1.LineTotal ELSE T1.TotalFrgn END) AS 'Total Sales Price',
      T0.DocCur AS 'Document Currency',
      (SELECT Country FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS 'Country',
      (SELECT State FROM CRD1 WHERE CardCode = T0.CardCode AND AddrType = 'S' AND Address = T0.ShipToCode) AS 'State',
      T10.PymntGroup AS 'Pymnt Group',
      -- Additional useful fields from original getInvoicesList
      CASE 
        WHEN T0.DocTotal <= T0.PaidToDate THEN 'Paid'
        WHEN T0.PaidToDate > 0 THEN 'Partially Paid'
        ELSE 'Unpaid'
      END AS 'Payment Status',
      T0.DocRate AS 'Exchange Rate',
      T5.SlpName AS 'Sales Employee',
      SHP.TrnspName AS 'Transport Name',
      T0.VatSum AS 'Tax Amount',
      T0.Comments AS 'Comments',
      CRD.GroupCode AS 'Customer Group Code',
      G.GroupName AS 'Customer Group',
      C1.GSTRegnNo AS 'GSTIN',
      T1.LineNum AS 'Line Number',
      T1.VatGroup AS 'VAT Group'
    FROM ORIN T0
    JOIN RIN1 T1 ON T0.DocEntry = T1.DocEntry
    LEFT JOIN OITM T2 ON T1.ItemCode = T2.ItemCode
    LEFT JOIN NNM1 T4 ON T4.Series = T0.Series
    LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    LEFT JOIN OCRD CRD ON T0.CardCode = CRD.CardCode
    LEFT JOIN OCRG G ON CRD.GroupCode = G.GroupCode
    LEFT JOIN CRD1 C1 ON T0.CardCode = C1.CardCode AND C1.AdresType = 'S' AND C1.Address = T0.ShipToCode
    LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
    -- Joins for credit note batch details:
    LEFT JOIN DLN1 T7 ON T7.ItemCode = T1.ItemCode 
         AND T7.DocEntry = T1.BaseEntry 
         AND T1.BaseType = 15 
         AND T1.BaseLine = T7.LineNum
    LEFT JOIN ODLN T8 ON T8.DocEntry = T7.DocEntry
    LEFT JOIN IBT1 T9 ON T9.BsDocType = 17 
         AND T9.CardCode = T8.CardCode 
         AND T9.ItemCode = T7.ItemCode 
         AND T9.BaseNum = T8.DocNum 
         AND T9.BaseEntry = T8.DocEntry 
         AND T9.BaseType = 15 
         AND T9.BaseLinNum = T7.LineNum 
         AND T9.Direction = 1
    -- Join OCTG to fetch Payment Group based on GroupNum
    LEFT JOIN OCTG T10 ON T10.GroupNum = T0.GroupNum
    WHERE ${whereClause} AND T0.CANCELED <> 'Y' AND T0.CANCELED <> 'C'
    
    ORDER BY 'Invoice Posting Dt.' ${sortDir}
    OFFSET ${offset} ROWS
    FETCH NEXT ${itemsPerPage} ROWS ONLY;
  `;

  // -----------------------------------------
  // 4. Execute queries concurrently
  // -----------------------------------------
  console.time("Count Query Execution");
  const [totalResult, rawData] = await Promise.all([
    queryDatabase(countQuery),
    queryDatabase(dataQuery),
  ]);
  console.timeEnd("Count Query Execution");

  const totalItems = totalResult?.[0]?.total || 0;

  // -----------------------------------------
  // 5. Format date fields if needed
  // -----------------------------------------
  const invoices = rawData.map((row) => ({
    ...row,
    "Invoice Posting Dt.": row["Invoice Posting Dt."] ? row["Invoice Posting Dt."].toISOString() : null,
    "SO Date": row["SO Date"] ? row["SO Date"].toISOString() : null,
    "Delivery Date": row["Delivery Date"] ? row["Delivery Date"].toISOString() : null,
    "Dispatch Date": row["Dispatch Date"] ? row["Dispatch Date"].toISOString() : null,
  }));

  console.timeEnd("Total Database Query Time");

  return {
    totalItems,
    invoices,
  };
}



  
export async function getInvoiceDetail(docEntry, docNum) {
  // Ensure parameters are properly typed
  docEntry = parseInt(docEntry, 10);
  docNum = parseInt(docNum, 10);

  // Fetch invoice header with both DocEntry and DocNum
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
        -- Calculated InvoiceTotal as per your initial query logic
        CASE 
          WHEN T0.CurSource='L' AND T0.DpmAmnt <> 0 THEN (T0.DpmAmnt + T0.DpmVat)
          ELSE T0.DocTotal
        END AS InvoiceTotal,
        (T0.DocTotal - T0.VatSum - T0.TotalExpns + T0.DiscSum) AS Subtotal
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
        -- For Credit Notes, make InvoiceTotal negative as per your initial query logic
        -CASE 
          WHEN T0.CurSource='L' THEN T0.DocTotal 
          ELSE T0.DocTotalFC 
        END AS InvoiceTotal,
        -(T0.DocTotal - T0.VatSum - T0.TotalExpns + T0.DiscSum) AS Subtotal
      FROM ORIN T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      LEFT JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
    ) AS A
    WHERE A.DocEntry = ${docEntry} AND A.DocNum = ${docNum}
  `;

  // Fetch invoice line items
  // Fetch invoice line items with SO Number data
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
      T13.NumAtCard AS SOCustomerRefNo
    FROM INV1 T1
    LEFT JOIN DLN1 D ON D.BaseEntry = T1.DocEntry AND D.BaseLine = T1.LineNum
    LEFT JOIN RDR1 R ON R.DocEntry = D.BaseEntry AND R.LineNum = D.BaseLine AND D.BaseType = 17
    LEFT JOIN ORDR T13 ON T13.DocEntry = R.DocEntry
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
      CASE 
        WHEN T1.LineStatus = 'O' THEN 'Open'
        WHEN T1.LineStatus = 'C' THEN 'Closed'
        ELSE 'NA'
      END AS LineStatus,
      'N/A' AS DeliveryStatus,
      NULL AS SONumber,
      NULL AS SODate,             -- Added placeholder for SODate
      NULL AS SOCustomerRefNo
    FROM RIN1 T1
    WHERE T1.DocEntry = ${docEntry}
  ) AS A
  ORDER BY A.LineNum ASC;
  `;
  
  // Fetch customer contact information
  const contactQuery = `
    SELECT 
      T2.Name AS ContactPerson,
      T2.Tel1 AS Phone,
      T2.E_MailL AS Email
    FROM OCPR T2
    WHERE T2.CntctCode = (SELECT CntctCode FROM (
      SELECT CntctCode FROM OINV WHERE DocEntry = ${docEntry}
      UNION ALL
      SELECT CntctCode FROM ORIN WHERE DocEntry = ${docEntry}
    ) AS B)
  `;

  // Execute queries
  const [invoiceHeader] = await queryDatabase(invoiceHeaderQuery);
  const invoiceLines = await queryDatabase(invoiceLinesQuery);
  const [contactInfo] = await queryDatabase(contactQuery);

  if (!invoiceHeader) {
    return null;
  }

  // Merge contact information into invoice header
  const invoice = {
    ...invoiceHeader,
    ...contactInfo,
    LineItems: invoiceLines,
  };

  return invoice;
}




export async function getInvoiceStatusFlow(docEntry) {
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
  return status;
}