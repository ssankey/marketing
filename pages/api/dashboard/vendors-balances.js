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
      sortField = 'AR Invoice Date',
      sortDir = 'desc'
    } = req.query;
    
    // Create a cache key based on all query parameters
    const cacheKey = `vendor-payments:${page}:${search}:${status}:${fromDate}:${toDate}:${sortField}:${sortDir}`;
    
    // Try to get data from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      // If we have cached data, use the cached total count too
      if (cachedData.totalCount) {
        res.setHeader('X-Total-Count', cachedData.totalCount);
      }
      return res.status(200).json(cachedData.data || []);
    }
    
    // If no cache hit, proceed with database query
    // Build various filter conditions
    let searchFilter = '';
    if (search) {
      searchFilter = `AND (
        T0.[CardCode] LIKE @search OR
        T0.[CardName] LIKE @search OR
        T1.[DocNum] LIKE @search OR
        T2.[DocNum] LIKE @search OR
        T1.[NumAtCard] LIKE @search OR
        T3.[TrnspCode] LIKE @search OR
        T5.[PymntGroup] LIKE @search
      )`;
    }
    
    let dateFilter = '';
    if (fromDate) {
      dateFilter += ' AND T1.[DocDate] >= @fromDate';
    }
    if (toDate) {
      dateFilter += ' AND T1.[DocDate] <= @toDate';
    }
    
    let overdueFilter = '';
    if (status !== 'all') {
      if (status === '30') {
        overdueFilter = 'AND DATEDIFF(DAY, T1.[DocDueDate], GETDATE()) BETWEEN 0 AND 30';
      } else if (status === '60') {
        overdueFilter = 'AND DATEDIFF(DAY, T1.[DocDueDate], GETDATE()) BETWEEN 31 AND 60';
      } else if (status === '90') {
        overdueFilter = 'AND DATEDIFF(DAY, T1.[DocDueDate], GETDATE()) BETWEEN 61 AND 90';
      } else if (status === '90+') {
        overdueFilter = 'AND DATEDIFF(DAY, T1.[DocDueDate], GETDATE()) > 90';
      }
    }
    
    // Handle sorting
    let orderBy = '';
    const validSortFields = {
      'Vendor Code': 'T0.[CardCode]',
      'Vendor Name': 'T0.[CardName]',
      'Invoice No.': 'T1.[DocNum]',
      'AR Invoice Date': 'T1.[DocDate]',
      'SO Number': 'T2.[DocNum]',
      'SO Date': 'T2.[DocDate]',
      'Delivery Date': 'T3.[DocDate]',
      'Invoice Total': 'T1.[DocTotal]',
      'Balance Due': '(T1.[DocTotal] - T1.[PaidToDate])',
      'Overdue Days': 'DATEDIFF(DAY, T1.[DocDueDate], GETDATE())',
      'Payment Terms': 'T5.[PymntGroup]'
    };
    
    if (sortField && validSortFields[sortField]) {
      orderBy = `ORDER BY ${validSortFields[sortField]} ${sortDir === 'desc' ? 'DESC' : 'ASC'}`;
    } else {
      orderBy = 'ORDER BY T1.[DocDate] DESC';
    }
    
    // Calculate pagination
    const pageSize = 20;
    const offset = (page - 1) * pageSize;
    
    // Add pagination to the main query
    const paginatedQuery = `
      SELECT
          T0.[CardCode] AS 'Customer/Vendor Code',
          T0.[CardName] AS 'Customer/Vendor Name',
          T1.[DocNum] AS 'Invoice No.',
          T1.[DocDate] AS 'AR Invoice Date',
          T2.[DocNum] AS 'SO#',
          T2.[DocDate] AS 'SO Date',
          T1.[NumAtCard] AS 'BP Reference No.',
          T3.[DocNum] AS 'Delivery#',
          T3.[DocDate] AS 'Delivery Date',
          T3.[TrnspCode] AS 'Tracking Number',
          T3.[DocDate] AS 'Dispatch Date',
          T4.[SlpName] AS 'Sales Rep',
          T1.[DocTotal] AS 'Invoice Total',
          (T1.[DocTotal] - T1.[PaidToDate]) AS 'BalanceDue',
          DATEDIFF(DAY, T1.[DocDueDate], GETDATE()) AS 'Overdue Days',
          T5.[PymntGroup] AS 'Payment Terms Code',
          T1.[Comments] AS 'Remarks'
      FROM
          OCRD T0
          INNER JOIN OINV T1 ON T0.[CardCode] = T1.[CardCode]
          LEFT JOIN ORDR T2 ON T1.[DocEntry] = T2.[DocEntry]
          LEFT JOIN ODLN T3 ON T1.[DocEntry] = T3.[DocEntry]
          LEFT JOIN OSLP T4 ON T1.[SlpCode] = T4.[SlpCode]
          INNER JOIN OCTG T5 ON T0.[GroupNum] = T5.[GroupNum]
      WHERE
          (T1.[DocTotal] - T1.[PaidToDate]) > 0
          ${searchFilter}
          ${dateFilter}
          ${overdueFilter}
      ${orderBy}
    `;
    
    // Prepare parameters with types
    const parameters = [
      { name: 'search', type: sql.NVarChar, value: search ? `%${search}%` : undefined },
      { name: 'fromDate', type: sql.Date, value: fromDate || undefined },
      { name: 'toDate', type: sql.Date, value: toDate || undefined }
    ].filter(param => param.value !== undefined);
    
    // Also get total count for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM
          OCRD T0
          INNER JOIN OINV T1 ON T0.[CardCode] = T1.[CardCode]
          LEFT JOIN ORDR T2 ON T1.[DocEntry] = T2.[DocEntry]
          LEFT JOIN ODLN T3 ON T1.[DocEntry] = T3.[DocEntry]
          LEFT JOIN OSLP T4 ON T1.[SlpCode] = T4.[SlpCode]
          INNER JOIN OCTG T5 ON T0.[GroupNum] = T5.[GroupNum]
      WHERE
          (T1.[DocTotal] - T1.[PaidToDate]) > 0
          ${searchFilter}
          ${dateFilter}
          ${overdueFilter}
    `;
    
    // Execute queries
    const [data, countResult] = await Promise.all([
      queryDatabase(paginatedQuery, parameters),
      queryDatabase(countQuery, parameters)
    ]);
    
    const totalCount = countResult && countResult.length > 0 ? countResult[0].total : 0;
    
    // Add total count in response headers
    res.setHeader('X-Total-Count', totalCount);
    
    // Cache the results
    // Cache for 15 minutes (900 seconds) - adjust as needed based on data refresh requirements
    await setCache(cacheKey, {
      data: data || [],
      totalCount: totalCount
    }, 900);
    
    res.status(200).json(data || []);
    
  } catch (error) {
    console.error('Error fetching vendor payments:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}