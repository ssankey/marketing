//pages/api/sales-cogs.js
import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from '../../lib/db';

export default async function handler(req, res) {
    try {
        const { year } = req.query; // Add year parameter
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
                YEAR(
                    CASE 
                        WHEN T0.[DocNum] = 24200048 THEN DATEADD(MONTH, -1, T0.[DocDate]) 
                        ELSE T0.[DocDate] 
                    END) AS year,
                DATENAME(MONTH, 
                    CASE 
                        WHEN T0.[DocNum] = 24200048 THEN DATEADD(MONTH, -1, T0.[DocDate]) 
                        ELSE T0.[DocDate] 
                    END) AS month, 
                MONTH(
                    CASE 
                        WHEN T0.[DocNum] = 24200048 THEN DATEADD(MONTH, -1, T0.[DocDate]) 
                        ELSE T0.[DocDate] 
                    END) AS monthNumber,
                ROUND(SUM( 
                    CASE 
                        WHEN T1.[InvQty] = 0 THEN T1.[LineTotal] 
                        WHEN T4.[Quantity] IS NULL THEN T1.[LineTotal] 
                        ELSE (T1.[LineTotal] / T1.[InvQty]) * ISNULL(T4.[Quantity], 0) 
                    END ), 2) AS sales,
                ROUND(SUM(T1.GrossBuyPr * ISNULL(T4.[Quantity], 0)), 2) AS cogs,
                ROUND(SUM( 
                    CASE 
                        WHEN T1.[InvQty] = 0 THEN T1.[LineTotal] 
                        WHEN T4.[Quantity] IS NULL THEN T1.[LineTotal] 
                        ELSE (T1.[LineTotal] / T1.[InvQty]) * ISNULL(T4.[Quantity], 0) 
                    END ) - SUM(T1.GrossBuyPr * ISNULL(T4.[Quantity], 0)), 2) AS grossMargin
            FROM OINV T0 
            INNER JOIN INV1 T1 ON T0.[DocEntry] = T1.[DocEntry] 
            INNER JOIN INV12 b ON T0.[DocEntry] = b.[DocEntry] 
            LEFT JOIN DLN1 T2 ON T2.[ItemCode] = T1.[ItemCode] 
                AND T2.[DocEntry] = T1.[BaseEntry] 
                AND T1.[BaseType] = 15 
                AND T1.[BaseLine] = T2.[LineNum] 
            LEFT JOIN ODLN T3 ON T3.[DocEntry] = T2.[DocEntry] 
            LEFT JOIN IBT1 T4 ON T4.[BsDocType] = 17 
                AND T4.[CardCode] = T3.[CardCode] 
                AND T4.[ItemCode] = T2.[ItemCode] 
                AND T4.[BaseNum] = T3.[DocNum] 
                AND T4.[BaseEntry] = T3.[DocEntry] 
                AND T4.[BaseType] = 15 
                AND T4.[BaseLinNum] = T2.[LineNum] 
                AND T4.[Direction] = 1 
            LEFT JOIN OITM T5 ON T1.ItemCode = T5.ItemCode 
            WHERE T0.[CANCELED]='N'
            ${year ? `AND YEAR(T0.[DocDate]) = @year` : ''}
        `;

        let whereClause = '';
        let params = year ? [{ name: 'year', type: sql.Int, value: parseInt(year) }] : [];

        if (!isAdmin) {
            const contactCodes = decoded.contactCodes || [];
            if (!contactCodes.length) {
                return res.status(403).json({ error: 'No contact codes available' });
            }

            const contactParams = contactCodes.map((code, index) => ({
                name: `contactCode${index}`,
                type: sql.VarChar(50),
                value: code
            }));

            whereClause = `AND T0.CardCode IN (
                SELECT CardCode FROM OCPR 
                WHERE CntctCode IN (${contactParams.map((_, i) => `@contactCode${i}`).join(',')})
            )`;

            params = [...params, ...contactParams];
        }

        const fullQuery = `
            ${baseQuery}
            ${whereClause}
            GROUP BY 
                YEAR(
                    CASE 
                        WHEN T0.[DocNum] = 24200048 THEN DATEADD(MONTH, -1, T0.[DocDate]) 
                        ELSE T0.[DocDate] 
                    END),
                DATENAME(MONTH, 
                    CASE 
                        WHEN T0.[DocNum] = 24200048 THEN DATEADD(MONTH, -1, T0.[DocDate]) 
                        ELSE T0.[DocDate] 
                    END), 
                MONTH(
                    CASE 
                        WHEN T0.[DocNum] = 24200048 THEN DATEADD(MONTH, -1, T0.[DocDate]) 
                        ELSE T0.[DocDate] 
                    END)
            ORDER BY 
                MONTH(
                    CASE 
                        WHEN T0.[DocNum] = 24200048 THEN DATEADD(MONTH, -1, T0.[DocDate]) 
                        ELSE T0.[DocDate] 
                    END)
        `;

        const results = await queryDatabase(fullQuery, params);
        const data = results.map(row => ({
            year: row.year,
            month: row.month,
            sales: parseFloat(row.sales) || 0,
            cogs: parseFloat(row.cogs) || 0,
            grossMargin: parseFloat(row.grossMargin) || 0,
        }));

        // Get available years
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