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

    // ── Query filters ── (mirrors sales-cogs.js's filter set exactly, so the
    // same query params produce identical totals on web and app)
    const { year } = req.query;
    const cntctCodes  = getMulti(req.query, 'cntctCode');
    const itmsGrpNams = getMulti(req.query, 'itmsGrpNam');
    const itemCodes   = getMulti(req.query, 'itemCode');
    const cardCodes   = getMulti(req.query, 'cardCode');
    const adminSlpCodes = isAdmin ? getMulti(req.query, 'slpCode') : []; // only admin can filter by slpCode

     // Disabled — was hardcoding specific DocNums out of the sales chart.
     // const EXCLUDED_INVOICE_DOCNUMS = [
     //  26212562, 26212563, 26212564, 26212565, 26212566, 26212567, 26212574,
     //  26212201, 26212885, 26212886, 26212890, 26212892, 26212893, 26212894,
     //  26212898, 26212899,
     // ];

    // ── WHERE clauses ──
    // Base filters shared between the invoice branch (OINV/INV1) and the
    // credit note branch (ORIN/RIN1) netted together in salesQuery below.
    const baseWhereClauses = ["T0.CANCELED <> 'Y'", "T0.CANCELED <> 'C'"];
    const params = [];

    // Role-based scoping
    if (!isAdmin) {
      baseWhereClauses.push(`T0.SlpCode IN (${slpCodes.map(c => `'${c}'`).join(',')})`);
    } else if (adminSlpCodes.length > 0) {
      baseWhereClauses.push(`T0.SlpCode IN (${adminSlpCodes.map(c => `'${c}'`).join(',')})`);
    }

    // Year filter — same as sales-cogs.js's ?year= param
    if (year) {
      baseWhereClauses.push(`YEAR(T0.DocDate) = @year`);
      params.push({ name: 'year', type: sql.Int, value: parseInt(year) });
    }

    if (cntctCodes.length > 0) {
      baseWhereClauses.push(`T0.CntctCode IN (${cntctCodes.map(c => `'${c}'`).join(',')})`);
    }

    if (itmsGrpNams.length > 0) {
      const escaped = itmsGrpNams.map(n => `'${n.replace(/'/g, "''")}'`).join(',');
      baseWhereClauses.push(`T6.ItmsGrpNam IN (${escaped})`);
    }

    if (itemCodes.length > 0) {
      const escaped = itemCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(',');
      baseWhereClauses.push(`T5.ItemCode IN (${escaped})`);
    }

    if (cardCodes.length > 0) {
      const escaped = cardCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(',');
      baseWhereClauses.push(`T0.CardCode IN (${escaped})`);
    }

    // ── Invoice WHERE (OINV/INV1) — base filters (invoice-only exclusions disabled) ──
    const whereClauses = [
      ...baseWhereClauses,
      // Disabled — used to hide a hardcoded list of DocNums (EXCLUDED_INVOICE_DOCNUMS).
      // `T0.DocNum NOT IN (${EXCLUDED_INVOICE_DOCNUMS.join(',')})`,
    ];
    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    // ── Credit note WHERE (ORIN/RIN1) — same base filters. ──
    const creditNoteWhereClauses = [...baseWhereClauses];
    const creditNoteWhereSQL = `WHERE ${creditNoteWhereClauses.join(' AND ')}`;

    const orderWhereClauses = [...whereClauses];
    const orderWhereSQL = `WHERE ${orderWhereClauses.join(' AND ')}`;

    // ── Query 1: Sales + COGS + GM% (invoices net of credit notes) ──
    const salesQuery = `
      SELECT [Month-Year], year, monthNumber,
        SUM(LineTotalAmt) AS TotalSales,
        SUM(CogsAmt) AS TotalCOGS,
        CASE
          WHEN SUM(LineTotalAmt) = 0 THEN 0
          ELSE ROUND(((SUM(LineTotalAmt) - SUM(CogsAmt)) * 100.0) / SUM(LineTotalAmt), 2)
        END AS GrossMarginPct
      FROM (
        SELECT
          DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
          YEAR(T0.DocDate)  AS year,
          MONTH(T0.DocDate) AS monthNumber,
          T1.LineTotal AS LineTotalAmt,
          -- U_ItemCost is a manual correction of GrossBuyPr — use it when it
          -- actually holds a usable non-zero value, else fall back to
          -- GrossBuyPr. Same rule as sales-cogs.js.
          (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0
                THEN IC.ParsedItemCost
                ELSE T1.GrossBuyPr END) * T1.Quantity AS CogsAmt
        FROM OINV T0
        JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        LEFT JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
        LEFT JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(T1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        ${whereSQL}

        UNION ALL

        SELECT
          DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
          YEAR(T0.DocDate)  AS year,
          MONTH(T0.DocDate) AS monthNumber,
          -T1.LineTotal AS LineTotalAmt,
          -- Credit notes net against Sales only, not COGS — they don't
          -- represent goods returned to inventory in this workflow. Same
          -- rule as sales-cogs.js — keep both in sync.
          0 AS CogsAmt
        FROM ORIN T0
        JOIN RIN1 T1 ON T0.DocEntry = T1.DocEntry
        LEFT JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
        LEFT JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
        ${creditNoteWhereSQL}
      ) AS Combined
      GROUP BY [Month-Year], year, monthNumber
      ORDER BY year, monthNumber;
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
      FROM OINV WHERE CANCELED <> 'Y' AND CANCELED <> 'C'
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