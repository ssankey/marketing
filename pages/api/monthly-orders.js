// pages/api/monthly-orders.js

import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from '../../lib/db';

export default async function handler(req, res) {
    try {
        const { year, slpCode, itmsGrpCod, itemCode } = req.query;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Missing or malformed Authorization header',
                received: authHeader
            });
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
            const contactCodes = decoded.contactCodes || [];
            if (!contactCodes.length) {
                return res.status(403).json({ error: 'No contact codes available' });
            }
            whereClauses.push(`T0.CardCode IN (
                SELECT CardCode FROM OCPR 
                WHERE CntctCode IN (${contactCodes.map((_, i) => `@contactCode${i}`).join(',')})
            )`);
            contactCodes.forEach((code, i) => {
                params.push({ name: `contactCode${i}`, type: sql.VarChar(50), value: code });
            });
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

        // Get available years for filtering
        const yearsQuery = `
            SELECT DISTINCT YEAR(DocDate) as year
            FROM ORDR
            WHERE CANCELED = 'N'
            ORDER BY year DESC
        `;
        const yearsResult = await queryDatabase(yearsQuery);
        const availableYears = yearsResult.map(row => row.year);

        return res.status(200).json({ data, availableYears });
    } catch (error) {
        console.error('API handler error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}