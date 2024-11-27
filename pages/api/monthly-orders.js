import { queryDatabase } from '../../lib/db'; // Adjust the import path

export default async function handler(req, res) {
    const { startDate, endDate, region, customer } = req.query;
    
    try {
        let whereClause = 'WHERE 1=1';
        
        // Add date filters if provided
        if (startDate && endDate) {
            whereClause += ` AND T0.DocDate BETWEEN '${startDate}' AND '${endDate}'`;
        } else {
            whereClause += ` AND YEAR(T0.DocDate) = YEAR(GETDATE())`; // Default to current year
        }

        // Add region filter if provided
        if (region) whereClause += ` AND T0.Region = '${region}'`;
        
        // Add customer filter if provided
        if (customer) whereClause += ` AND T0.CardCode = '${customer}'`;

        const query = `
            SELECT 
                MONTH(T0.DocDate) AS Month,
                CASE 
                    WHEN T0.DocStatus = 'O' THEN 'Open'
                    WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'N' THEN 'Closed'
                    ELSE 'NA'
                END AS OrderStatus,
                COUNT(T0.DocEntry) AS OrderCount
            FROM ORDR T0
            ${whereClause}
            GROUP BY 
                MONTH(T0.DocDate),
                CASE 
                    WHEN T0.DocStatus = 'O' THEN 'Open'
                    WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'N' THEN 'Closed'
                    ELSE 'NA'
                END
            ORDER BY Month ASC
        `;

        console.log('Order Status Query:', query);
        
        const results = await queryDatabase(query);
        
        // Transform the results into the required format
        const monthlyData = new Array(12).fill(null).map((_, index) => ({
            month: index + 1,
            openOrders: 0,
            closedOrders: 0
        }));

        results.forEach((row) => {
            const monthIndex = row.Month - 1;
            if (row.OrderStatus === 'Open') {
                monthlyData[monthIndex].openOrders = parseInt(row.OrderCount, 10);
            } else if (row.OrderStatus === 'Closed') {
                monthlyData[monthIndex].closedOrders = parseInt(row.OrderCount, 10);
            }
        });

        res.status(200).json(monthlyData);
        
    } catch (error) {
        console.error('Error fetching order status data:', error);
        res.status(500).json({ error: 'Failed to fetch order status data' });
    }
}