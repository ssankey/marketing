// pages/api/customers/all-invoice-to-dispatch.js
// Invoice → Dispatch stage, no-customerId ("all customers") variant — see
// [id]/invoice-to-dispatch.js's header comment.
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

  const where = [`OINV.CANCELED <> 'Y' AND OINV.CANCELED <> 'C'`, `OINV.U_DispatchDate IS NOT NULL`];
  const params = [];

  if (!isAdmin) {
    if (contactCodes.length > 0) {
      where.push(`OINV.CntctCode IN (${contactCodes.map((c) => `'${c}'`).join(',')})`);
    } else if (cardCodes.length > 0) {
      where.push(`OINV.CardCode IN (${cardCodes.map((c) => `'${c}'`).join(',')})`);
    } else {
      return res.status(403).json({ error: 'No access: cardCodes or contactCodes not provided' });
    }
  }

  if (salesPerson) {
    where.push('OINV.SlpCode = @slpCode');
    params.push({ name: 'slpCode', type: sql.Int, value: +salesPerson });
  }
  if (category) {
    where.push('IB.ItmsGrpNam = @grpName');
    params.push({ name: 'grpName', type: sql.NVarChar, value: category });
  }
  if (customer) {
    where.push('OINV.CardCode = @cardCode');
    params.push({ name: 'cardCode', type: sql.NVarChar, value: customer });
  }
  if (product) {
    where.push('INV1.ItemCode = @itemCode');
    params.push({ name: 'itemCode', type: sql.NVarChar, value: product });
  }
  if (contactPerson) {
    where.push('OINV.CntctCode = @cntctCode');
    params.push({ name: 'cntctCode', type: sql.NVarChar, value: contactPerson });
  }

  const sqlText = `
    SELECT
      FORMAT(OINV.U_DispatchDate, 'MMM-yyyy') AS Month,
      OINV.DocNum AS InvoiceNo,
      OINV.DocDate AS InvoiceDate,
      OINV.U_DispatchDate AS DispatchDate,
      DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) AS DayDiff,
      INV1.ItemCode AS ItemCode,
      INV1.Dscription AS ItemDescription,
      IB.ItmsGrpNam AS Category,
      SP.SlpName AS SalesPerson,
      OINV.CardName AS Customer,
      CP.Name AS ContactPerson
    FROM OINV
    INNER JOIN INV1 ON INV1.DocEntry = OINV.DocEntry
    LEFT JOIN OITM T2 ON INV1.ItemCode = T2.ItemCode
    LEFT JOIN OITB IB ON T2.ItmsGrpCod = IB.ItmsGrpCod
    LEFT JOIN OSLP SP ON SP.SlpCode = OINV.SlpCode
    LEFT JOIN OCPR CP ON CP.CntctCode = OINV.CntctCode AND CP.CardCode = OINV.CardCode
    WHERE ${where.join(' AND ')}
    ORDER BY OINV.U_DispatchDate DESC;
  `;

  try {
    const rows = await queryDatabase(sqlText, params);
    const data = rows.map((r) => ({
      month: r.Month,
      invoiceNo: r.InvoiceNo,
      invoiceDate: r.InvoiceDate ? r.InvoiceDate.toISOString() : null,
      dispatchDate: r.DispatchDate ? r.DispatchDate.toISOString() : null,
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
    console.error('all-invoice-to-dispatch API error:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
