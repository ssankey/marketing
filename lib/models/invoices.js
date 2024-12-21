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
  } = params;

  const offset = (parseInt(page, 10) - 1) * itemsPerPage;

  let whereClause = "1=1";

  if (search) {
    whereClause += ` AND (
      T0.DocNum LIKE '%${search}%' OR 
      T0.CardName LIKE '%${search}%' OR 
      T0.NumAtCard LIKE '%${search}%'
    )`;
  }

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

  if (fromDate) {
    whereClause += ` AND T0.DocDate >= '${fromDate}'`;
  }
  if (toDate) {
    whereClause += ` AND T0.DocDate <= '${toDate}'`;
  }

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
      T1.GroupCode,
      (SELECT GroupName FROM OCRG WHERE GroupCode = T1.GroupCode) AS CustomerGroup,
      T0.ShipToCode,
      (SELECT TOP 1 GSTRegnNo FROM CRD1 WHERE CardCode = T0.CardCode AND AdresType='S' AND Address = T0.ShipToCode) AS GSTIN,
      T0.Comments
    FROM OINV T0
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    INNER JOIN OCRD T1 ON T0.CardCode = T1.CardCode
    WHERE ${whereClause}
    ORDER BY ${sortField} ${sortDir}
    OFFSET ${offset} ROWS
    FETCH NEXT ${itemsPerPage} ROWS ONLY;
  `;

  const [totalResult, invoices] = await Promise.all([
    queryDatabase(countQuery),
    queryDatabase(dataQuery),
  ]);

  const totalItems = totalResult[0]?.total || 0;
  return {
    totalItems,
    invoices,
  };
}
