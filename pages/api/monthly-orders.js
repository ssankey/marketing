import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from '../../lib/db';

export default async function handler(req, res) {
    try {
        const { year } = req.query;
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
            WHERE T0.CANCELED = 'N'
            ${year ? 'AND YEAR(T0.DocDate) = @year' : ''}
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
                YEAR(T0.DocDate),
                DATENAME(MONTH, T0.DocDate),
                MONTH(T0.DocDate)
            ORDER BY 
                MONTH(T0.DocDate)
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

        // Get available years
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
