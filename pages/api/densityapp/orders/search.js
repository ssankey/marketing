// pages/api/densityapp/orders/search.js
import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from 'lib/db';
import { setCorsHeaders } from 'lib/cors';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // ── Auth ──
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

    let decoded;
    try { decoded = verify(authHeader.split(' ')[1], process.env.JWT_SECRET); }
    catch { return res.status(401).json({ error: 'Invalid token' }); }

    const { q = '', limit = '7' } = req.query;
    const term = q.trim();

    // Require at least 1 char
    if (!term) return res.status(200).json({ suggestions: [], results: [] });

    const maxRows = Math.min(parseInt(limit) || 7, 20);
    const escaped = term.replace(/'/g, "''");

    // ── Search query: SO no, customer ref no, customer name ──
    // No SLP filtering — any employee can see any order
    const searchQuery = `
      SELECT DISTINCT TOP ${maxRows}
        T0.DocNum           AS soNo,
        T0.DocDate          AS soDate,
        T0.CreateTS         AS soTime,
        T0.NumAtCard        AS customerRefNo,
        T0.CardName         AS customerName,
        T0.DocDueDate       AS deliveryDate,
        T0.DocTotal - T0.VatSum AS totalAmount,
        T0.DocCur           AS currency,
        T5.SlpName          AS salesEmployee,
        T3.Name             AS contactPerson,
        CASE
          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
          WHEN T0.DocStatus='O' THEN 'Open'
          ELSE 'NA'
        END AS status
      FROM ORDR T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      LEFT JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
      WHERE
        T0.CANCELED = 'N'
        AND (
          CAST(T0.DocNum AS VARCHAR) LIKE '%${escaped}%'
          OR T0.NumAtCard            LIKE '%${escaped}%'
          OR T0.CardName             LIKE '%${escaped}%'
        )
      ORDER BY T0.DocDate DESC, T0.CreateTS DESC;
    `;

    const rows = await queryDatabase(searchQuery, []);

    const results = rows.map(r => ({
      soNo:          r.soNo,
      soDate:        r.soDate   ? new Date(r.soDate).toISOString().split('T')[0] : null,
      soTime:        formatTime(r.soTime),
      customerRefNo: r.customerRefNo || null,
      customerName:  r.customerName  || null,
      deliveryDate:  r.deliveryDate  ? new Date(r.deliveryDate).toISOString().split('T')[0] : null,
      totalAmount:   parseFloat(r.totalAmount) || 0,
      currency:      r.currency      || 'INR',
      salesEmployee: r.salesEmployee || null,
      contactPerson: r.contactPerson || null,
      status:        r.status        || 'NA',
    }));

    // Suggestions = compact labels for dropdown
    const suggestions = results.map(r => ({
      label: `SO #${r.soNo} · ${r.customerName || ''} ${r.customerRefNo ? '· Ref: ' + r.customerRefNo : ''}`.trim(),
      soNo:  r.soNo,
    }));

    return res.status(200).json({ suggestions, results });

  } catch (error) {
    console.error('orders/search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function formatTime(ts) {
  if (ts == null) return null;
  const s = String(ts).padStart(6, '0');
  return `${s.substring(0, 2)}:${s.substring(2, 4)}`;
}