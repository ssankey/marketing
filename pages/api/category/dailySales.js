// pages/api/category/dailySales.js
import { queryDatabase } from '../../../lib/db';
import sql from 'mssql';

export default async function handler(req, res) {
  const { type, month, year, category, customer, salesperson } = req.query;

  if (!month || !year || !type) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

//   // Correct date calculation
// // Correct way to calculate first and last day of the month
// const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
// const lastDay = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of the month

const firstDay = new Date(year, month - 1, 1)
  .toLocaleDateString('en-CA');   // “YYYY-MM-DD” in most browsers

const lastDay = new Date(year, month, 0)
  .toLocaleDateString('en-CA');


  let query = `
    WITH DateRange AS (
      SELECT CAST(@firstDay AS DATE) AS date
      UNION ALL
      SELECT DATEADD(DAY, 1, date)
      FROM DateRange
      WHERE date < @lastDay
    ),
    SalesData AS (
      SELECT 
        CONVERT(VARCHAR, o.DocDate, 23) AS [Date],
        ROUND(SUM(i.LineTotal), 0) AS [DailySales],
        COUNT(i.LineNum) AS [LineItems]
      FROM 
        OINV o
      INNER JOIN 
        INV1 i ON o.DocEntry = i.DocEntry
  `;

  const params = [
    { name: 'firstDay', type: sql.Date, value: firstDay },
    { name: 'lastDay', type: sql.Date, value: lastDay }
  ];

  const whereConditions = [
    'o.CANCELED = \'N\'',
    'o.DocDate >= @firstDay',
    'o.DocDate <= @lastDay'
  ];

  // Add joins and conditions based on filters
  if (category) {
    query += `
      INNER JOIN OITM m ON i.ItemCode = m.ItemCode
      INNER JOIN OITB g ON m.ItmsGrpCod = g.ItmsGrpCod
    `;
    whereConditions.push('g.ItmsGrpNam = @categoryName');
    params.push({ name: 'categoryName', type: sql.NVarChar, value: category });
  }

  if (customer) {
    query += `
      INNER JOIN OCRD c ON o.CardCode = c.CardCode
    `;
    whereConditions.push('c.CardName = @customerName');
    params.push({ name: 'customerName', type: sql.NVarChar, value: customer });
  }

  if (salesperson) {
    query += `
      INNER JOIN OSLP s ON o.SlpCode = s.SlpCode
    `;
    whereConditions.push('s.SlpName = @salespersonName');
    params.push({ name: 'salespersonName', type: sql.NVarChar, value: salesperson });
  }

  // Complete the query
  query += `
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY CONVERT(VARCHAR, o.DocDate, 23)
    )
    SELECT 
      CONVERT(VARCHAR, dr.date, 23) AS date,
      COALESCE(sd.DailySales, 0) AS totalSales,
      COALESCE(sd.LineItems, 0) AS lineItems
    FROM DateRange dr
    LEFT JOIN SalesData sd ON CONVERT(VARCHAR, dr.date, 23) = sd.Date
    ORDER BY dr.date
    OPTION (MAXRECURSION 31)
  `;

  try {
    const result = await queryDatabase(query, params);

    const dailyData = result.map(row => ({
      date: row.date,
      sales: parseInt(row.totalSales) || 0,
      lineItems: parseInt(row.lineItems) || 0
    }));

    return res.status(200).json({ dailyData });
  } catch (err) {
    console.error('Error fetching daily sales:', err);
    return res.status(500).json({
      error: 'Database query failed',
      details: err.message
    });
  }
}