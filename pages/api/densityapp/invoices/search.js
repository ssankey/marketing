// pages/api/densityapp/invoices/search.js
import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from 'lib/db';
import { setCorsHeaders } from 'lib/cors';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

    let decoded;
    try { decoded = verify(authHeader.split(' ')[1], process.env.JWT_SECRET); }
    catch { return res.status(401).json({ error: 'Invalid token' }); }

    const { q = '', limit = '7' } = req.query;
    const term = q.trim();

    if (!term) return res.status(200).json({ suggestions: [], results: [] });

    const maxRows = Math.min(parseInt(limit) || 7, 20);
    const escaped = term.replace(/'/g, "''");

    // Search by: invoice no, SO no, customer ref no, customer name, tracking no
    const searchQuery = `
      SELECT DISTINCT TOP ${maxRows}
        T0.DocNum             AS invoiceNo,
        T0.DocDate            AS invoiceDate,
        T0.CreateTS           AS invoiceTime,
        T13.DocNum            AS soNo,
        T0.NumAtCard          AS customerRefNo,
        T0.CardName           AS customerName,
        T0.CardCode           AS customerCode,
        T0.TrackNo            AS trackingNo,
        T0.U_TrackingNoUpdateDT AS trackingUpdatedDate,
        T0.U_DispatchDate     AS dispatchDate,
        T0.U_DeliveryDate     AS deliveryDate,
        T0.U_AirlineName      AS shippingMethod,
        SHP.TrnspName         AS transportName,
        T5.SlpName            AS salesPerson,
        T7.Name               AS contactPerson,
        T0.DocTotal           AS totalAmount,
        T0.DocCur             AS currency,
        CASE
          WHEN T0.DocStatus='C' AND T0.CANCELED='N' THEN 'Closed'
          WHEN T0.DocStatus='C' AND T0.CANCELED='Y' THEN 'Cancelled'
          WHEN T0.DocStatus='O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
          WHEN T0.DocStatus='O' THEN 'Open'
          ELSE 'NA'
        END AS status
      FROM OINV T0
      LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
      LEFT JOIN OSLP T5  ON T0.SlpCode   = T5.SlpCode
      LEFT JOIN OCPR T7  ON T0.CntctCode = T7.CntctCode
      -- SO chain
      LEFT JOIN INV1 I1  ON T0.DocEntry  = I1.DocEntry
      LEFT JOIN DLN1 D1  ON I1.BaseEntry = D1.DocEntry AND I1.BaseLine = D1.LineNum AND I1.BaseType = 15
      LEFT JOIN RDR1 R1  ON D1.BaseEntry = R1.DocEntry AND D1.BaseLine = R1.LineNum AND D1.BaseType = 17
      LEFT JOIN ORDR T13 ON R1.DocEntry  = T13.DocEntry
      WHERE
        T0.CANCELED = 'N'
        AND T0.IssReason <> '4'
        AND (
          CAST(T0.DocNum AS VARCHAR)    LIKE '%${escaped}%'
          OR CAST(T13.DocNum AS VARCHAR) LIKE '%${escaped}%'
          OR T0.NumAtCard               LIKE '%${escaped}%'
          OR T0.CardName                LIKE '%${escaped}%'
          OR T0.TrackNo                 LIKE '%${escaped}%'
        )
      ORDER BY T0.DocDate DESC, T0.CreateTS DESC;
    `;

    const rows = await queryDatabase(searchQuery, []);

    const results = rows.map(r => ({
      invoiceNo:          r.invoiceNo,
      invoiceDate:        r.invoiceDate        ? new Date(r.invoiceDate).toISOString().split('T')[0] : null,
      invoiceTime:        formatTime(r.invoiceTime),
      soNo:               r.soNo               || null,
      customerRefNo:      r.customerRefNo       || null,
      customerName:       r.customerName        || null,
      customerCode:       r.customerCode        || null,
      trackingNo:         r.trackingNo          || null,
      trackingUpdatedDate: r.trackingUpdatedDate ? new Date(r.trackingUpdatedDate).toISOString().split('T')[0] : null,
      dispatchDate:       r.dispatchDate        ? new Date(r.dispatchDate).toISOString().split('T')[0] : null,
      deliveryDate:       r.deliveryDate        ? new Date(r.deliveryDate).toISOString().split('T')[0] : null,
      shippingMethod:     r.shippingMethod      || null,
      transportName:      r.transportName       || null,
      salesPerson:        r.salesPerson         || null,
      contactPerson:      r.contactPerson       || null,
      totalAmount:        parseFloat(r.totalAmount) || 0,
      currency:           r.currency            || 'INR',
      status:             r.status              || 'NA',
    }));

    const suggestions = results.map(r => ({
      label: `INV #${r.invoiceNo} · ${r.customerName || ''} ${r.trackingNo ? '· TRK: ' + r.trackingNo : ''}`.trim(),
      invoiceNo: r.invoiceNo,
    }));

    return res.status(200).json({ suggestions, results });

  } catch (error) {
    console.error('invoices/search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function formatTime(ts) {
  if (ts == null) return null;
  const s = String(ts).padStart(6, '0');
  return `${s.substring(0, 2)}:${s.substring(2, 4)}`;
}