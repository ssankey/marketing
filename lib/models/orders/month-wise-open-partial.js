// lib/models/orders/month-wise-open-partial.js
import sql from 'mssql';
import { queryDatabase } from '../../db';

/**
 * Get aggregated monthly orders data (open and partial)
 * @param {Object} filters - Filter parameters
 * @param {string} filters.year - Year filter
 * @param {string} filters.slpCode - Sales person code filter
 * @param {string} filters.itmsGrpCod - Item group code filter
 * @param {string} filters.itemCode - Item code filter
 * @param {string} filters.cardCode - Card code filter
 * @param {string} filters.contactPerson - Contact person filter
 * @param {boolean} isAdmin - Whether user is admin
 * @param {Array} contactCodes - User's contact codes
 * @param {Array} cardCodes - User's card codes
 * @returns {Promise<Array>} Monthly aggregated data
 */
export async function getMonthlyOrdersAggregated(filters, isAdmin, contactCodes, cardCodes) {
  const { year, slpCode, itmsGrpCod, itemCode, cardCode, contactPerson } = filters;

  // Build base query with CTE for order status
  let baseQuery = `
    WITH OrderStatusCTE AS (
      SELECT 
        T0.DocEntry,
        T0.DocNum AS OrderNo,
        T0.DocDate,
        T0.NumAtCard AS CustomerRefNo,
        T0.CntctCode,
        T0.SlpCode,
        T0.CardCode,
        CASE 
          WHEN (
            T0.DocStatus = 'O'
            AND EXISTS (
              SELECT 1
              FROM RDR1 T1
              LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
              LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
              LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
              WHERE T1.DocEntry = T0.DocEntry
                AND V.DocEntry IS NOT NULL
            )
            AND EXISTS (
              SELECT 1
              FROM RDR1 T1
              LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
              LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
              LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
              WHERE T1.DocEntry = T0.DocEntry
                AND V.DocEntry IS NULL
            )
          ) THEN 'Partial'
          WHEN T0.DocStatus = 'O' THEN 'Open'
          ELSE 'Other'
        END AS Status
      FROM ORDR T0
      WHERE T0.CANCELED = 'N'
  `;

  // Build WHERE clauses and parameters
  const { whereClauses, params } = buildWhereClausesAndParams(
    { year, slpCode, itmsGrpCod, itemCode, cardCode, contactPerson },
    isAdmin,
    contactCodes,
    cardCodes
  );

  if (whereClauses.length > 0) {
    baseQuery += ` AND ${whereClauses.join(' AND ')}`;
  }

  // Complete aggregated query
  const fullQuery = `
    ${baseQuery}
    ),
    DetailedOpenLineItems AS (
      SELECT 
        CTE.OrderNo,
        CTE.Status,
        CTE.DocDate,
        CTE.CustomerRefNo,
        CTE.CntctCode,
        T1.LineNum,
        T1.ItemCode,
        T1.Dscription,
        T1.U_CasNo,
        T1.VendorNum,
        T1.U_Packsize,
        T1.Quantity,
        T1.Price,
        T1.LineTotal,
        T1.U_Mkt_feedback,
        V.DocNum AS InvoiceNo,
        V.DocDate AS InvoiceDate,
        V.TrackNo AS TrackingNo,
        V.U_DispatchDate AS DispatchDate,
        V.U_DeliveryDate AS DeliveryDate,
        T15.U_vendorbatchno AS BatchNo
      FROM OrderStatusCTE CTE
      INNER JOIN RDR1 T1 ON CTE.DocEntry = T1.DocEntry
      LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
      LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
      LEFT JOIN OINV V ON I.DocEntry = V.DocEntry AND V.CANCELED = 'N'
      LEFT JOIN IBT1 T4 ON T4.BaseEntry = D.DocEntry
                      AND T4.BaseType = 15
                      AND T4.BaseLinNum = D.LineNum
                      AND T4.ItemCode = D.ItemCode
      LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode
                        AND T4.BatchNum = T15.BatchNum
      WHERE 
        CTE.Status IN ('Open', 'Partial')
        AND V.DocEntry IS NULL
    ),
    MonthlyAggregated AS (
      SELECT 
        YEAR(DOL.DocDate) AS year,
        DATENAME(MONTH, DOL.DocDate) AS month,
        MONTH(DOL.DocDate) AS monthNumber,
        DOL.Status,
        COUNT(DISTINCT DOL.OrderNo) AS uniqueOrders,
        COUNT(*) AS lineItems,
        SUM(DOL.LineTotal) AS totalValue
      FROM DetailedOpenLineItems DOL
      LEFT JOIN OCPR TA ON DOL.CntctCode = TA.CntctCode
      GROUP BY 
        YEAR(DOL.DocDate),
        DATENAME(MONTH, DOL.DocDate),
        MONTH(DOL.DocDate),
        DOL.Status
    )
    SELECT 
      year,
      month,
      monthNumber,
      SUM(CASE WHEN Status = 'Open' THEN uniqueOrders ELSE 0 END) AS openOrders,
      SUM(CASE WHEN Status = 'Partial' THEN uniqueOrders ELSE 0 END) AS partialOrders,
      SUM(CASE WHEN Status = 'Open' THEN lineItems ELSE 0 END) AS openLineItems,
      SUM(CASE WHEN Status = 'Partial' THEN lineItems ELSE 0 END) AS partialLineItems,
      SUM(CASE WHEN Status = 'Open' THEN totalValue ELSE 0 END) AS openSales,
      SUM(CASE WHEN Status = 'Partial' THEN totalValue ELSE 0 END) AS partialSales,
      0 AS cancelledOrders,
      0 AS cancelledSales
    FROM MonthlyAggregated
    GROUP BY year, month, monthNumber
    ORDER BY year, monthNumber
  `;

  const results = await queryDatabase(fullQuery, params);

  // Process and return formatted data
  return results.map(row => ({
    year: row.year,
    month: row.month,
    monthNumber: row.monthNumber,
    openOrders: parseInt(row.openOrders) || 0,
    partialOrders: parseInt(row.partialOrders) || 0,
    cancelledOrders: parseInt(row.cancelledOrders) || 0,
    openLineItems: parseInt(row.openLineItems) || 0,
    partialLineItems: parseInt(row.partialLineItems) || 0,
    openSales: parseFloat(row.openSales) || 0,
    partialSales: parseFloat(row.partialSales) || 0,
    cancelledSales: parseFloat(row.cancelledSales) || 0,
  }));
}

/**
 * Get detailed line items for monthly orders
 * @param {Object} filters - Filter parameters
 * @param {boolean} isAdmin - Whether user is admin
 * @param {Array} contactCodes - User's contact codes
 * @param {Array} cardCodes - User's card codes
 * @returns {Promise<Array>} Detailed line items data
 */
export async function getMonthlyOrdersDetailed(filters, isAdmin, contactCodes, cardCodes) {
  const { year, slpCode, itmsGrpCod, itemCode, cardCode, contactPerson } = filters;

  // Build WHERE clauses and parameters
  const { whereClauses, params } = buildWhereClausesAndParams(
    { year, slpCode, itmsGrpCod, itemCode, cardCode, contactPerson },
    isAdmin,
    contactCodes,
    cardCodes
  );

  const detailedQuery = `
    WITH OrderStatusCTE AS (
      SELECT 
        T0.DocEntry,
        T0.DocNum AS OrderNo,
        T0.DocDate,
        T0.NumAtCard AS CustomerRefNo,
        T0.CntctCode,
        T0.SlpCode,
        T0.CardCode,
        CASE 
          WHEN (
            T0.DocStatus = 'O'
            AND EXISTS (
              SELECT 1
              FROM RDR1 T1
              LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
              LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
              LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
              WHERE T1.DocEntry = T0.DocEntry
                AND V.DocEntry IS NOT NULL
            )
            AND EXISTS (
              SELECT 1
              FROM RDR1 T1
              LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
              LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
              LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
              WHERE T1.DocEntry = T0.DocEntry
                AND V.DocEntry IS NULL
            )
          ) THEN 'Partial'
          WHEN T0.DocStatus = 'O' THEN 'Open'
          ELSE 'Other'
        END AS Status
      FROM ORDR T0
      WHERE T0.CANCELED = 'N'
      ${whereClauses.length > 0 ? ` AND ${whereClauses.join(' AND ')}` : ''}
    ),
    DetailedOpenLineItems AS (
      SELECT 
        CTE.OrderNo,
        CTE.Status,
        CTE.DocDate,
        CTE.CustomerRefNo,
        CTE.CntctCode,
        T1.LineNum,
        T1.ItemCode,
        T1.Dscription,
        T1.U_CasNo,
        T1.VendorNum,
        T1.U_Packsize,
        T1.Quantity,
        T1.Price,
        T1.LineTotal,
        T1.U_Mkt_feedback,
        V.DocNum AS InvoiceNo,
        V.DocDate AS InvoiceDate,
        V.TrackNo AS TrackingNo,
        V.U_DispatchDate AS DispatchDate,
        V.U_DeliveryDate AS DeliveryDate,
        T15.U_vendorbatchno AS BatchNo
      FROM OrderStatusCTE CTE
      INNER JOIN RDR1 T1 ON CTE.DocEntry = T1.DocEntry
      LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
      LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
      LEFT JOIN OINV V ON I.DocEntry = V.DocEntry AND V.CANCELED = 'N'
      LEFT JOIN IBT1 T4 ON T4.BaseEntry = D.DocEntry
                      AND T4.BaseType = 15
                      AND T4.BaseLinNum = D.LineNum
                      AND T4.ItemCode = D.ItemCode
      LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode
                        AND T4.BatchNum = T15.BatchNum
      WHERE 
        CTE.Status IN ('Open', 'Partial')
        AND V.DocEntry IS NULL
    )
    SELECT 
      YEAR(DOL.DocDate) AS Year,
      DATENAME(MONTH, DOL.DocDate) AS Month,
      MONTH(DOL.DocDate) AS MonthNumber,
      DOL.OrderNo AS "SO No",
      DOL.DocDate AS "SO Date",
      DOL.CustomerRefNo AS "Customer Ref. No",
      TA.Name AS "Contact Person",
      DOL.ItemCode AS "Item No.",
      DOL.Dscription AS "Description",
      DOL.U_CasNo AS "Cas No",
      DOL.VendorNum AS "Vendor Cat. No.",
      DOL.U_Packsize AS "PKZ",
      DOL.Quantity AS "Qty",
      DOL.Status AS "Status",
      DOL.Price AS "Unit Price",
      DOL.LineTotal AS "Total Value",
      DOL.BatchNo AS "Batch No",
      DOL.U_Mkt_feedback AS "Mkt Feedback"
    FROM DetailedOpenLineItems DOL
    LEFT JOIN OCPR TA ON DOL.CntctCode = TA.CntctCode
    ORDER BY Year, MonthNumber, DOL.Status, DOL.OrderNo, DOL.LineNum
  `;

  return await queryDatabase(detailedQuery, params);
}

/**
 * Get available years for filtering
 * @returns {Promise<Array>} Array of available years
 */
export async function getAvailableYears() {
  const yearsQuery = `
    SELECT DISTINCT YEAR(DocDate) as year
    FROM ORDR
    WHERE CANCELED = 'N'
    ORDER BY year DESC
  `;
  
  const yearsResult = await queryDatabase(yearsQuery);
  return yearsResult.map(row => row.year);
}

/**
 * Helper function to build WHERE clauses and parameters
 * @param {Object} filters - Filter parameters
 * @param {boolean} isAdmin - Whether user is admin
 * @param {Array} contactCodes - User's contact codes
 * @param {Array} cardCodes - User's card codes
 * @returns {Object} Object containing whereClauses array and params array
 */
function buildWhereClausesAndParams(filters, isAdmin, contactCodes, cardCodes) {
  const { year, slpCode, itmsGrpCod, itemCode, cardCode, contactPerson } = filters;
  const whereClauses = [];
  const params = [];

  if (year) {
    whereClauses.push(`YEAR(T0.DocDate) = @year`);
    params.push({ name: 'year', type: sql.Int, value: parseInt(year) });
  }

  if (slpCode) {
    whereClauses.push(`T0.SlpCode = @slpCode`);
    params.push({ name: 'slpCode', type: sql.Int, value: parseInt(slpCode) });
  }

  if (itmsGrpCod) {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM RDR1 T1 
      INNER JOIN OITM T2 ON T1.ItemCode = T2.ItemCode 
      INNER JOIN OITB T3 ON T2.ItmsGrpCod = T3.ItmsGrpCod 
      WHERE T1.DocEntry = T0.DocEntry 
      AND T3.ItmsGrpNam = @itmsGrpCod
    )`);
    params.push({ name: 'itmsGrpCod', type: sql.VarChar, value: itmsGrpCod });
  }

  if (itemCode) {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM RDR1 T1 
      WHERE T1.DocEntry = T0.DocEntry 
      AND T1.ItemCode = @itemCode
    )`);
    params.push({ name: 'itemCode', type: sql.VarChar, value: itemCode });
  }

  if (cardCode) {
    whereClauses.push(`T0.CardCode = @cardCode`);
    params.push({ name: 'cardCode', type: sql.VarChar, value: cardCode });
  }

  if (contactPerson) {
    whereClauses.push(`T0.CntctCode = @contactPerson`);
    params.push({ name: 'contactPerson', type: sql.Int, value: parseInt(contactPerson) });
  }

  // Handle user permissions
  if (!isAdmin) {
    if (cardCodes.length > 0) {
      whereClauses.push(`T0.CardCode IN (${cardCodes.map(code => `'${code}'`).join(',')})`);
    } else if (contactCodes.length > 0) {
      whereClauses.push(`T0.SlpCode IN (${contactCodes.map(code => `'${code}'`).join(',')})`);
    }
  }

  return { whereClauses, params };
}