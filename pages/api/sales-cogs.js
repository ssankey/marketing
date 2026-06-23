
// pages/api/sales-cogs.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../lib/db";
import { getCache, setCache } from "../../lib/redis";

// Helper: parse a query param that may appear multiple times
// e.g. ?slpCode=1&slpCode=2  →  [1, 2]
const getMulti = (query, key) => {
  const val = query[key];
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

export default async function handler(req, res) {
  try {
    const {
      year,
    } = req.query;

    // ── Multi-value params ──────────────────────────────────
    const slpCodes    = getMulti(req.query, 'slpCode');
    const cntctCodes  = getMulti(req.query, 'cntctCode');
    const itmsGrpNams = getMulti(req.query, 'itmsGrpNam');  // category NAME not code
    const itemCodes   = getMulti(req.query, 'itemCode');
    const cardCodes   = getMulti(req.query, 'cardCode');

    // ── Auth ────────────────────────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (e) {
      console.error("Token verification failed:", e);
      return res.status(401).json({ error: "Token verification failed" });
    }

    const isAdmin          = decoded.role === "admin";
    const is3ASenrise      = decoded.role === "3ASenrise";
    const tokenContactCodes = decoded.contactCodes || [];
    const tokenCardCodes    = decoded.cardCodes    || [];
    const filterByCategory  = decoded.filterByCategory || false;
    const category          = decoded.category || "";

    // ── Cache key ───────────────────────────────────────────
    const userIdentifier = isAdmin
      ? "admin"
      : is3ASenrise
      ? `3ASenrise-${category}`
      : tokenContactCodes.length
      ? tokenContactCodes.join("-")
      : tokenCardCodes.join("-");

    const cacheKey = [
      "sales-data",
      userIdentifier,
      year || "all",
      slpCodes.join(",")    || "all",
      cardCodes.join(",")   || "all",
      cntctCodes.join(",")  || "all",
      itmsGrpNams.join(",") || "all",
      itemCodes.join(",")   || "all",
    ].join(":");

    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    // ── WHERE clauses ───────────────────────────────────────
    const whereClauses = ["T0.CANCELED = 'N'"];
    const params = [];

    const EXCLUDED_INVOICE_DOCNUMS = [
      26212562, 26212563, 26212564, 26212565, 26212566, 26212567, 26212574,
      26212201, 26212885, 26212886, 26212890, 26212892, 26212893, 26212894,
      26212898, 26212899,
    ];
    if (EXCLUDED_INVOICE_DOCNUMS.length > 0) {
      whereClauses.push(`T0.DocNum NOT IN (${EXCLUDED_INVOICE_DOCNUMS.join(",")})`);
    }

    // Role-based scoping
    if (!isAdmin) {
      if (is3ASenrise && filterByCategory && category) {
        whereClauses.push(`T6.ItmsGrpNam = @tokenCategory`);
        params.push({ name: "tokenCategory", type: sql.VarChar, value: category });
      } else if (tokenContactCodes.length > 0) {
        whereClauses.push(`T0.SlpCode IN (${tokenContactCodes.map(c => `'${c}'`).join(",")})`);
      } else if (tokenCardCodes.length > 0) {
        whereClauses.push(`T0.CardCode IN (${tokenCardCodes.map(c => `'${c}'`).join(",")})`);
      } else {
        return res.status(403).json({ error: "No access: contactCodes or cardCodes not in token" });
      }
    }

    // Year filter
    if (year) {
      whereClauses.push(`YEAR(T0.DocDate) = @year`);
      params.push({ name: "year", type: sql.Int, value: parseInt(year) });
    }

    // ── Multi-value filter helpers ──
    // Admin-only slpCode filter (sales_person scoped via token above)
    if (isAdmin && slpCodes.length > 0) {
      whereClauses.push(`T0.SlpCode IN (${slpCodes.map(c => `'${c}'`).join(",")})`);
    }

    if (cntctCodes.length > 0) {
      whereClauses.push(`T0.CntctCode IN (${cntctCodes.map(c => `'${c}'`).join(",")})`);
    }

    // Category by NAME (ItmsGrpNam) — multi
    if (itmsGrpNams.length > 0) {
      const escaped = itmsGrpNams.map(n => `'${n.replace(/'/g, "''")}'`).join(",");
      whereClauses.push(`T6.ItmsGrpNam IN (${escaped})`);
    }

    // Product — multi
    if (itemCodes.length > 0) {
      const escaped = itemCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(",");
      whereClauses.push(`T5.ItemCode IN (${escaped})`);
    }

    // Customer — multi
    if (cardCodes.length > 0) {
      const escaped = cardCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(",");
      whereClauses.push(`T0.CardCode IN (${escaped})`);
    }

    // IssReason only for OINV
    whereClauses.push(`T0.[IssReason] <> '4'`);

    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;
    console.log("DEBUG whereSQL:", whereSQL);


    // Order WHERE — same minus IssReason
    const orderWhereClauses = whereClauses.filter(c => !c.includes("IssReason"));
    const orderWhereSQL = orderWhereClauses.length ? `WHERE ${orderWhereClauses.join(" AND ")}` : "";

    // ── Query 1: Sales + COGS + GM% ─────────────────────────
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

    // ── Query 2: Invoice line count ──────────────────────────
    const invoiceCountQuery = `
      SELECT
        DATENAME(MONTH, H.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(H.DocDate)), 2) AS [Month-Year],
        COUNT(*) AS InvoiceCount
      FROM INV1 L
      JOIN OINV H ON L.DocEntry = H.DocEntry
      JOIN OITM I ON L.ItemCode = I.ItemCode
      JOIN OITB B ON I.ItmsGrpCod = B.ItmsGrpCod
      ${whereSQL.replace(/T0/g, "H").replace(/T5/g, "I").replace(/T6/g, "B")}
      GROUP BY
        DATENAME(MONTH, H.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(H.DocDate)), 2),
        YEAR(H.DocDate), MONTH(H.DocDate);
    `;

    // ── Query 3: Order value ─────────────────────────────────
    const hasItemOrCat = itemCodes.length > 0 || itmsGrpNams.length > 0 ||
      (is3ASenrise && filterByCategory && category);

    const orderValueQuery = hasItemOrCat
      ? `
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
      `
      : `
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

    // ── Run in parallel ──────────────────────────────────────
    const [salesRes, invoiceRes, orderRes] = await Promise.all([
      queryDatabase(salesQuery, params),
      queryDatabase(invoiceCountQuery, params),
      queryDatabase(orderValueQuery, params),
    ]);

    // ── Merge ────────────────────────────────────────────────
    const salesMap = {};
    salesRes.forEach(r => {
      salesMap[r["Month-Year"]] = {
        monthYear: r["Month-Year"], year: r.year, monthNumber: r.monthNumber,
        totalSales: parseFloat(r.TotalSales) || 0,
        totalCogs:  parseFloat(r.TotalCOGS)  || 0,
        grossMarginPct: parseFloat(r.GrossMarginPct) || 0,
      };
    });

    const invoiceMap = {};
    invoiceRes.forEach(r => {
      invoiceMap[r["Month-Year"]] = { invoiceCount: parseInt(r.InvoiceCount) || 0 };
    });

    const orderMap = {};
    orderRes.forEach(r => {
      orderMap[r["Month-Year"]] = {
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
      year:           salesMap[key]?.year        ?? orderMap[key]?.year        ?? null,
      monthNumber:    salesMap[key]?.monthNumber  ?? orderMap[key]?.monthNumber ?? null,
      totalSales:     salesMap[key]?.totalSales     || 0,
      totalCogs:      salesMap[key]?.totalCogs      || 0,
      grossMarginPct: salesMap[key]?.grossMarginPct || 0,
      invoiceCount:   invoiceMap[key]?.invoiceCount  || 0,
      orderValue:     orderMap[key]?.orderValue      || 0,
    })).sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber);

    // ── Available years ──────────────────────────────────────
    const yearsCacheKey = "sales-data:available-years";
    let availableYears = await getCache(yearsCacheKey);
    if (!availableYears) {
      const yr = await queryDatabase(`
        SELECT DISTINCT YEAR(DocDate) AS year FROM OINV WHERE CANCELED = 'N' ORDER BY year DESC;
      `);
      availableYears = yr.map(r => r.year);
      await setCache(yearsCacheKey, availableYears, 86400);
    }

    const responseData = { data, availableYears };
    await setCache(cacheKey, responseData, 1800);
    return res.status(200).json(responseData);

  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}