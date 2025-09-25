// pages/api/cycle-time.js
import sql from "mssql";
import { queryDatabase } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { range = 'all' } = req.query; // Optional range filter

    const query = `
      WITH PO_GRN AS (
        SELECT 
            'PO to GRN' AS Type,
            FORMAT(PO.DocDate, 'yyyy-MM') AS Month,
            CASE 
                WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) < 0 THEN '0-3 days'
                WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) <= 3 THEN '0-3 days'
                WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
                WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
                WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
                ELSE '10+ days'
            END AS Bucket
        FROM OPOR PO
        JOIN POR1 ON PO.DocEntry = POR1.DocEntry
        JOIN PDN1 ON POR1.DocEntry = PDN1.BaseEntry AND POR1.LineNum = PDN1.BaseLine
        JOIN OPDN ON PDN1.DocEntry = OPDN.DocEntry
        WHERE OPDN.CANCELED = 'N'
      ),
      GRN_INV AS (
        SELECT 
            'GRN to Invoice' AS Type,
            FORMAT(OPDN.DocDate, 'yyyy-MM') AS Month,
            CASE 
                WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) < 0 THEN '0-3 days'
                WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) <= 3 THEN '0-3 days'
                WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
                WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
                WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
                ELSE '10+ days'
            END AS Bucket
        FROM OPDN
        JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry
        JOIN INV1 ON PDN1.DocEntry = INV1.BaseEntry AND PDN1.LineNum = INV1.BaseLine
        JOIN OINV ON INV1.DocEntry = OINV.DocEntry
        WHERE OINV.CANCELED = 'N'
      ),
      INV_DISP AS (
        SELECT 
            'Invoice to Dispatch' AS Type,
            FORMAT(OINV.DocDate, 'yyyy-MM') AS Month,
            CASE 
                WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) < 0 THEN '0-3 days'
                WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) <= 3 THEN '0-3 days'
                WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) BETWEEN 4 AND 5 THEN '4-5 days'
                WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) BETWEEN 6 AND 8 THEN '6-8 days'
                WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) BETWEEN 9 AND 10 THEN '9-10 days'
                ELSE '10+ days'
            END AS Bucket
        FROM OINV
        WHERE OINV.CANCELED = 'N' 
          AND OINV.U_DispatchDate IS NOT NULL
      ),
      Combined AS (
        SELECT * FROM PO_GRN
        UNION ALL
        SELECT * FROM GRN_INV
        UNION ALL
        SELECT * FROM INV_DISP
      ),
      BucketCounts AS (
        SELECT 
            Type,
            Month,
            Bucket,
            COUNT(*) AS TotalCount
        FROM Combined
        GROUP BY Type, Month, Bucket
      ),
      BucketPercents AS (
        SELECT 
            Type,
            Month,
            Bucket,
            TotalCount,
            CAST(100.0 * TotalCount / SUM(TotalCount) OVER(PARTITION BY Type, Month) AS DECIMAL(5,2)) AS Percentage
        FROM BucketCounts
      )
      SELECT 
          Type,
          Month,
          ISNULL([0-3 days_count],0) AS [0-3 days_count],
          ISNULL([4-5 days_count],0) AS [4-5 days_count],
          ISNULL([6-8 days_count],0) AS [6-8 days_count],
          ISNULL([9-10 days_count],0) AS [9-10 days_count],
          ISNULL([10+ days_count],0) AS [10+ days_count],
          ISNULL([0-3 days_pct],0) AS [0-3 days_%],
          ISNULL([4-5 days_pct],0) AS [4-5 days_%],
          ISNULL([6-8 days_pct],0) AS [6-8 days_%],
          ISNULL([9-10 days_pct],0) AS [9-10 days_%],
          ISNULL([10+ days_pct],0) AS [10+ days_%]
      FROM (
          SELECT 
              Type,
              Month,
              Bucket + '_count' AS ColName,
              TotalCount AS Val
          FROM BucketPercents
          UNION ALL
          SELECT 
              Type,
              Month,
              Bucket + '_pct' AS ColName,
              Percentage AS Val
          FROM BucketPercents
      ) src
      PIVOT (
          MAX(Val) FOR ColName IN (
              [0-3 days_count],[4-5 days_count],[6-8 days_count],[9-10 days_count],[10+ days_count],
              [0-3 days_pct],[4-5 days_pct],[6-8 days_pct],[9-10 days_pct],[10+ days_pct]
          )
      ) p
      ORDER BY Type, Month;
    `;

    const results = await queryDatabase(query);
    
    res.status(200).json(results || []);

  } catch (error) {
    console.error('Cycle time API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}