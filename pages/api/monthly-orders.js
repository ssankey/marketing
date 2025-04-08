
// pages/api/monthly-orders.js

import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from '../../lib/db';
import { getCache, setCache } from '../../lib/redis';

export default async function handler(req, res) {
    try {
        const { year, slpCode, itmsGrpCod, itemCode } = req.query;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or malformed Authorization header' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = verify(token, process.env.JWT_SECRET);
        } catch (verifyError) {
            console.error('Token verification failed:', verifyError);
            return res.status(401).json({ error: 'Token verification failed' });
        }

        const isAdmin = decoded.role === 'admin';
        const contactCodes = decoded.contactCodes || [];
        const cardCodes = decoded.cardCodes || [];
        

        // Create a cache key based on the request parameters and user access
        const cacheKey = `monthly-orders:${year || 'all'}:${slpCode || 'all'}:${itmsGrpCod || 'all'}:${itemCode || 'all'}:${isAdmin ? 'admin' : contactCodes.join(',')}`;
        
        // Try to get data from cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        let baseQuery = `
            SELECT 
                YEAR(T0.DocDate) AS year,
                DATENAME(MONTH, T0.DocDate) AS month,
                MONTH(T0.DocDate) AS monthNumber,
                SUM(CASE WHEN T0.DocStatus = 'O' THEN 1 ELSE 0 END) AS openOrders,
                SUM(CASE WHEN T0.DocStatus = 'C' THEN 1 ELSE 0 END) AS closedOrders,
                SUM(CASE WHEN T0.DocStatus = 'O' THEN T0.DocTotal ELSE 0 END) AS openSales,
                SUM(CASE WHEN T0.DocStatus = 'C' THEN T0.DocTotal ELSE 0 END) AS closedSales
            FROM ORDR T0
        `;

        let whereClauses = [];
        let params = [];

        if (year) {
            whereClauses.push(`YEAR(T0.DocDate) = @year`);
            params.push({ name: 'year', type: sql.Int, value: parseInt(year) });
        }

        if (slpCode) {
            whereClauses.push(`T0.SlpCode = @slpCode`);
            params.push({ name: 'slpCode', type: sql.Int, value: parseInt(slpCode) });
        }

        if (itmsGrpCod) {
            // Use an EXISTS subquery to filter by item group name
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
            // Use an EXISTS subquery to filter by item code
            whereClauses.push(`EXISTS (
                SELECT 1 FROM RDR1 T1 
                WHERE T1.DocEntry = T0.DocEntry 
                AND T1.ItemCode = @itemCode
            )`);
            params.push({ name: 'itemCode', type: sql.VarChar, value: itemCode });
        }

        if (!isAdmin) {
          if (contactCodes.length > 0) {
            whereClauses.push(
              `T0.SlpCode IN (${contactCodes
                .map((code) => `'${code}'`)
                .join(",")})`
            );
          } else if (cardCodes.length > 0) {
            whereClauses.push(
              `T0.CardCode IN (${cardCodes
                .map((code) => `'${code}'`)
                .join(",")})`
            );
          }
        }

  

        // Add base WHERE clause
        whereClauses.push(`T0.CANCELED = 'N'`);

        // Combine all WHERE clauses
        baseQuery += ` WHERE ${whereClauses.join(' AND ')}`;

        const fullQuery = `
            ${baseQuery}
            GROUP BY 
                YEAR(T0.DocDate),
                DATENAME(MONTH, T0.DocDate),
                MONTH(T0.DocDate)
            ORDER BY 
                YEAR(T0.DocDate), MONTH(T0.DocDate)
        `;

        const results = await queryDatabase(fullQuery, params);

        const data = results.map(row => ({
            year: row.year,
            month: row.month,
            monthNumber: row.monthNumber,
            openOrders: parseInt(row.openOrders) || 0,
            closedOrders: parseInt(row.closedOrders) || 0,
            openSales: parseFloat(row.openSales) || 0,
            closedSales: parseFloat(row.closedSales) || 0,
        }));

        // Get available years for filtering - also cache this separately with longer expiration
        let availableYears;
        const yearsKey = 'monthly-orders:available-years';
        const cachedYears = await getCache(yearsKey);
        
        if (cachedYears) {
            availableYears = cachedYears;
        } else {
            const yearsQuery = `
                SELECT DISTINCT YEAR(DocDate) as year
                FROM ORDR
                WHERE CANCELED = 'N'
                ORDER BY year DESC
            `;
            const yearsResult = await queryDatabase(yearsQuery);
            availableYears = yearsResult.map(row => row.year);
            
            // Cache available years for 24 hours (86400 seconds)
            await setCache(yearsKey, availableYears, 86400);
        }

        const responseData = { data, availableYears };
        
        // Cache the response - using different TTLs based on query type
        // Year-specific queries are cached for longer since historical data rarely changes
        const cacheTTL = year ? 3600 : 1800; // 1 hour for year queries, 30 minutes for current/all data
        await setCache(cacheKey, responseData, cacheTTL);

        return res.status(200).json(responseData);
    } catch (error) {
        console.error('API handler error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}