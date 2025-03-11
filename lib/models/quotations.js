// lib/models/quotation.js
import { queryDatabase } from "../db";
import { getCache, setCache } from "../redis";

export async function getQuotationsList(params) {
  const {
    page = 1,
    search = "",
    status = "all",
    fromDate,
    toDate,
    sortField = "DocNum",
    sortDir = "desc",
    itemsPerPage = 20,
    isAdmin = false,
    contactCodes = [],
  } = params;

  // Create a cache key based on all parameters
  const cacheKey = `quotations:list:${page}:${search}:${status}:${fromDate || 'none'}:${toDate || 'none'}:${sortField}:${sortDir}:${itemsPerPage}:${isAdmin}:${contactCodes.join(',')}`;
  
  // Try to get data from cache first
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const offset = (parseInt(page, 10) - 1) * itemsPerPage;

  // Build your WHERE clause as usual
  let whereClause = "1=1";

  // 1) Handle search filters
  if (search) {
    whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' OR 
      T0.CardName LIKE '%${search}%' OR 
      T0.NumAtCard LIKE '%${search}%'
    )`;
  }

  // 2) Handle status filter
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

  // 4) Role-based filtering
  if (!isAdmin && contactCodes.length > 0) {
    // Limit to only those docs with CardCodes the user has access to
    whereClause += ` AND T0.CardCode IN (
      SELECT DISTINCT CardCode 
      FROM OCPR 
      WHERE CntctCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})
    )`;
  }

  // 5) Build queries
  const [totalResult, quotations] = await Promise.all([
    queryDatabase(`
      SELECT COUNT(DISTINCT T0.DocEntry) AS total
      FROM OQUT T0
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${whereClause};
    `),
    queryDatabase(`
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
      T0.DocDueDate AS DeliveryDate,
      T0.CardName,
      T0.DocTotal,
      T0.DocCur,
      T0.DocRate,
      T5.SlpName AS SalesEmployee
      FROM OQUT T0
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      OFFSET ${offset} ROWS
      FETCH NEXT ${itemsPerPage} ROWS ONLY;
    `),
  ]);

  const totalItems = totalResult[0]?.total || 0;
  const result = { totalItems, quotations };
  
  // Cache the results
  // Use shorter cache time for list queries as they change more frequently
  // Open status or search queries should have shorter cache times
  let cacheTTL = 1800; // Default: 30 minutes
  
  if (status === 'Open' || search) {
    cacheTTL = 300; // 5 minutes for active/search queries
  }
  
  await setCache(cacheKey, result, cacheTTL);
  
  return result;
}

export async function getQuotationDetail(docEntry, docNum) {
  // Ensure parameters are properly typed
  docEntry = parseInt(docEntry, 10);
  docNum = parseInt(docNum, 10);
  
  // Create cache key for the quotation detail
  const cacheKey = `quotation:detail:${docEntry}:${docNum}`;
  
  // Try to get from cache first
  const cachedQuotation = await getCache(cacheKey);
  if (cachedQuotation) {
    return cachedQuotation;
  }

  // Fetch quotation header
  const quotationHeaderQuery = `
      SELECT 
        T0.DocNum,
        T0.DocEntry,
        T0.DocDate,
        T0.DocDueDate,
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
      FROM OQUT T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      LEFT JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
      WHERE T0.DocEntry = ${docEntry} AND T0.DocNum = ${docNum}
    `;

  // Fetch quotation line items
  const quotationLinesQuery = `
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
      FROM QUT1 T1
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
      WHERE T2.CntctCode = (SELECT CntctCode FROM OQUT WHERE DocEntry = ${docEntry})
    `;

  // Execute queries
  const [quotationHeader] = await queryDatabase(quotationHeaderQuery);
  const quotationLines = await queryDatabase(quotationLinesQuery);
  const [contactInfo] = await queryDatabase(contactQuery);

  if (!quotationHeader) {
    return null;
  }

  // Merge contact information into quotation header
  const quotation = {
    ...quotationHeader,
    ...contactInfo,
    LineItems: quotationLines,
  };
  
  // Cache the quotation with TTL based on status
  // Closed/Cancelled quotations can be cached longer than open ones
  let cacheTTL = 3600; // Default: 1 hour
  
  if (quotationHeader.DocStatusDisplay === 'Open') {
    cacheTTL = 300; // 5 minutes for open quotations
  } else if (quotationHeader.DocStatusDisplay === 'Closed' || 
             quotationHeader.DocStatusDisplay === 'Cancelled') {
    cacheTTL = 86400; // 24 hours for closed/cancelled quotations
  }
  
  await setCache(cacheKey, quotation, cacheTTL);

  return quotation;
}