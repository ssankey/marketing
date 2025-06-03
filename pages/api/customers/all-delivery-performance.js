
// pages/api/customers/all-delivery-performance.js
import { queryDatabase } from '../../../lib/db';
import sql from 'mssql';

export default async function handler(req, res) {
  const { salesPerson, category, customer, product } = req.query;

  /* ── build WHERE + param list on the fly ───────────────────────── */
  const where   = ['OINV.DocDate IS NOT NULL'];
  const params  = [];

  if (salesPerson) {
    where.push('T0.SlpCode = @slpCode');
    params.push({ name: 'slpCode', type: sql.Int, value: +salesPerson });
  }

  if (category) {                     // front-end sends the group **name**
    where.push('IB.ItmsGrpNam = @grpName');
    params.push({ name: 'grpName', type: sql.NVarChar, value: category });
  }

  if (customer) {
    where.push('T0.CardCode = @cardCode');
    params.push({ name: 'cardCode', type: sql.NVarChar, value: customer });
  }

  if (product) {
    where.push('T2.ItemCode = @itemCode');
    params.push({ name: 'itemCode', type: sql.NVarChar, value: product });
  }

  /* ── final SQL ─────────────────────────────────────────────────── */
  const sqlText = `
    SELECT
      FORMAT(OINV.DocDate,'MMM-yyyy')                        AS [Month],
      COUNT(CASE WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) BETWEEN 0  AND 3  THEN 1 END) AS Green,
      COUNT(CASE WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) BETWEEN 4  AND 5  THEN 1 END) AS Orange,
      COUNT(CASE WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) BETWEEN 6  AND 8  THEN 1 END) AS Blue,
      COUNT(CASE WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) BETWEEN 9  AND 10 THEN 1 END) AS Purple,
      COUNT(CASE WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) > 10                       THEN 1 END) AS Red,
      COUNT(*)                                                        AS TotalOrders,
      COUNT(CASE WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) <= 8 THEN 1 END)           AS SLAAchieved,
      ROUND(
        100.0 * COUNT(CASE WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) <= 8 THEN 1 END)
        / NULLIF(COUNT(*),0), 2
      )                                                              AS SLAAchievedPercentage
    FROM  ORDR  T0
    JOIN  RDR1  T1 ON T0.DocEntry = T1.DocEntry
    LEFT  JOIN  DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17
    LEFT  JOIN  INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15
    LEFT  JOIN  OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
    LEFT  JOIN  OITM T2 ON T1.ItemCode  = T2.ItemCode           -- product
    LEFT  JOIN  OITB IB ON T2.ItmsGrpCod = IB.ItmsGrpCod        -- category
    ${salesPerson ? 'LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode' : ''}
    WHERE ${where.join(' AND ')}
    GROUP BY FORMAT(OINV.DocDate,'MMM-yyyy')
    ORDER BY MIN(OINV.DocDate);
  `;

  /* ── execute & return ──────────────────────────────────────────── */
  try {
    const rows = await queryDatabase(sqlText, params);
    const data = rows.map(r => ({
      month : r.Month,
      green : r.Green  ?? 0,
      orange: r.Orange ?? 0,
      blue  : r.Blue   ?? 0,
      purple: r.Purple ?? 0,
      red   : r.Red    ?? 0,
      totalOrders : r.TotalOrders,
      slaPercentage: r.SLAAchievedPercentage
    }));
    res.status(200).json(data);
  } catch (err) {
    console.error('all-delivery-performance API error:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
