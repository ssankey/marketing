// pages/api/customers/all-delivery-performance.js
// Order → Invoice stage, no-customerId ("all customers") variant — see
// [id]/delivery-performance.js's header comment for the raw-row/
// client-side-bucketing architecture this is part of.
import { queryDatabase } from '../../../lib/db';
import sql from 'mssql';
import { verify } from 'jsonwebtoken';

export default async function handler(req, res) {
  const { salesPerson, category, customer, product, contactPerson } = req.query;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  let decoded;
  try {
    decoded = verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token verification failed' });
  }

  const isAdmin = decoded.role === 'admin';
  const contactCodes = decoded.contactCodes || [];
  const cardCodes = decoded.cardCodes || [];

  const where = ['OINV.DocDate IS NOT NULL'];
  const params = [];

  if (!isAdmin) {
    if (contactCodes.length > 0) {
      where.push(`T0.CntctCode IN (${contactCodes.map((c) => `'${c}'`).join(',')})`);
    } else if (cardCodes.length > 0) {
      where.push(`T0.CardCode IN (${cardCodes.map((c) => `'${c}'`).join(',')})`);
    } else {
      return res.status(403).json({ error: 'No access: cardCodes or contactCodes not provided' });
    }
  }

  if (salesPerson) {
    where.push('T0.SlpCode = @slpCode');
    params.push({ name: 'slpCode', type: sql.Int, value: +salesPerson });
  }
  if (category) {
    where.push('IB.ItmsGrpNam = @grpName');
    params.push({ name: 'grpName', type: sql.NVarChar, value: category });
  }
  if (customer) {
    where.push('T0.CardCode = @cardCode');
    params.push({ name: 'cardCode', type: sql.NVarChar, value: customer });
  }
  if (product) {
    where.push('T1.ItemCode = @itemCode');
    params.push({ name: 'itemCode', type: sql.NVarChar, value: product });
  }
  if (contactPerson) {
    where.push('T0.CntctCode = @cntctCode');
    params.push({ name: 'cntctCode', type: sql.NVarChar, value: contactPerson });
  }

  const sqlText = `
    SELECT
      FORMAT(OINV.DocDate, 'MMM-yyyy') AS Month,
      T0.DocNum AS OrderNo,
      T0.DocDate AS OrderDate,
      OINV.DocNum AS InvoiceNo,
      OINV.DocDate AS InvoiceDate,
      DATEDIFF(DAY, T0.DocDate, OINV.DocDate) AS DayDiff,
      T1.ItemCode AS ItemCode,
      T1.Dscription AS ItemDescription,
      IB.ItmsGrpNam AS Category,
      SP.SlpName AS SalesPerson,
      T0.CardName AS Customer,
      CP.Name AS ContactPerson
    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17
    INNER JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15
    INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C'
    LEFT JOIN OITM T2 ON T1.ItemCode = T2.ItemCode
    LEFT JOIN OITB IB ON T2.ItmsGrpCod = IB.ItmsGrpCod
    LEFT JOIN OSLP SP ON SP.SlpCode = T0.SlpCode
    LEFT JOIN OCPR CP ON CP.CntctCode = T0.CntctCode AND CP.CardCode = T0.CardCode
    WHERE ${where.join(' AND ')}
    ORDER BY OINV.DocDate DESC;
  `;

  try {
    const rows = await queryDatabase(sqlText, params);
    const data = rows.map((r) => ({
      month: r.Month,
      orderNo: r.OrderNo,
      orderDate: r.OrderDate ? r.OrderDate.toISOString() : null,
      invoiceNo: r.InvoiceNo,
      invoiceDate: r.InvoiceDate ? r.InvoiceDate.toISOString() : null,
      dayDiff: r.DayDiff,
      itemCode: r.ItemCode,
      itemDescription: r.ItemDescription,
      category: r.Category,
      salesPerson: r.SalesPerson,
      customer: r.Customer,
      contactPerson: r.ContactPerson,
    }));
    res.status(200).json(data);
  } catch (err) {
    console.error('all-delivery-performance API error:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
