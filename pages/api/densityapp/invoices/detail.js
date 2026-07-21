// // pages/api/densityapp/invoices/detail.js
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

//     const { invoiceNo } = req.query;
//     if (!invoiceNo) return res.status(400).json({ error: 'invoiceNo is required' });

//     const docNum = parseInt(invoiceNo, 10);
//     if (isNaN(docNum)) return res.status(400).json({ error: 'Invalid invoiceNo' });

//     // ── Header ──
//     const headerQuery = `
//       SELECT DISTINCT
//         T0.DocNum             AS invoiceNo,
//         T0.DocDate            AS invoiceDate,
//         T0.CreateTS           AS invoiceTime,
//         T4.DocNum             AS soNo,
//         T4.DocDate            AS soDate,
//         T0.NumAtCard          AS customerRefNo,
//         T0.CardName           AS customerName,
//         T0.CardCode           AS customerCode,
//         T7.Name               AS contactPerson,
//         T7.E_MailL            AS contactEmail,
//         T5.SlpName            AS salesPerson,
//         T5.Email              AS salesPersonEmail,
//         T6.PymntGroup         AS paymentTerms,
//         T0.DocTotal           AS totalAmount,
//         T0.DocCur             AS currency,
//         T0.TrackNo            AS trackingNo,
//         T0.U_TrackingNoUpdateDT AS trackingUpdatedDate,
//         T0.U_DispatchDate     AS dispatchDate,
//         T0.U_DeliveryDate     AS deliveryDate,
//         T0.U_AirlineName      AS shippingMethod,
//         SHP.TrnspName         AS transportName,
//         CASE
//           WHEN T0.DocStatus='C' AND T0.CANCELED='N' THEN 'Closed'
//           WHEN T0.DocStatus='C' AND T0.CANCELED='Y' THEN 'Cancelled'
//           WHEN T0.DocStatus='O' AND T0.PaidToDate > 0 AND T0.DocTotal > T0.PaidToDate THEN 'Partially Open'
//           WHEN T0.DocStatus='O' THEN 'Open'
//           ELSE 'NA'
//         END AS status
//       FROM OINV T0
//       LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
//       LEFT JOIN OSLP T5  ON T0.SlpCode   = T5.SlpCode
//       LEFT JOIN OCPR T7  ON T0.CntctCode = T7.CntctCode
//       LEFT JOIN OCTG T6  ON T0.GroupNum  = T6.GroupNum
//       -- SO chain
//       LEFT JOIN INV1 I1  ON T0.DocEntry  = I1.DocEntry
//       LEFT JOIN DLN1 D1  ON I1.BaseEntry = D1.DocEntry AND I1.BaseLine = D1.LineNum AND I1.BaseType = 15
//       LEFT JOIN RDR1 R1  ON D1.BaseEntry = R1.DocEntry AND D1.BaseLine = R1.LineNum AND D1.BaseType = 17
//       LEFT JOIN ORDR T4  ON R1.DocEntry  = T4.DocEntry
//       WHERE T0.DocNum = @docNum AND T0.CANCELED = 'N';
//     `;

//     // ── Line items ──
//     const linesQuery = `
//       SELECT
//         T1.LineNum            AS lineNum,
//         T1.ItemCode           AS itemCode,
//         T1.Dscription         AS description,
//         T1.U_CasNo            AS casNo,
//         ITMGRP.ItmsGrpNam     AS category,
//         T1.Price              AS unitPrice,
//         T1.Quantity           AS qty,
//         T1.LineTotal          AS totalPrice,
//         T1.UnitMsr            AS unit,
//         -- Batch info
//         ISNULL(T15.BatchNum, '')           AS batchNo,
//         ISNULL(T15.U_vendorbatchno, '')    AS vendorBatchNo,
//         CAST(T15.U_COA AS NVARCHAR(MAX))   AS localCoaFilename,
//         -- Energy COA URL
//         CASE
//           WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS NVARCHAR(MAX)))) <> ''
//             THEN ''
//           WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND T1.ItemCode <> ''
//             THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' +
//                  LEFT(T1.ItemCode, CHARINDEX('-', T1.ItemCode + '-') - 1) + '_' + T15.U_vendorbatchno + '.pdf'
//           ELSE ''
//         END AS energyCoaUrl,
//         CASE
//           WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS NVARCHAR(MAX)))) <> '' THEN 'LOCAL'
//           WHEN ISNULL(T15.U_vendorbatchno, '') <> '' THEN 'ENERGY'
//           ELSE 'NONE'
//         END AS coaSource
//       FROM INV1 T1
//       LEFT JOIN DLN1 T2  ON T2.ItemCode  = T1.ItemCode
//                          AND T2.DocEntry  = T1.BaseEntry
//                          AND T1.BaseType = 15
//                          AND T1.BaseLine  = T2.LineNum
//       LEFT JOIN ODLN T3  ON T3.DocEntry  = T2.DocEntry
//       LEFT JOIN IBT1 T4  ON T4.CardCode  = T3.CardCode
//                          AND T4.ItemCode  = T2.ItemCode
//                          AND T4.BaseNum   = T3.DocNum
//                          AND T4.BaseEntry = T3.DocEntry
//                          AND T4.BaseType = 15
//                          AND T4.BaseLinNum = T2.LineNum
//                          AND T4.Direction = 1
//       LEFT JOIN OIBT T15 ON T4.ItemCode  = T15.ItemCode AND T4.BatchNum = T15.BatchNum
//       LEFT JOIN OITM ITM ON T1.ItemCode  = ITM.ItemCode
//       LEFT JOIN OITB ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
//       WHERE T1.DocEntry = (SELECT DocEntry FROM OINV WHERE DocNum = @docNum AND CANCELED = 'N')
//       ORDER BY T1.LineNum;
//     `;

//     const params = [{ name: 'docNum', type: sql.Int, value: docNum }];

//     const [headerRows, lineRows] = await Promise.all([
//       queryDatabase(headerQuery, params),
//       queryDatabase(linesQuery, params),
//     ]);

//     if (!headerRows.length) return res.status(404).json({ error: 'Invoice not found' });

//     const h = headerRows[0];
//     const invoice = {
//       invoiceNo:          h.invoiceNo,
//       invoiceDate:        h.invoiceDate        ? new Date(h.invoiceDate).toISOString().split('T')[0] : null,
//       invoiceTime:        formatTime(h.invoiceTime),
//       soNo:               h.soNo               || null,
//       soDate:             h.soDate             ? new Date(h.soDate).toISOString().split('T')[0] : null,
//       customerRefNo:      h.customerRefNo       || null,
//       customerName:       h.customerName        || null,
//       customerCode:       h.customerCode        || null,
//       contactPerson:      h.contactPerson       || null,
//       contactEmail:       h.contactEmail        || null,
//       salesPerson:        h.salesPerson         || null,
//       salesPersonEmail:   h.salesPersonEmail    || null,
//       paymentTerms:       h.paymentTerms        || null,
//       totalAmount:        parseFloat(h.totalAmount) || 0,
//       currency:           h.currency            || 'INR',
//       trackingNo:         h.trackingNo          || null,
//       trackingUpdatedDate: h.trackingUpdatedDate ? new Date(h.trackingUpdatedDate).toISOString().split('T')[0] : null,
//       dispatchDate:       h.dispatchDate        ? new Date(h.dispatchDate).toISOString().split('T')[0] : null,
//       deliveryDate:       h.deliveryDate        ? new Date(h.deliveryDate).toISOString().split('T')[0] : null,
//       shippingMethod:     h.shippingMethod      || null,
//       transportName:      h.transportName       || null,
//       status:             h.status              || 'NA',
//       lineItems: lineRows.map(l => ({
//         lineNum:         l.lineNum,
//         itemCode:        l.itemCode        || '',
//         description:     l.description     || '',
//         casNo:           l.casNo           || null,
//         category:        l.category        || null,
//         unitPrice:       parseFloat(l.unitPrice)  || 0,
//         qty:             parseFloat(l.qty)         || 0,
//         totalPrice:      parseFloat(l.totalPrice)  || 0,
//         unit:            l.unit            || null,
//         batchNo:         l.batchNo         || null,
//         vendorBatchNo:   l.vendorBatchNo   || null,
//         localCoaFilename: l.localCoaFilename || null,
//         energyCoaUrl:    l.energyCoaUrl    || null,
//         coaSource:       l.coaSource       || 'NONE',
//       })),
//     };

//     return res.status(200).json({ invoice });

//   } catch (error) {
//     console.error('invoices/detail error:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// }

// function formatTime(ts) {
//   if (ts == null) return null;
//   const s = String(ts).padStart(6, '0');
//   return `${s.substring(0, 2)}:${s.substring(2, 4)}`;
// }

// pages/api/densityapp/invoices/detail.js
import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from 'lib/db';
import { setCorsHeaders } from 'lib/cors';

// ✅ Extract just the filename from full UNC path
// e.g. \\172.50.10.9\SAP-Attachments\Attachment\file.pdf → file.pdf
function extractFilename(fullPath) {
  if (!fullPath) return null;
  return fullPath
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .pop() || null;
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

    let decoded;
    try { decoded = verify(authHeader.split(' ')[1], process.env.JWT_SECRET); }
    catch { return res.status(401).json({ error: 'Invalid token' }); }

    const { invoiceNo } = req.query;
    if (!invoiceNo) return res.status(400).json({ error: 'invoiceNo is required' });

    const docNum = parseInt(invoiceNo, 10);
    if (isNaN(docNum)) return res.status(400).json({ error: 'Invalid invoiceNo' });

    // ── Header ──
    const headerQuery = `
      SELECT DISTINCT
        T0.DocNum             AS invoiceNo,
        T0.DocDate            AS invoiceDate,
        T0.CreateTS           AS invoiceTime,
        T4.DocNum             AS soNo,
        T4.DocDate            AS soDate,
        T0.NumAtCard          AS customerRefNo,
        T0.CardName           AS customerName,
        T0.CardCode           AS customerCode,
        T7.Name               AS contactPerson,
        T7.E_MailL            AS contactEmail,
        T5.SlpName            AS salesPerson,
        T5.Email              AS salesPersonEmail,
        T6.PymntGroup         AS paymentTerms,
        T0.DocTotal           AS totalAmount,
        T0.DocCur             AS currency,
        T0.TrackNo            AS trackingNo,
        T0.U_TrackingNoUpdateDT AS trackingUpdatedDate,
        T0.U_DispatchDate     AS dispatchDate,
        T0.U_DeliveryDate     AS deliveryDate,
        T0.U_AirlineName      AS shippingMethod,
        SHP.TrnspName         AS transportName,
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
      LEFT JOIN OCTG T6  ON T0.GroupNum  = T6.GroupNum
      LEFT JOIN INV1 I1  ON T0.DocEntry  = I1.DocEntry
      LEFT JOIN DLN1 D1  ON I1.BaseEntry = D1.DocEntry AND I1.BaseLine = D1.LineNum AND I1.BaseType = 15
      LEFT JOIN RDR1 R1  ON D1.BaseEntry = R1.DocEntry AND D1.BaseLine = R1.LineNum AND D1.BaseType = 17
      LEFT JOIN ORDR T4  ON R1.DocEntry  = T4.DocEntry
      WHERE T0.DocNum = @docNum AND T0.CANCELED = 'N';
    `;

    // ── Line items ──
    const linesQuery = `
      SELECT
        T1.LineNum            AS lineNum,
        T1.ItemCode           AS itemCode,
        T1.Dscription         AS description,
        T1.U_CasNo            AS casNo,
        ITMGRP.ItmsGrpNam     AS category,
        T1.Price              AS unitPrice,
        T1.Quantity           AS qty,
        T1.LineTotal          AS totalPrice,
        T1.UnitMsr            AS unit,
        ISNULL(T15.BatchNum, '')           AS batchNo,
        ISNULL(T15.U_vendorbatchno, '')    AS vendorBatchNo,
        CAST(T15.U_COA AS NVARCHAR(MAX))   AS localCoaFilename,
        CASE
          WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS NVARCHAR(MAX)))) <> ''
            THEN ''
          WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND T1.ItemCode <> ''
            THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' +
                 LEFT(T1.ItemCode, CHARINDEX('-', T1.ItemCode + '-') - 1) + '_' + T15.U_vendorbatchno + '.pdf'
          ELSE ''
        END AS energyCoaUrl,
        CASE
          WHEN T15.U_COA IS NOT NULL AND LTRIM(RTRIM(CAST(T15.U_COA AS NVARCHAR(MAX)))) <> '' THEN 'LOCAL'
          WHEN ISNULL(T15.U_vendorbatchno, '') <> '' THEN 'ENERGY'
          ELSE 'NONE'
        END AS coaSource
      FROM INV1 T1
      LEFT JOIN DLN1 T2  ON T2.ItemCode  = T1.ItemCode
                         AND T2.DocEntry  = T1.BaseEntry
                         AND T1.BaseType = 15
                         AND T1.BaseLine  = T2.LineNum
      LEFT JOIN ODLN T3  ON T3.DocEntry  = T2.DocEntry
      LEFT JOIN IBT1 T4  ON T4.CardCode  = T3.CardCode
                         AND T4.ItemCode  = T2.ItemCode
                         AND T4.BaseNum   = T3.DocNum
                         AND T4.BaseEntry = T3.DocEntry
                         AND T4.BaseType = 15
                         AND T4.BaseLinNum = T2.LineNum
                         AND T4.Direction = 1
      LEFT JOIN OIBT T15 ON T4.ItemCode  = T15.ItemCode AND T4.BatchNum = T15.BatchNum
      LEFT JOIN OITM ITM ON T1.ItemCode  = ITM.ItemCode
      LEFT JOIN OITB ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
      WHERE T1.DocEntry = (SELECT DocEntry FROM OINV WHERE DocNum = @docNum AND CANCELED = 'N')
      ORDER BY T1.LineNum;
    `;

    const params = [{ name: 'docNum', type: sql.Int, value: docNum }];

    const [headerRows, lineRows] = await Promise.all([
      queryDatabase(headerQuery, params),
      queryDatabase(linesQuery, params),
    ]);

    if (!headerRows.length) return res.status(404).json({ error: 'Invoice not found' });

    const h = headerRows[0];
    const invoice = {
      invoiceNo:           h.invoiceNo,
      invoiceDate:         h.invoiceDate         ? new Date(h.invoiceDate).toISOString().split('T')[0] : null,
      invoiceTime:         formatTime(h.invoiceTime),
      soNo:                h.soNo                || null,
      soDate:              h.soDate              ? new Date(h.soDate).toISOString().split('T')[0] : null,
      customerRefNo:       h.customerRefNo        || null,
      customerName:        h.customerName         || null,
      customerCode:        h.customerCode         || null,
      contactPerson:       h.contactPerson        || null,
      contactEmail:        h.contactEmail         || null,
      salesPerson:         h.salesPerson          || null,
      salesPersonEmail:    h.salesPersonEmail     || null,
      paymentTerms:        h.paymentTerms         || null,
      totalAmount:         parseFloat(h.totalAmount) || 0,
      currency:            h.currency             || 'INR',
      trackingNo:          h.trackingNo           || null,
      trackingUpdatedDate: h.trackingUpdatedDate  ? new Date(h.trackingUpdatedDate).toISOString().split('T')[0] : null,
      dispatchDate:        h.dispatchDate         ? new Date(h.dispatchDate).toISOString().split('T')[0] : null,
      deliveryDate:        h.deliveryDate         ? new Date(h.deliveryDate).toISOString().split('T')[0] : null,
      shippingMethod:      h.shippingMethod       || null,
      transportName:       h.transportName        || null,
      status:              h.status               || 'NA',
      lineItems: lineRows.map(l => ({
        lineNum:          l.lineNum,
        itemCode:         l.itemCode         || '',
        description:      l.description      || '',
        casNo:            l.casNo            || null,
        category:         l.category         || null,
        unitPrice:        parseFloat(l.unitPrice)  || 0,
        qty:              parseFloat(l.qty)         || 0,
        totalPrice:       parseFloat(l.totalPrice)  || 0,
        unit:             l.unit             || null,
        batchNo:          l.batchNo          || null,
        vendorBatchNo:    l.vendorBatchNo    || null,
        // ✅ Extract filename only from full UNC path
        localCoaFilename: extractFilename(l.localCoaFilename),
        energyCoaUrl:     l.energyCoaUrl     || null,
        coaSource:        l.coaSource        || 'NONE',
      })),
    };

    return res.status(200).json({ invoice });

  } catch (error) {
    console.error('invoices/detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function formatTime(ts) {
  if (ts == null) return null;
  const s = String(ts).padStart(6, '0');
  return `${s.substring(0, 2)}:${s.substring(2, 4)}`;
}