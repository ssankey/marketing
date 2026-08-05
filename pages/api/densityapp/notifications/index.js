import { verify } from 'jsonwebtoken';
import { queryDatabase } from 'lib/db';
import { setCorsHeaders } from 'lib/cors';

// ── Convert HHMMSS int to HH:MM string ──
// e.g. 180004 → "18:00", 715 → "07:15"
function formatTime(ts) {
  if (ts == null) return null;
  const s = String(ts).padStart(6, '0');
  const h = s.substring(0, 2);
  const m = s.substring(2, 4);
  return `${h}:${m}`;
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // ── Auth ──
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let decoded;
    try {
      decoded = verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const isAdmin  = decoded.role === 'admin';
    const slpCodes = decoded.contactCodes || [];

    if (!isAdmin && slpCodes.length === 0) {
      return res.status(200).json({ notifications: [] });
    }

    const slpFilter = isAdmin
      ? ''
      : `AND T0.SlpCode IN (${slpCodes.map(c => `'${c}'`).join(',')})`;

    // ── Query 1: SO Created ──
    const soQuery = `
      SELECT
        'SO_CREATED'        AS type,
        T0.DocNum           AS docNum,
        T0.DocDate          AS docDate,
        T0.CreateTS         AS createTime,
        T0.CardName         AS customerName,
        T5.SlpName          AS salesPerson
      FROM ORDR T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE
        T0.CANCELED = 'N'
        AND T0.DocDate >= CAST(DATEADD(DAY, -7, GETDATE()) AS DATE)
        ${slpFilter}
      ORDER BY T0.DocDate DESC, T0.CreateTS DESC;
    `;

    // ── Query 2: Invoice Created ──
    const invoiceQuery = `
      SELECT
        'INVOICE_CREATED'   AS type,
        T0.DocNum           AS docNum,
        T0.DocDate          AS docDate,
        T0.CreateTS         AS createTime,
        T0.CardName         AS customerName,
        T5.SlpName          AS salesPerson
      FROM OINV T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE
        T0.CANCELED = 'N'
        AND T0.IssReason <> '4'
        AND T0.DocDate >= CAST(DATEADD(DAY, -7, GETDATE()) AS DATE)
        ${slpFilter}
      ORDER BY T0.DocDate DESC, T0.CreateTS DESC;
    `;

    // ── Query 3: Tracking Updated (use U_EmailSentTM for time) ──
    const trackingQuery = `
      SELECT
        'TRACKING_UPDATED'        AS type,
        T0.DocNum                 AS docNum,
        T0.TrackNo                AS trackingNumber,
        CAST(T0.U_TrackingNoUpdateDT AS DATE) AS docDate,
        T0.U_EmailSentTM          AS createTime,
        T0.CardName               AS customerName,
        T5.SlpName                AS salesPerson
      FROM OINV T0
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      WHERE
        T0.CANCELED = 'N'
        AND T0.TrackNo IS NOT NULL
        AND T0.U_TrackingNoUpdateDT IS NOT NULL
        AND CAST(T0.U_TrackingNoUpdateDT AS DATE) >= CAST(DATEADD(DAY, -7, GETDATE()) AS DATE)
        ${slpFilter}
      ORDER BY T0.U_TrackingNoUpdateDT DESC;
    `;

    // ── Run all 3 in parallel ──
    const [soRes, invoiceRes, trackingRes] = await Promise.all([
      queryDatabase(soQuery),
      queryDatabase(invoiceQuery),
      queryDatabase(trackingQuery),
    ]);

    // ── Normalize ──
    const normalize = (rows, dateField = 'docDate') => rows.map(r => ({
      type:           r.type,
      docNum:         r.docNum,
      docDate:        r[dateField] ? new Date(r[dateField]).toISOString().split('T')[0] : null,
      createTime:     formatTime(r.createTime),  // "HH:MM" or null
      customerName:   r.customerName || null,
      salesPerson:    r.salesPerson  || null,
      trackingNumber: r.trackingNumber || null,
    }));

    const all = [
      ...normalize(soRes),
      ...normalize(invoiceRes),
      ...normalize(trackingRes, 'docDate'),
    ];

    // ── Group by date ──
    const grouped = {};
    for (const item of all) {
      const date = item.docDate || 'Unknown';
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    }

    // ── Sort within each date:
    //    Tracking first (no time), then SO + Invoice sorted by time desc ──
    for (const date of Object.keys(grouped)) {
      grouped[date].sort((a, b) => {
        // Tracking always on top
        if (a.type === 'TRACKING_UPDATED' && b.type !== 'TRACKING_UPDATED') return -1;
        if (b.type === 'TRACKING_UPDATED' && a.type !== 'TRACKING_UPDATED') return 1;
        // Both same category → sort by time desc
        if (a.createTime && b.createTime) return b.createTime.localeCompare(a.createTime);
        return 0;
      });
    }

    // ── Sort dates descending ──
    const notifications = Object.entries(grouped)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([date, items]) => ({ date, items }));

    return res.status(200).json({ notifications });

  } catch (error) {
    console.error('notifications error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}