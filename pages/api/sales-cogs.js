import { queryDatabase } from '../../lib/db'; // Adjust the import path

export default async function handler(req, res) {
    const { customerId, productId, salesPersonId, categoryid } = req.query; // Added category to req.query
    console.log(salesPersonId);
    
    let whereClause = 'WHERE T1.LineTotal <> 0'; // Base condition
    if (customerId) whereClause += ` AND T2.CardCode = '${customerId}'`;
    if (productId) whereClause += ` AND T1.ItemCode = '${productId}'`;
    if (salesPersonId) whereClause += ` AND T0.SlpCode = '${salesPersonId}'`;
    if (categoryid) whereClause += ` AND T4.ItmsGrpCod = '${categoryid}'`; // Correct condition for category

    const query = `
        SELECT 
            FORMAT(T0.DocDate, 'MMM yyyy') as month,
            SUM(T1.LineTotal) as sales,
            SUM(T1.GrossBuyPr * T1.Quantity) as cogs,
            SUM(T1.LineTotal - (T1.GrossBuyPr * T1.Quantity)) as grossMargin
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN OCRD T2 ON T0.CardCode = T2.CardCode
        INNER JOIN OITM T3 ON T1.ItemCode = T3.ItemCode -- Join with OITM
        INNER JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod -- Join with OITB
        ${whereClause}
        GROUP BY FORMAT(T0.DocDate, 'MMM yyyy')
        ORDER BY MIN(T0.DocDate)
    `;

    try {
        console.log('cogssss',query);
        
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
