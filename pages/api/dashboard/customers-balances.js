// /pages/api/dashboard/customers-balances.js
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
      queryType = 'balances' // Default to balances query
    } = req.query;

    // Create a cache key based on all query parameters
    const cacheKey = `customer-${queryType}:${page}:${search}:${status}:${fromDate}:${toDate}:${sortField}:${sortDir}`;
    
    // Try to get data from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      // If we have cached data, use the cached total count too
      if (cachedData.totalCount) {
        res.setHeader('X-Total-Count', cachedData.totalCount);
      }
      return res.status(200).json(cachedData.data || []);
    }

    // Prepare parameters with types
    const parameters = [
      { name: 'search', type: sql.NVarChar, value: search ? `%${search}%` : undefined },
      { name: 'fromDate', type: sql.Date, value: fromDate || undefined },
      { name: 'toDate', type: sql.Date, value: toDate || undefined }
    ].filter(param => param.value !== undefined);

    let data, totalCount;

    // Determine which query to run based on queryType
    if (queryType === 'balances') {
      // Original balances query
      const query = `
        SELECT TOP 10
          t1.cardcode, 
          t1.cardname,
          (SUM(T0.Debit) - SUM(T0.Credit)) AS Balance
        FROM JDT1 t0
        LEFT OUTER JOIN OCRD t1 ON T0.ShortName = T1.CardCode  
        WHERE T0.ShortName LIKE 'C%'
        GROUP BY t1.cardname, t1.cardcode
        HAVING (SUM(T0.Debit) - SUM(T0.Credit)) > 0
        ORDER BY Balance DESC;
      `;
      
      data = await queryDatabase(query);
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
      
      // Deliveries query with pagination
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
        ${orderBy}
        OFFSET ${offset} ROWS
        FETCH NEXT ${pageSize} ROWS ONLY;
      `;
      
      // Count query for pagination
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
      `;
      
      // Execute queries
      const [queryData, countResult] = await Promise.all([
        queryDatabase(paginatedQuery, parameters),
        queryDatabase(countQuery, parameters)
      ]);
      
      data = queryData;
      totalCount = countResult && countResult.length > 0 ? countResult[0].total : 0;
    }
    
    // Add total count in response headers
    res.setHeader('X-Total-Count', totalCount);
    
    // Cache the results
    // Cache for 15 minutes (900 seconds)
    await setCache(cacheKey, {
      data: data || [],
      totalCount: totalCount
    }, 900);
    
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching customer data:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}