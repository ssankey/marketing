import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from 'lib/db';
import { setCorsHeaders } from 'lib/cors';

const getMulti = (query, key) => {
  const val = query[key];
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

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
    const slpCodes = decoded.contactCodes || []; // user's own slpcode from token

    // Non-admin with no slpcode → no data
    if (!isAdmin && slpCodes.length === 0) {
      return res.status(200).json({ data: [], availableYears: [] });
    }

    // ── Query filters ──
    const itmsGrpNams = getMulti(req.query, 'itmsGrpNam');
    const itemCodes   = getMulti(req.query, 'itemCode');
    const cardCodes   = getMulti(req.query, 'cardCode');
    const adminSlpCodes = isAdmin ? getMulti(req.query, 'slpCode') : []; // only admin can filter by slpCode

     const EXCLUDED_INVOICE_DOCNUMS = [
      26212562, 26212563, 26212564, 26212565, 26212566, 26212567, 26212574,
      26212201, 26212885, 26212886, 26212890, 26212892, 26212893, 26212894,
      26212898, 26212899,
    ];

    // ── WHERE clauses ──
     const whereClauses = [
      "T0.CANCELED = 'N'",
      "T0.[IssReason] <> '4'",
      `T0.DocNum NOT IN (${EXCLUDED_INVOICE_DOCNUMS.join(',')})`,
    ];
    const params = [];

    // Role-based scoping
    if (!isAdmin) {
      whereClauses.push(`T0.SlpCode IN (${slpCodes.map(c => `'${c}'`).join(',')})`);
    } else if (adminSlpCodes.length > 0) {
      whereClauses.push(`T0.SlpCode IN (${adminSlpCodes.map(c => `'${c}'`).join(',')})`);
    }

    if (itmsGrpNams.length > 0) {
      const escaped = itmsGrpNams.map(n => `'${n.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`T6.ItmsGrpNam IN (${escaped})`);
    }

    if (itemCodes.length > 0) {
      const escaped = itemCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`T5.ItemCode IN (${escaped})`);
    }

    if (cardCodes.length > 0) {
      const escaped = cardCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`T0.CardCode IN (${escaped})`);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;
    const orderWhereClauses = whereClauses.filter(c => !c.includes('IssReason'));
    const orderWhereSQL = `WHERE ${orderWhereClauses.join(' AND ')}`;

    // ── Query 1: Sales + COGS + GM% ──
    const salesQuery = `
      SELECT
        DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
        YEAR(T0.DocDate)  AS year,
        MONTH(T0.DocDate) AS monthNumber,
        SUM(T1.LineTotal) AS TotalSales,
        SUM(T1.GrossBuyPr * T1.Quantity) AS TotalCOGS,
        CASE
          WHEN SUM(T1.LineTotal) = 0 THEN 0
          ELSE ROUND(((SUM(T1.LineTotal) - SUM(T1.GrossBuyPr * T1.Quantity)) * 100.0) / SUM(T1.LineTotal), 2)
        END AS GrossMarginPct
      FROM OINV T0
      JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      LEFT JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      ${whereSQL}
      GROUP BY
        DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2),
        YEAR(T0.DocDate), MONTH(T0.DocDate)
      ORDER BY YEAR(T0.DocDate), MONTH(T0.DocDate);
    `;

    // ── Query 2: Invoice line count ──
    const invoiceCountQuery = `
      SELECT
        DATENAME(MONTH, H.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(H.DocDate)), 2) AS [Month-Year],
        COUNT(*) AS InvoiceCount
      FROM INV1 L
      JOIN OINV H ON L.DocEntry = H.DocEntry
      JOIN OITM I ON L.ItemCode = I.ItemCode
      JOIN OITB B ON I.ItmsGrpCod = B.ItmsGrpCod
      ${whereSQL.replace(/T0/g, 'H').replace(/T5/g, 'I').replace(/T6/g, 'B')}
      GROUP BY
        DATENAME(MONTH, H.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(H.DocDate)), 2),
        YEAR(H.DocDate), MONTH(H.DocDate);
    `;

    // ── Query 3: Order value ──
    const hasItemOrCat = itemCodes.length > 0 || itmsGrpNams.length > 0;
    const orderValueQuery = hasItemOrCat ? `
      SELECT
        DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
        YEAR(T0.DocDate)  AS year,
        MONTH(T0.DocDate) AS monthNumber,
        SUM(T1.LineTotal) AS TotalOrderValue
      FROM ORDR T0
      JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      ${orderWhereSQL}
      GROUP BY
        DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2),
        YEAR(T0.DocDate), MONTH(T0.DocDate)
      ORDER BY YEAR(T0.DocDate), MONTH(T0.DocDate);
    ` : `
      SELECT [Month-Year], year, monthNumber, SUM(TotalOrderValue) AS TotalOrderValue
      FROM (
        SELECT DISTINCT
          DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
          YEAR(T0.DocDate)  AS year,
          MONTH(T0.DocDate) AS monthNumber,
          T0.DocEntry,
          T0.DocTotal - T0.VatSum AS TotalOrderValue
        FROM ORDR T0
        ${orderWhereSQL}
      ) AS F
      GROUP BY [Month-Year], year, monthNumber
      ORDER BY year, monthNumber;
    `;

    // ── Query 4: Available years ──
    const yearsQuery = `
      SELECT DISTINCT YEAR(DocDate) AS year 
      FROM OINV WHERE CANCELED = 'N' 
      ORDER BY year DESC;
    `;

    // ── Run all in parallel ──
    const [salesRes, invoiceRes, orderRes, yearsRes] = await Promise.all([
      queryDatabase(salesQuery, params),
      queryDatabase(invoiceCountQuery, params),
      queryDatabase(orderValueQuery, params),
      queryDatabase(yearsQuery, []),
    ]);

    // ── Merge ──
    const salesMap = {};
    salesRes.forEach(r => {
      salesMap[r['Month-Year']] = {
        monthYear: r['Month-Year'], year: r.year, monthNumber: r.monthNumber,
        totalSales:     parseFloat(r.TotalSales)      || 0,
        totalCogs:      parseFloat(r.TotalCOGS)       || 0,
        grossMarginPct: parseFloat(r.GrossMarginPct)  || 0,
      };
    });

    const invoiceMap = {};
    invoiceRes.forEach(r => {
      invoiceMap[r['Month-Year']] = { invoiceCount: parseInt(r.InvoiceCount) || 0 };
    });

    const orderMap = {};
    orderRes.forEach(r => {
      orderMap[r['Month-Year']] = {
        year: r.year, monthNumber: r.monthNumber,
        orderValue: parseFloat(r.TotalOrderValue) || 0,
      };
    });

    const allKeys = new Set([
      ...Object.keys(salesMap),
      ...Object.keys(invoiceMap),
      ...Object.keys(orderMap),
    ]);

    const data = Array.from(allKeys).map(key => ({
      monthYear:      key,
      year:           salesMap[key]?.year           ?? orderMap[key]?.year        ?? null,
      monthNumber:    salesMap[key]?.monthNumber     ?? orderMap[key]?.monthNumber ?? null,
      totalSales:     salesMap[key]?.totalSales      || 0,
      totalCogs:      salesMap[key]?.totalCogs       || 0,
      grossMarginPct: salesMap[key]?.grossMarginPct  || 0,
      invoiceCount:   invoiceMap[key]?.invoiceCount  || 0,
      orderValue:     orderMap[key]?.orderValue      || 0,
    })).sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber);

    const availableYears = yearsRes.map(r => r.year);

    return res.status(200).json({ data, availableYears });

  } catch (error) {
    console.error('sales-chart error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}