


import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from '../../lib/db';

export default async function handler(req, res) {
    try {
        const { year, slpCode, itmsGrpCod } = req.query; // Accept SlpCode & ItmsGrpCod as input
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

       


        let baseQuery = `
            SELECT 
                YEAR(T0.DocDate) AS year,
                DATENAME(MONTH, T0.DocDate) AS month,
                MONTH(T0.DocDate) AS monthNumber,
                ROUND(SUM(
                    CASE 
                        WHEN T1.InvQty = 0 THEN T1.LineTotal
                        WHEN T4.Quantity IS NULL THEN T1.LineTotal
                        ELSE (T1.LineTotal / T1.InvQty) * ISNULL(T4.Quantity, 0)
                    END
                ), 2) AS sales,
                ROUND(SUM(T1.GrossBuyPr * ISNULL(T4.Quantity, 0)), 2) AS cogs,
                ROUND(SUM(
                    CASE 
                        WHEN T1.InvQty = 0 THEN T1.LineTotal
                        WHEN T4.Quantity IS NULL THEN T1.LineTotal
                        ELSE (T1.LineTotal / T1.InvQty) * ISNULL(T4.Quantity, 0)
                    END
                ) - SUM(T1.GrossBuyPr * ISNULL(T4.Quantity, 0)), 2) AS grossMargin
            FROM OINV T0
            INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
            INNER JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
            INNER JOIN OITB T5 ON T3.ItmsGrpCod = T5.ItmsGrpCod
            LEFT JOIN IBT1 T4 ON T4.CardCode = T0.CardCode
                AND T4.ItemCode = T1.ItemCode
            WHERE T0.CANCELED = 'N'
        `;

        // Prepare conditions dynamically based on provided parameters
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
            whereClauses.push(`T5.ItmsGrpNam = @itmsGrpCod`);
            params.push({ name: 'itmsGrpCod', type: sql.VarChar, value: itmsGrpCod });
        }

        // Add WHERE clauses if there are conditions
        if (whereClauses.length > 0) {
            baseQuery += ` AND ` + whereClauses.join(' AND ');
        }

        // Complete the query with GROUP BY and ORDER BY
        const fullQuery = `
            ${baseQuery}
            GROUP BY YEAR(T0.DocDate), DATENAME(MONTH, T0.DocDate), MONTH(T0.DocDate)
            ORDER BY MONTH(T0.DocDate)
        `;

        const results = await queryDatabase(fullQuery, params);
        const data = results.map(row => ({
            year: row.year,
            month: row.month,
            monthNumber: row.monthNumber,
            sales: parseFloat(row.sales) || 0,
            cogs: parseFloat(row.cogs) || 0,
            grossMargin: parseFloat(row.grossMargin) || 0,
        }));

        // Get available years for filtering
        const yearsQuery = `
            SELECT DISTINCT YEAR(DocDate) as year
            FROM OINV
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