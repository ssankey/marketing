// pages/api/sales-cogs.js
import { queryDatabase } from '../../lib/db'; // Adjust the import path

export default async function handler(req, res) {
    const { customerId, productId, salesPersonId, categoryId } = req.query;
    console.log('SalesPersonId:', salesPersonId);
    
    let whereClause = `WHERE T0.[CANCELED]='N' `; // Base condition
    if (customerId) whereClause += ` AND T0.CardCode = '${customerId}'`;
    if (productId) whereClause += ` AND T1.ItemCode = '${productId}'`;
    if (salesPersonId) whereClause += ` AND T0.SlpCode = '${salesPersonId}'`;
    if (categoryId) whereClause += ` AND T5.ItmsGrpCod = '${categoryId}'`; // Category filter
    
    const query = `
        SELECT 
            DATENAME(MONTH, T0.[DocDate]) AS month,
            MONTH(T0.[DocDate]) AS monthNumber, -- Retrieve month number for ordering
            ROUND(SUM(
                CASE 
                    WHEN T1.[InvQty] = 0 THEN T1.[LineTotal]
                    WHEN T4.[Quantity] IS NULL THEN T1.[LineTotal]
                    ELSE (T1.[LineTotal] / T1.[InvQty]) * ISNULL(T4.[Quantity], 0)
                END
            ), 2) AS sales,
            ROUND(SUM(T1.GrossBuyPr * ISNULL(T4.[Quantity], 0)), 2) AS cogs,
            ROUND(SUM(
                CASE 
                    WHEN T1.[InvQty] = 0 THEN T1.[LineTotal]
                    WHEN T4.[Quantity] IS NULL THEN T1.[LineTotal]
                    ELSE (T1.[LineTotal] / T1.[InvQty]) * ISNULL(T4.[Quantity], 0)
                END
            ) - SUM(T1.GrossBuyPr * ISNULL(T4.[Quantity], 0)), 2) AS grossMargin
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
        LEFT JOIN OITM T5 ON T1.ItemCode = T5.ItemCode  -- Added join for category filtering
        ${whereClause}
        GROUP BY 
            DATENAME(MONTH, T0.[DocDate]),
            MONTH(T0.[DocDate]) -- Group by month number as well
        ORDER BY 
            MONTH(T0.[DocDate]); -- Order by month number for chronological order
    `;
    
    try {
        console.log('Executing Query:', query);
        
        // Execute the parameterized query
        const results = await queryDatabase(query);
        
        // Transform results to match expected format
        const data = results.map((row) => ({
            month: row.month,
            sales: parseFloat(row.sales) || 0,
            cogs: parseFloat(row.cogs) || 0,
            grossMargin: parseFloat(row.grossMargin) || 0,
        }));
        
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching sales and COGS data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}
