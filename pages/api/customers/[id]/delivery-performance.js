

// pages/api/customers/[customerId]/delivery-performance.js
import { queryDatabase } from "../../../../lib/db";

export default async function handler(req, res) {
  const { customerId } = req.query;

  try {
    // Query to get delivery performance data with proper date range 
    const query = `
      WITH DateRange AS (
        SELECT 
          MIN(DATEFROMPARTS(YEAR(T0.DocDate), MONTH(T0.DocDate), 1)) AS MinDate,
          MAX(DATEFROMPARTS(YEAR(T0.DocDate), MONTH(T0.DocDate), 1)) AS MaxDate
        FROM ORDR T0
        WHERE T0.CANCELED = 'N' 
        ${customerId && customerId !== "undefined" ? `AND T0.CardCode = '${customerId}'` : ''}
      ),
      Months AS (
        SELECT 
          DATEADD(MONTH, number, (SELECT MinDate FROM DateRange)) AS MonthDate
        FROM master.dbo.spt_values
        WHERE type = 'P' 
          AND number <= DATEDIFF(MONTH, (SELECT MinDate FROM DateRange), (SELECT MaxDate FROM DateRange))
      ),
      MonthlyData AS (
        SELECT 
          YEAR(m.MonthDate) AS Year,
          MONTH(m.MonthDate) AS Month,
          DATENAME(MONTH, m.MonthDate) + ' ' + CAST(YEAR(m.MonthDate) AS VARCHAR) AS MonthName,
          COUNT(T0.DocEntry) AS TotalOrders,
          SUM(CASE WHEN DATEDIFF(DAY, T0.DocDate, ISNULL(OINV.U_DeliveryDate, T0.DocDueDate)) <= 3 THEN 1 ELSE 0 END) AS GreenCount,
          SUM(CASE WHEN DATEDIFF(DAY, T0.DocDate, ISNULL(OINV.U_DeliveryDate, T0.DocDueDate)) BETWEEN 4 AND 5 THEN 1 ELSE 0 END) AS OrangeCount,
          SUM(CASE WHEN DATEDIFF(DAY, T0.DocDate, ISNULL(OINV.U_DeliveryDate, T0.DocDueDate)) BETWEEN 6 AND 8 THEN 1 ELSE 0 END) AS BlueCount,
          SUM(CASE WHEN DATEDIFF(DAY, T0.DocDate, ISNULL(OINV.U_DeliveryDate, T0.DocDueDate)) BETWEEN 9 AND 10 THEN 1 ELSE 0 END) AS PurpleCount,
          SUM(CASE WHEN DATEDIFF(DAY, T0.DocDate, ISNULL(OINV.U_DeliveryDate, T0.DocDueDate)) > 10 THEN 1 ELSE 0 END) AS RedCount,
          SUM(CASE 
              WHEN DATEDIFF(DAY, T0.DocDate, ISNULL(OINV.U_DeliveryDate, T0.DocDueDate)) 
                  <= DATEDIFF(DAY, T0.DocDate, T0.DocDueDate) 
              THEN 1 ELSE 0 END) AS SLAAchievedCount
        FROM Months m
        LEFT JOIN ORDR T0 
          ON DATEFROMPARTS(YEAR(T0.DocDate), MONTH(T0.DocDate), 1) = m.MonthDate
          AND T0.CANCELED = 'N'
          ${customerId && customerId !== "undefined" ? `AND T0.CardCode = '${customerId}'` : ''}
        LEFT JOIN DLN1 ON T0.DocEntry = DLN1.BaseEntry AND DLN1.BaseType = 17
        LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND INV1.BaseType = 15
        LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
        GROUP BY 
          YEAR(m.MonthDate),
          MONTH(m.MonthDate),
          DATENAME(MONTH, m.MonthDate) + ' ' + CAST(YEAR(m.MonthDate) AS VARCHAR)
      )
      SELECT 
        Year,
        Month,
        MonthName,
        TotalOrders,
        GreenCount,
        OrangeCount,
        BlueCount,
        PurpleCount,
        RedCount,
        ROUND(
          CASE 
            WHEN TotalOrders > 0 THEN (SLAAchievedCount * 100.0 / TotalOrders) 
            ELSE 0 
          END, 2
        ) AS SLAAchievedPercentage
      FROM MonthlyData
      ORDER BY Year, Month;
    `;

    const rawData = await queryDatabase(query);
    console.log("Raw SQL query results:", rawData);

    // Format the data to match what the frontend component expects
    const formattedData = rawData.map(item => ({
      month: item.MonthName,
      totalOrders: item.TotalOrders || 0,
      green: item.GreenCount || 0,
      orange: item.OrangeCount || 0,
      blue: item.BlueCount || 0,
      purple: item.PurpleCount || 0,
      red: item.RedCount || 0,
      slaPercentage: item.SLAAchievedPercentage || 0
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching delivery performance data:", error);
    res.status(500).json({ error: "Failed to fetch delivery performance data" });
  }
}