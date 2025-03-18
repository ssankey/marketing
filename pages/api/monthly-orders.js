



//pages/api/monthly-orders.js
import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from '../../lib/db';

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
            INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
            INNER JOIN OITM T2 ON T1.ItemCode = T2.ItemCode
            INNER JOIN OITB T3 ON T2.ItmsGrpCod = T3.ItmsGrpCod
            WHERE T0.CANCELED = 'N'
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
            whereClauses.push(`T3.ItmsGrpNam = @itmsGrpCod`);
            params.push({ name: 'itmsGrpCod', type: sql.VarChar, value: itmsGrpCod });
        }

        if (itemCode) {
            whereClauses.push(`T2.ItemCode = @itemCode`);
            params.push({ name: 'itemCode', type: sql.VarChar, value: itemCode });
        }

        // Apply user-based filtering if not admin
        if (!isAdmin && decoded.cardCodes && decoded.cardCodes.length > 0) {
            whereClauses.push(`T0.CardCode IN (${decoded.cardCodes.map((_, i) => `@cardCode${i}`).join(', ')})`);
            decoded.cardCodes.forEach((cardCode, i) => {
                params.push({ name: `cardCode${i}`, type: sql.VarChar, value: cardCode });
            });
        }

        if (whereClauses.length > 0) {
            baseQuery += ` AND ` + whereClauses.join(' AND ');
        }

        const fullQuery = `
            ${baseQuery}
            GROUP BY YEAR(T0.DocDate), DATENAME(MONTH, T0.DocDate), MONTH(T0.DocDate)
            ORDER BY YEAR(T0.DocDate), MONTH(T0.DocDate)
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
