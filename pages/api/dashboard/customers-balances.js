


import { queryDatabase } from '../../../lib/db';
import sql from 'mssql';
import { getCache, setCache, delCache } from '../../../lib/redis';

export default async function handler(req, res) {
  try {
    const { 
      page = 1, 
      search = '', 
      status = 'all', 
      fromDate = '', 
      toDate = '',
      sortField = 'SO Date',
      sortDir = 'desc',
      queryType = 'balances', // Default to balances query
      slpCode = '',          // Sales person filter
      itmsGrpCod = '',       // Category filter
      itemCode = ''  ,       // Product filter
      getAll = 'false'
    } = req.query;

    const isGetAll = getAll === 'true';

    // Create a cache key based on all query parameters
    // const cacheKey = `customer-${queryType}:${page}:${search}:${status}:${fromDate}:${toDate}:${sortField}:${sortDir}:${slpCode}:${itmsGrpCod}:${itemCode}`;
    const cacheKey = `customer-${queryType}:${isGetAll ? 'all' : page}:${search}:${status}:${fromDate}:${toDate}:${sortField}:${sortDir}:${slpCode}:${itmsGrpCod}:${itemCode}`;

    
    // Try to get data from cache first
    // const cachedData = await getCache(cacheKey);
    // if (cachedData) {
    //   // If we have cached data, use the cached total count too
    //   if (cachedData.totalCount) {
    //     res.setHeader('X-Total-Count', cachedData.totalCount);
    //   }
    //   return res.status(200).json(cachedData.data || []);
    // }
    if (!isGetAll) {
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        if (cachedData.totalCount) {
          res.setHeader('X-Total-Count', cachedData.totalCount);
        }
        return res.status(200).json(cachedData.data || []);
      }
    }


    // Prepare parameters with types
    const parameters = [
      { name: 'search', type: sql.NVarChar, value: search ? `%${search}%` : undefined },
      { name: 'fromDate', type: sql.Date, value: fromDate || undefined },
      { name: 'toDate', type: sql.Date, value: toDate || undefined },
      { name: 'slpCode', type: sql.Int, value: slpCode || undefined },
      { name: 'itmsGrpCod', type: sql.NVarChar, value: itmsGrpCod || undefined },
      { name: 'itemCode', type: sql.NVarChar, value: itemCode || undefined }
    ].filter(param => param.value !== undefined);

    let data, totalCount;

    // Determine which query to run based on queryType
    if (queryType === 'balances') {
      // Updated balances query with DaysOverdue field and new filters
      const query = `
        SELECT TOP 10
          t1.cardcode, 
          t1.cardname,
          (SUM(T0.Debit) - SUM(T0.Credit)) AS Balance,
          MAX(DATEDIFF(DAY, T0.DueDate, GETDATE())) AS DaysOverdue
        FROM JDT1 t0
        LEFT OUTER JOIN OCRD t1 ON T0.ShortName = T1.CardCode  
        WHERE T0.ShortName LIKE 'C%'
        ${slpCode ? 'AND EXISTS (SELECT 1 FROM OSLP WHERE SlpCode = @slpCode AND SlpCode = T1.SlpCode)' : ''}
        GROUP BY t1.cardname, t1.cardcode
        HAVING (SUM(T0.Debit) - SUM(T0.Credit)) > 0
        ORDER BY Balance DESC;
      `;
      
      data = await queryDatabase(query, parameters);
      totalCount = data.length;
    } else if (queryType === 'deliveries') {
      // Build various filter conditions
      let searchFilter = '';
      if (search) {
        searchFilter = `AND (
          T0.[CardCode] LIKE @search OR
          T0.[CardName] LIKE @search OR
          T0.[DocNum] LIKE @search OR
          T3.[DocNum] LIKE @search OR
          T13.[DocNum] LIKE @search OR
          T13.[NumAtCard] LIKE @search OR
          T15.[PymntGroup] LIKE @search
        )`;
      }
      
      let dateFilter = '';
      if (fromDate) {
        dateFilter += ' AND T0.[DocDate] >= @fromDate';
      }
      if (toDate) {
        dateFilter += ' AND T0.[DocDate] <= @toDate';
      }
      
      let overdueFilter = '';
      if (status !== 'all') {
        if (status === '30') {
          overdueFilter = 'AND DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) BETWEEN 0 AND 30';
        } else if (status === '60') {
          overdueFilter = 'AND DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) BETWEEN 31 AND 60';
        } else if (status === '90') {
          overdueFilter = 'AND DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) BETWEEN 61 AND 90';
        } else if (status === '90+') {
          overdueFilter = 'AND DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) > 90';
        }
      }

      // Add new filters
      let salesPersonFilter = '';
      if (slpCode) {
        salesPersonFilter = 'AND T13.[SlpCode] = @slpCode';
      }

     // In the chart query section, replace with this:
// Replace the category and product filters with:
         // CORRECTED FILTERS FOR DELIVERIES QUERY:
      let categoryFilter = '';
      if (itmsGrpCod) {
        categoryFilter = 'AND T10.ItmsGrpCod = @itmsGrpCod'; // Changed to use T10
      }

      let productFilter = '';
      if (itemCode) {
        productFilter = 'AND T1.ItemCode = @itemCode'; // T1 is RDR1 which contains the item code
      }
      // let categoryFilter = '';
      //   if (itmsGrpCod) {
      //     categoryFilter = 'AND T4.ItmsGrpNam = @itmsGrpCod';
      //   }

      //   let productFilter = '';
      //   if (itemCode) {
      //     productFilter = 'AND T3.ItemCode = @itemCode';
      //   }
      
      // Handle sorting
      let orderBy = '';
      const validSortFields = {
        'Customer Code': 'T0.[CardCode]',
        'Customer Name': 'T0.[CardName]',
        'SO#': 'T0.[DocNum]',
        'SO Date': 'T0.[DocDate]',
        'Delivery#': 'T3.[DocNum]',
        'Delivery Date': 'T3.[DocDate]',
        'Invoice No.': 'T13.[DocNum]',
        'AR Invoice Date': 'T13.[DocDate]',
        'Invoice Total': 'T13.[DocTotal]',
        'Balance Due': '(T13.[DocTotal] - T13.[PaidToDate])',
        'Overdue Days': 'DATEDIFF(DAY, T13.[DocDueDate], GETDATE())',
        'Payment Terms': 'T15.[PymntGroup]'
      };
      
      if (sortField && validSortFields[sortField]) {
        orderBy = `ORDER BY ${validSortFields[sortField]} ${sortDir === 'desc' ? 'DESC' : 'ASC'}`;
      } else {
        orderBy = 'ORDER BY T0.[DocDate] DESC';
      }
      
      // Calculate pagination
      const pageSize = 20;
      const offset = (page - 1) * pageSize;
      
      // Deliveries query with pagination and new filters
      const paginatedQuery = `
        SELECT
          T0.[DocNum] as 'SO#', 
          T0.[CardCode] as 'Customer Code',
          T0.[CardName] as 'Customer Name', 
          T0.[DocDate] as 'SO Date',  
          T3.[DocNum] as 'Delivery#',
          T3.[DocDate] as 'Delivery Date',
          DATEDIFF(DAY, T0.[DocDate], T3.[DocDate]) as 'SO to Delivery Days',
          T13.[DocNum] as 'Invoice No.',
          T13.[DocDate] as 'AR Invoice Date',
          T13.[DocTotal] as 'Invoice Total',
          (T13.[DocTotal] - T13.[PaidToDate]) as 'Balance Due', 
          T13.[NumAtCard] as 'BP Reference No.',
          DATEDIFF(DAY, T13.[DocDueDate], GETDATE()) as 'Overdue Days',
          T15.[PymntGroup] as 'Payment Terms',
          T50.[SlpName] as 'Sales Rep'
        FROM ORDR T0  
        INNER JOIN RDR1 T1 ON T0.[DocEntry] = T1.[DocEntry] 
        INNER JOIN DLN1 T2 ON T1.[DocEntry] = T2.[BaseEntry] AND T1.[ItemCode] = T2.[ItemCode] AND T2.[BaseLine] = T1.[LineNum]
        INNER JOIN ODLN T3 ON T3.[DocEntry] = T2.[DocEntry]
        INNER JOIN INV1 T12 ON T2.[DocEntry] = T12.[BaseEntry] AND T2.[ItemCode] = T12.[ItemCode] AND T12.[BaseLine] = T2.[LineNum]
        INNER JOIN OINV T13 ON T13.[DocEntry] = T12.[DocEntry]
        INNER JOIN OITM T10 ON T10.[ItemCode] = T1.[ItemCode]
        INNER JOIN OITB T11 ON T11.[ItmsGrpCod] = T10.[ItmsGrpCod] 
        INNER JOIN OCRD T14 ON T13.[CardCode] = T14.[CardCode] 
        INNER JOIN OCTG T15 ON T14.[GroupNum] = T15.[GroupNum]
        LEFT JOIN OSLP T50 ON T50.[SlpCode] = T13.[SlpCode]
        WHERE
          (T13.[DocTotal] - T13.[PaidToDate]) > 0
          ${searchFilter}
          ${dateFilter}
          ${overdueFilter}
          ${salesPersonFilter}
          ${categoryFilter}
          ${productFilter}
        ${orderBy}
          ${isGetAll ? '' : `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`}
      `;

      // ${isGetAll ? '' : `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`}

      
      
      // Count query for pagination with new filters
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM ORDR T0  
        INNER JOIN RDR1 T1 ON T0.[DocEntry] = T1.[DocEntry] 
        INNER JOIN DLN1 T2 ON T1.[DocEntry] = T2.[BaseEntry] AND T1.[ItemCode] = T2.[ItemCode] AND T2.[BaseLine] = T1.[LineNum]
        INNER JOIN ODLN T3 ON T3.[DocEntry] = T2.[DocEntry]
        INNER JOIN INV1 T12 ON T2.[DocEntry] = T12.[BaseEntry] AND T2.[ItemCode] = T12.[ItemCode] AND T12.[BaseLine] = T2.[LineNum]
        INNER JOIN OINV T13 ON T13.[DocEntry] = T12.[DocEntry]
        INNER JOIN OITM T10 ON T10.[ItemCode] = T1.[ItemCode]
        INNER JOIN OITB T11 ON T11.[ItmsGrpCod] = T10.[ItmsGrpCod] 
        INNER JOIN OCRD T14 ON T13.[CardCode] = T14.[CardCode] 
        INNER JOIN OCTG T15 ON T14.[GroupNum] = T15.[GroupNum]
        LEFT JOIN OSLP T50 ON T50.[SlpCode] = T13.[SlpCode]
        WHERE
          (T13.[DocTotal] - T13.[PaidToDate]) > 0
          ${searchFilter}
          ${dateFilter}
          ${overdueFilter}
          ${salesPersonFilter}
          ${categoryFilter}
          ${productFilter}
      `;
      
      // Execute queries
      // const [queryData, countResult] = await Promise.all([
      //   queryDatabase(paginatedQuery, parameters),
      //   queryDatabase(countQuery, parameters)
      // ]);

      let queryData = [], countResult = [];

if (isGetAll) {
  queryData = await queryDatabase(paginatedQuery, parameters);
  totalCount = queryData.length;
} else {
  [queryData, countResult] = await Promise.all([
    queryDatabase(paginatedQuery, parameters),
    queryDatabase(countQuery, parameters)
  ]);
  totalCount = countResult?.[0]?.total || 0;
}

      
      data = queryData;
      totalCount = countResult && countResult.length > 0 ? countResult[0].total : 0;
    } else if (queryType === 'chart') {
      // Enhanced chart query with all filters applied
      let searchFilter = '';
      if (search) {
        searchFilter = `AND (
          T0.ShortName LIKE @search OR
          T1.CardName LIKE @search
        )`;
      }
      
      let dateFilter = '';
      if (fromDate) {
        dateFilter += ' AND T0.DueDate >= @fromDate';
      }
      if (toDate) {
        dateFilter += ' AND T0.DueDate <= @toDate';
      }
      
      let overdueFilter = '';
      if (status !== 'all') {
        if (status === '30') {
          overdueFilter = 'AND DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 0 AND 30';
        } else if (status === '60') {
          overdueFilter = 'AND DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 31 AND 60';
        } else if (status === '90') {
          overdueFilter = 'AND DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 61 AND 90';
        } else if (status === '90+') {
          overdueFilter = 'AND DATEDIFF(DAY, T0.DueDate, GETDATE()) > 90';
        }
      }

      // Add new filters for chart data
      let salesPersonFilter = '';
      if (slpCode) {
        salesPersonFilter = 'AND EXISTS (SELECT 1 FROM OSLP WHERE SlpCode = @slpCode AND SlpCode = T1.SlpCode)';
      }

            // Replace the category and product filters with:
     let categoryFilter = '';
      if (itmsGrpCod) {
        categoryFilter = 'AND T4.ItmsGrpCod = @itmsGrpCod';
      }

      let productFilter = '';
      if (itemCode) {
        productFilter = 'AND T3.ItemCode = @itemCode';
      }

      const query = `
        SELECT 
          CASE 
            WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 0 AND 30 THEN '0-30 Days'
            WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 31 AND 60 THEN '31-60 Days'
            WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 61 AND 90 THEN '61-90 Days'
            ELSE '91+ Days'
          END AS OverdueRange,
          SUM(T0.Debit - T0.Credit) AS Balance,
          COUNT(DISTINCT T0.ShortName) AS CustomerCount
        FROM JDT1 T0
        INNER JOIN OINV T2 ON T0.TransId = T2.TransId 
        LEFT OUTER JOIN OCRD T1 ON T0.ShortName = T1.CardCode
        LEFT JOIN INV1 T12 ON T0.BaseRef = T12.DocEntry -- Link to invoices
        LEFT JOIN OITM T3 ON T12.ItemCode = T3.ItemCode
        LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
                WHERE 
          T0.ShortName LIKE 'C%' AND
          T0.DueDate <= GETDATE() AND
          (T0.Debit - T0.Credit) > 0
          ${searchFilter}
          ${dateFilter}
          ${overdueFilter}
          ${salesPersonFilter}
          ${categoryFilter}
          ${productFilter}
        GROUP BY CASE 
          WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 0 AND 30 THEN '0-30 Days'
          WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 31 AND 60 THEN '31-60 Days'
          WHEN DATEDIFF(DAY, T0.DueDate, GETDATE()) BETWEEN 61 AND 90 THEN '61-90 Days'
          ELSE '91+ Days'
        END
        ORDER BY OverdueRange;
      `;
      
      data = await queryDatabase(query, parameters);
      totalCount = data.length;
    }
    
    // Add total count in response headers
    res.setHeader('X-Total-Count', totalCount);
    
    // Cache the results
    // Cache for 15 minutes (900 seconds)
    // await setCache(cacheKey, {
    //   data: data || [],
    //   totalCount: totalCount
    // }, 900);
    
    if (!isGetAll) {
  await setCache(cacheKey, {
    data: data || [],
    totalCount: totalCount
  }, 900);
}


    res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching customer data:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}