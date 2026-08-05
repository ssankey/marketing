

// pages/api/customers/[id]/delivery-performance.js
import { queryDatabase } from "../../../../lib/db";
import sql from 'mssql';

export default async function handler(req, res) {
  const { id, salesPerson, category, contactPerson } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Customer ID is required" });
  }

  try {
    const where = [`OINV.DocDate IS NOT NULL`, `T0.CardCode = @customerCode`];
    const params = [
      { name: 'customerCode', type: sql.NVarChar, value: id }
    ];

    if (salesPerson) {
      where.push('T0.SlpCode = @salesPersonCode');
      params.push({ name: 'salesPersonCode', type: sql.Int, value: parseInt(salesPerson, 10) });
    }

    if (category) {
      where.push('IB.ItmsGrpNam = @category');
      params.push({ name: 'category', type: sql.NVarChar, value: category });
    }

    if (contactPerson) {
      where.push('T0.CntctCode = @cntctCode');
      params.push({ name: 'cntctCode', type: sql.NVarChar, value: contactPerson });
    }

    const query = `
      SELECT 
        FORMAT(OINV.DocDate, 'MMM-yyyy') AS [Month],
        COUNT(CASE WHEN DATEDIFF(DAY, T0.DocDate, OINV.DocDate) BETWEEN 0 AND 3 THEN 1 END) AS Green,
        COUNT(CASE WHEN DATEDIFF(DAY, T0.DocDate, OINV.DocDate) BETWEEN 4 AND 5 THEN 1 END) AS Orange,
        COUNT(CASE WHEN DATEDIFF(DAY, T0.DocDate, OINV.DocDate) BETWEEN 6 AND 8 THEN 1 END) AS Blue,
        COUNT(CASE WHEN DATEDIFF(DAY, T0.DocDate, OINV.DocDate) BETWEEN 9 AND 10 THEN 1 END) AS Purple,
        COUNT(CASE WHEN DATEDIFF(DAY, T0.DocDate, OINV.DocDate) > 10 THEN 1 END) AS Red,
        COUNT(*) AS TotalOrders,
        COUNT(CASE WHEN DATEDIFF(DAY, T0.DocDate, OINV.DocDate) <= 8 THEN 1 END) AS SLAAchieved,
        ROUND(
          100.0 * COUNT(CASE WHEN DATEDIFF(DAY, T0.DocDate, OINV.DocDate) <= 8 THEN 1 END) / NULLIF(COUNT(*), 0),
          2
        ) AS SLAAchievedPercentage
      FROM ORDR T0
      INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17
      LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15
      LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
      LEFT JOIN OITM T2 ON T1.ItemCode = T2.ItemCode
      LEFT JOIN OITB IB ON T2.ItmsGrpCod = IB.ItmsGrpCod
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE ${where.join(' AND ')}
      GROUP BY FORMAT(OINV.DocDate, 'MMM-yyyy')
      ORDER BY MIN(OINV.DocDate);
    `;

    const rawData = await queryDatabase(query, params);

    const formattedData = rawData.map(item => ({
      month: item.Month,
      green: item.Green || 0,
      orange: item.Orange || 0,
      blue: item.Blue || 0,
      purple: item.Purple || 0,
      red: item.Red || 0,
      totalOrders: item.TotalOrders || 0,
      slaPercentage: item.SLAAchievedPercentage || 0
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching delivery performance data:", error);
    res.status(500).json({ error: "Failed to fetch delivery performance data" });
  }
}
