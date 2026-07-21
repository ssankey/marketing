// // pages/api/densityapp/orders/detail.js

// import { verify } from 'jsonwebtoken';
// import sql from 'mssql';
// import { queryDatabase } from 'lib/db';
// import { setCorsHeaders } from 'lib/cors';

// export default async function handler(req, res) {
//   if (setCorsHeaders(req, res)) return;
//   if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

//     let decoded;
//     try { decoded = verify(authHeader.split(' ')[1], process.env.JWT_SECRET); }
//     catch { return res.status(401).json({ error: 'Invalid token' }); }

//     const { soNo } = req.query;
//     if (!soNo) return res.status(400).json({ error: 'soNo is required' });

//     const docNum = parseInt(soNo, 10);
//     if (isNaN(docNum)) return res.status(400).json({ error: 'Invalid soNo' });

//     // ── Header query ──
//     const headerQuery = `
//       SELECT DISTINCT
//         T0.DocNum           AS soNo,
//         T0.DocDate          AS soDate,
//         T0.CreateTS         AS soTime,
//         T0.NumAtCard        AS customerRefNo,
//         T0.CardName         AS customerName,
//         T0.CardCode         AS customerCode,
//         T0.DocDueDate       AS deliveryDate,
//         T0.DocTotal - T0.VatSum AS totalAmount,
//         T0.DocCur           AS currency,
//         T5.SlpName          AS salesEmployee,
//         T3.Name             AS contactPerson,
//         T3.E_MailL          AS contactEmail,
//         CASE
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//           WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
//           WHEN T0.DocStatus='O' THEN 'Open'
//           ELSE 'NA'
//         END AS status
//       FROM ORDR T0
//       LEFT JOIN OSLP T5 ON T0.SlpCode  = T5.SlpCode
//       LEFT JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
//       WHERE T0.DocNum = @docNum;
//     `;

//     // ── Line items query ──
//     const linesQuery = `
//       SELECT
//         T1.LineNum          AS lineNum,
//         T1.ItemCode         AS itemCode,
//         T1.Dscription       AS description,
//         T1.U_CasNo          AS casNo,
//         T4.ItmsGrpNam       AS category,
//         T3.SuppCatNum       AS vendorCatNo,
//         T1.U_PackSize       AS packSize,
//         T1.Quantity         AS qty,
//         T1.UnitMsr          AS unit,
//         T1.Price            AS unitPrice,
//         T1.LineTotal        AS totalPrice,
//         T1.LineStatus       AS lineStatus,
//         -- Invoice number linked to this line (if any)
//         OINV.DocNum         AS invoiceNo
//       FROM RDR1 T1
//       LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
//       LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
//       -- Chain: SO line → Delivery line → Invoice line
//       LEFT JOIN DLN1 D  ON T1.DocEntry = D.BaseEntry
//                         AND T1.LineNum  = D.BaseLine
//                         AND D.BaseType = 17
//       LEFT JOIN INV1 I  ON D.DocEntry  = I.BaseEntry
//                         AND D.LineNum   = I.BaseLine
//                         AND I.BaseType = 15
//       LEFT JOIN OINV    ON I.DocEntry  = OINV.DocEntry
//                         AND OINV.CANCELED = 'N'
//       WHERE T1.DocEntry = (
//         SELECT DocEntry FROM ORDR WHERE DocNum = @docNum
//       )
//       ORDER BY T1.LineNum;
//     `;

//     const params = [{ name: 'docNum', type: sql.Int, value: docNum }];

//     const [headerRows, lineRows] = await Promise.all([
//       queryDatabase(headerQuery, params),
//       queryDatabase(linesQuery, params),
//     ]);

//     if (!headerRows.length) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     const h = headerRows[0];
//     const order = {
//       soNo:          h.soNo,
//       soDate:        h.soDate        ? new Date(h.soDate).toISOString().split('T')[0] : null,
//       soTime:        formatTime(h.soTime),
//       customerRefNo: h.customerRefNo || null,
//       customerName:  h.customerName  || null,
//       customerCode:  h.customerCode  || null,
//       deliveryDate:  h.deliveryDate  ? new Date(h.deliveryDate).toISOString().split('T')[0] : null,
//       totalAmount:   parseFloat(h.totalAmount) || 0,
//       currency:      h.currency      || 'INR',
//       salesEmployee: h.salesEmployee || null,
//       contactPerson: h.contactPerson || null,
//       contactEmail:  h.contactEmail  || null,
//       status:        h.status        || 'NA',
//       lineItems: lineRows.map(l => ({
//         lineNum:      l.lineNum,
//         itemCode:     l.itemCode     || '',
//         description:  l.description  || '',
//         casNo:        l.casNo        || null,
//         category:     l.category     || null,
//         vendorCatNo:  l.vendorCatNo  || null,
//         packSize:     l.packSize     || null,
//         qty:          parseFloat(l.qty)        || 0,
//         unit:         l.unit         || null,
//         unitPrice:    parseFloat(l.unitPrice)  || 0,
//         totalPrice:   parseFloat(l.totalPrice) || 0,
//         lineStatus:   l.lineStatus === 'O' ? 'Open' : 'Closed',
//         invoiceNo:    l.invoiceNo    || null,  // ← clickable link to invoice
//       })),
//     };

//     return res.status(200).json({ order });

//   } catch (error) {
//     console.error('orders/detail error:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// }

// function formatTime(ts) {
//   if (ts == null) return null;
//   const s = String(ts).padStart(6, '0');
//   return `${s.substring(0, 2)}:${s.substring(2, 4)}`;
// }

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

    const { soNo } = req.query;
    if (!soNo) return res.status(400).json({ error: 'soNo is required' });

    const docNum = parseInt(soNo, 10);
    if (isNaN(docNum)) return res.status(400).json({ error: 'Invalid soNo' });

    // ── Header query ──
    const headerQuery = `
      SELECT DISTINCT
        T0.DocNum               AS soNo,
        T0.DocDate              AS soDate,
        T0.CreateTS             AS soTime,
        T0.NumAtCard            AS customerRefNo,
        T0.CardName             AS customerName,
        T0.CardCode             AS customerCode,
        T0.DocDueDate           AS deliveryDate,
        T0.DocTotal - T0.VatSum AS totalAmount,
        T0.DocCur               AS currency,
        T5.SlpName              AS salesEmployee,
        T3.Name                 AS contactPerson,
        T3.E_MailL              AS contactEmail,
        CASE
          WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
          WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
          WHEN T0.DocStatus='O' THEN 'Open'
          ELSE 'NA'
        END AS status
      FROM ORDR T0
      LEFT JOIN OSLP T5 ON T0.SlpCode   = T5.SlpCode
      LEFT JOIN OCPR T3 ON T0.CntctCode = T3.CntctCode
      WHERE T0.DocNum = @docNum;
    `;

    // ── Line items — get invoice no per line via Delivery chain ──
    // Use DISTINCT + TOP 1 subquery to avoid duplicates when multiple batches exist
    const linesQuery = `
      SELECT
        T1.LineNum                  AS lineNum,
        T1.ItemCode                 AS itemCode,
        T1.Dscription               AS description,
        T1.U_CasNo                  AS casNo,
        T4.ItmsGrpNam               AS category,
        T3.SuppCatNum               AS vendorCatNo,
        T1.U_PackSize               AS packSize,
        T1.Quantity                 AS qty,
        T1.UnitMsr                  AS unit,
        T1.Price                    AS unitPrice,
        T1.LineTotal                AS totalPrice,
        CASE
          WHEN T1.LineStatus = 'O' THEN 'Open'
          WHEN T1.LineStatus = 'C' THEN 'Closed'
          ELSE 'NA'
        END                         AS lineStatus,
        -- ✅ Get invoice no: SO line → Delivery → Invoice
        -- Using subquery to get exactly one invoice per SO line
        (
          SELECT TOP 1 OINV.DocNum
          FROM DLN1 DL
          INNER JOIN INV1 IV ON DL.DocEntry = IV.BaseEntry
                             AND DL.LineNum  = IV.BaseLine
                             AND IV.BaseType = 15
          INNER JOIN OINV    ON IV.DocEntry  = OINV.DocEntry
                             AND OINV.CANCELED = 'N'
          WHERE DL.BaseEntry = T1.DocEntry
            AND DL.BaseLine  = T1.LineNum
            AND DL.BaseType  = 17
          ORDER BY OINV.DocNum DESC
        )                           AS invoiceNo
      FROM RDR1 T1
      LEFT JOIN OITM T3 ON T1.ItemCode    = T3.ItemCode
      LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
      WHERE T1.DocEntry = (
        SELECT DocEntry FROM ORDR WHERE DocNum = @docNum
      )
      ORDER BY T1.LineNum;
    `;

    const params = [{ name: 'docNum', type: sql.Int, value: docNum }];

    const [headerRows, lineRows] = await Promise.all([
      queryDatabase(headerQuery, params),
      queryDatabase(linesQuery, params),
    ]);

    if (!headerRows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const h = headerRows[0];
    const order = {
      soNo:          h.soNo,
      soDate:        h.soDate        ? new Date(h.soDate).toISOString().split('T')[0] : null,
      soTime:        formatTime(h.soTime),
      customerRefNo: h.customerRefNo || null,
      customerName:  h.customerName  || null,
      customerCode:  h.customerCode  || null,
      deliveryDate:  h.deliveryDate  ? new Date(h.deliveryDate).toISOString().split('T')[0] : null,
      totalAmount:   parseFloat(h.totalAmount) || 0,
      currency:      h.currency      || 'INR',
      salesEmployee: h.salesEmployee || null,
      contactPerson: h.contactPerson || null,
      contactEmail:  h.contactEmail  || null,
      status:        h.status        || 'NA',
      lineItems: lineRows.map(l => ({
        lineNum:     l.lineNum,
        itemCode:    l.itemCode     || '',
        description: l.description  || '',
        casNo:       l.casNo        || null,
        category:    l.category     || null,
        vendorCatNo: l.vendorCatNo  || null,
        packSize:    l.packSize     || null,
        qty:         parseFloat(l.qty)        || 0,
        unit:        l.unit         || null,
        unitPrice:   parseFloat(l.unitPrice)  || 0,
        totalPrice:  parseFloat(l.totalPrice) || 0,
        lineStatus:  l.lineStatus   || 'NA',
        invoiceNo:   l.invoiceNo    || null,   // ✅ clickable
      })),
    };

    return res.status(200).json({ order });

  } catch (error) {
    console.error('orders/detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function formatTime(ts) {
  if (ts == null) return null;
  const s = String(ts).padStart(6, '0');
  return `${s.substring(0, 2)}:${s.substring(2, 4)}`;
}