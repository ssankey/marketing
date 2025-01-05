// lib/models/invoice.js
import { queryDatabase } from "../db";

export async function getInvoicesList(params) {
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
  contactCodes = [], // pass from token for a single customer's code
  } = params;

  const offset = (parseInt(page, 10) - 1) * itemsPerPage;

  // Start building the WHERE clause
  let whereClause = "1=1";

  // 1) Search filter
  if (search) {
    whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' 
      OR T0.CardName LIKE '%${search}%' 
      OR T0.NumAtCard LIKE '%${search}%'
    )`;
  }

  // 2) Status filter
  if (status !== "all") {
    whereClause += ` AND (
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
        WHEN T0.DocStatus='O' THEN 'Open'
        ELSE 'NA'
      END = '${status}'
    )`;
  }

  // 3) Date filters
  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

  // 4) Role-based restriction:
  //    If NOT admin, show only invoices for this user's CardCode
  if (!isAdmin && contactCodes.length > 0) {
    // Example: If T0.CntctCode is how you link contacts -> Orders
    whereClause += ` AND T0.CntctCode IN (
      ${contactCodes.map((code) => `'${code}'`).join(", ")}
    )`;
  }

  // Build queries:
  const countQuery = `
    SELECT COUNT(DISTINCT T0.DocEntry) as total
    FROM OINV T0
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    WHERE ${whereClause};
  `;

  const dataQuery = `
    SELECT 
      CASE 
        WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
        WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Canceled'
        WHEN (T0.DocStatus='O') THEN 'Open'
        ELSE 'NA'
      END AS DocStatus,
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T0.NumAtCard AS CustomerPONo,
      T0.TaxDate AS PODate,
      T0.DocDueDate,
      T0.CardName,
      CASE 
        WHEN T0.CurSource='L' AND T0.DpmAmnt <> 0 THEN (T0.DpmAmnt + T0.DpmVat) 
        ELSE T0.DocTotal 
      END AS InvoiceTotal,
      T0.DocCur,
      T0.DocRate,
      T5.SlpName AS SalesEmployee,
      CASE 
        WHEN T1.Country = 'IN' THEN 'Domestic' 
        ELSE 'Export' 
      END AS TradeType,
      T2.LineTotal,
      T0.VatSum as TaxAmount,
      T1.GroupCode,
      (SELECT GroupName FROM OCRG WHERE GroupCode = T1.GroupCode) AS CustomerGroup,
      T0.ShipToCode,
      (SELECT TOP 1 GSTRegnNo FROM CRD1 
         WHERE CardCode = T0.CardCode 
           AND AdresType='S' 
           AND Address = T0.ShipToCode) AS GSTIN,
      T0.Comments
    FROM OINV T0
    INNER JOIN INV1 T2 ON T0.DocNum = T2.BaseRef
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    INNER JOIN OCRD T1 ON T0.CardCode = T1.CardCode
    WHERE ${whereClause}
    ORDER BY ${sortField} ${sortDir}
    OFFSET ${offset} ROWS
    FETCH NEXT ${itemsPerPage} ROWS ONLY;
  `;

  const [totalResult, rawInvoices] = await Promise.all([
    queryDatabase(countQuery),
    queryDatabase(dataQuery),
  ]);

  const totalItems = totalResult[0]?.total || 0;

  // Format date fields:
  const invoices = rawInvoices.map((inv) => ({
    ...inv,
    DocDate: inv.DocDate ? inv.DocDate.toISOString() : null,
    PODate: inv.PODate ? inv.PODate.toISOString() : null,
    DocDueDate: inv.DocDueDate ? inv.DocDueDate.toISOString() : null,
  }));

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
            SELECT 1 FROM DLN1 T2
            WHERE T2.BaseEntry = T1.DocEntry AND T2.BaseLine = T1.LineNum
          ) THEN 'Delivered'
          ELSE 'Pending'
        END AS DeliveryStatus
      FROM INV1 T1
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
        'N/A' AS DeliveryStatus -- Assuming no delivery status for credit notes
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

