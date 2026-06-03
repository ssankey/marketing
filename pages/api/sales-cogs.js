

// // pages/api/sales-cogs.js
// import { verify } from "jsonwebtoken";
// import sql from "mssql";
// import { queryDatabase } from "../../lib/db";
// import { getCache, setCache } from "../../lib/redis";

// export default async function handler(req, res) {
//   try {
//     const { year, slpCode, itmsGrpCod, itemCode, cntctCode, cardCode } = req.query;
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         error: "Missing or malformed Authorization header",
//         received: authHeader,
//       });
//     }

//     const token = authHeader.split(" ")[1];
//     let decoded;

//     try {
//       decoded = verify(token, process.env.JWT_SECRET);
//     } catch (verifyError) {
//       console.error("Token verification failed:", verifyError);
//       return res.status(401).json({ error: "Token verification failed" });
//     }

//     const isAdmin         = decoded.role === "admin";
//     const is3ASenrise     = decoded.role === "3ASenrise";
//     const contactCodes    = decoded.contactCodes || [];
//     const cardCodes       = decoded.cardCodes || [];
//     const filterByCategory = decoded.filterByCategory || false;
//     const category        = decoded.category || "";

//     const userIdentifier = isAdmin
//       ? "admin"
//       : is3ASenrise
//       ? `3ASenrise-${category}`
//       : contactCodes.length
//       ? contactCodes.join("-")
//       : cardCodes.join("-");

//     const cacheKey = `sales-data:${userIdentifier}:${year || "all"}:${slpCode || "all"}:${cardCode || "all"}:${cntctCode || "all"}:${itmsGrpCod || "all"}:${itemCode || "all"}`;

//     const cachedResult = await getCache(cacheKey);
//     if (cachedResult) {
//       return res.status(200).json(cachedResult);
//     }

//     // ─── WHERE CLAUSES (OINV) ─────────────────────────────────────────────────
//     const whereClauses = ["T0.CANCELED = 'N'"];
//     const params = [];

//     if (!isAdmin) {
//       if (is3ASenrise && filterByCategory && category) {
//         // 3ASenrise: filter by category
//         whereClauses.push(`T6.ItmsGrpNam = @category`);
//         params.push({ name: "category", type: sql.VarChar, value: category });
//       } else if (contactCodes.length > 0) {
//         whereClauses.push(`T0.SlpCode IN (${contactCodes.map((c) => `'${c}'`).join(",")})`);
//       } else if (cardCodes.length > 0) {
//         whereClauses.push(`T0.CardCode IN (${cardCodes.map((c) => `'${c}'`).join(",")})`);
//       } else {
//         return res.status(403).json({ error: "No access: cardCodes or contactCodes not provided" });
//       }
//     }

//     if (year) {
//       whereClauses.push(`YEAR(T0.DocDate) = @year`);
//       params.push({ name: "year", type: sql.Int, value: parseInt(year) });
//     }
//     if (slpCode) {
//       whereClauses.push(`T0.SlpCode = @slpCode`);
//       params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
//     }
//     if (cntctCode) {
//       whereClauses.push(`T0.CntctCode = @cntctCode`);
//       params.push({ name: "cntctCode", type: sql.Int, value: parseInt(cntctCode) });
//     }
//     if (itmsGrpCod) {
//       whereClauses.push(`T6.ItmsGrpNam = @itmsGrpCod`);
//       params.push({ name: "itmsGrpCod", type: sql.VarChar, value: itmsGrpCod });
//     }
//     if (cardCode) {
//       whereClauses.push(`T0.CardCode = @cardCode`);
//       params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
//     }
//     if (itemCode) {
//       whereClauses.push(`T5.ItemCode = @itemCode`);
//       params.push({ name: "itemCode", type: sql.VarChar, value: itemCode });
//     }

//     // IssReason only for OINV (not ORDR)
//     whereClauses.push(`T0.[IssReason] <> '4'`);

//     const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

//     // ─── WHERE CLAUSES (ORDR) — same minus IssReason ──────────────────────────
//     const orderWhereClauses = whereClauses.filter((c) => !c.includes("T0.[IssReason]"));
//     const orderWhereSQL = orderWhereClauses.length ? `WHERE ${orderWhereClauses.join(" AND ")}` : "";

//     // ─── QUERY 1: Sales + COGS + GM% (OINV) ──────────────────────────────────
//     const salesQuery = `
//       SELECT 
//         DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
//         YEAR(T0.DocDate)  AS year,
//         MONTH(T0.DocDate) AS monthNumber,
//         SUM(T1.LineTotal) AS TotalSales,
//         SUM(T1.GrossBuyPr * T1.Quantity) AS TotalCOGS,
//         CASE 
//           WHEN SUM(T1.LineTotal) = 0 THEN 0
//           ELSE ROUND(
//             ((SUM(T1.LineTotal) - SUM(T1.GrossBuyPr * T1.Quantity)) * 100.0) / SUM(T1.LineTotal),
//             2
//           )
//         END AS GrossMarginPct
//       FROM OINV T0
//       JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//       LEFT JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
//       LEFT JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
//       ${whereSQL}
//       GROUP BY
//         DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2),
//         YEAR(T0.DocDate), MONTH(T0.DocDate)
//       ORDER BY YEAR(T0.DocDate), MONTH(T0.DocDate);
//     `;

//     // ─── QUERY 2: Invoice (line) count (OINV) ────────────────────────────────
//     const invoiceCountQuery = `
//       SELECT 
//         DATENAME(MONTH, H.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(H.DocDate)), 2) AS [Month-Year],
//         COUNT(*) AS InvoiceCount
//       FROM INV1 L
//       JOIN OINV H ON L.DocEntry = H.DocEntry
//       JOIN OITM I ON L.ItemCode = I.ItemCode
//       JOIN OITB B ON I.ItmsGrpCod = B.ItmsGrpCod
//       ${whereSQL.replace(/T0/g, "H").replace(/T5/g, "I").replace(/T6/g, "B")}
//       GROUP BY
//         DATENAME(MONTH, H.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(H.DocDate)), 2),
//         YEAR(H.DocDate), MONTH(H.DocDate);
//     `;

//     // ─── QUERY 3: Order value (ORDR) ─────────────────────────────────────────
//     const hasItemOrCategoryFilter =
//       itemCode || itmsGrpCod || (is3ASenrise && filterByCategory && category);

//     const orderValueQuery = hasItemOrCategoryFilter
//       ? `
//         -- Filtered by category/item: sum RDR1.LineTotal
//         SELECT 
//           DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
//           YEAR(T0.DocDate)  AS year,
//           MONTH(T0.DocDate) AS monthNumber,
//           SUM(T1.LineTotal) AS TotalOrderValue
//         FROM ORDR T0
//         JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
//         JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
//         JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
//         ${orderWhereSQL}
//         GROUP BY
//           DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2),
//           YEAR(T0.DocDate), MONTH(T0.DocDate)
//         ORDER BY YEAR(T0.DocDate), MONTH(T0.DocDate);
//       `
//       : `
//         -- No category/item filter: use DocTotal - VatSum (distinct per DocEntry)
//         SELECT 
//           [Month-Year], year, monthNumber,
//           SUM(TotalOrderValue) AS TotalOrderValue
//         FROM (
//           SELECT DISTINCT
//             DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)), 2) AS [Month-Year],
//             YEAR(T0.DocDate)  AS year,
//             MONTH(T0.DocDate) AS monthNumber,
//             T0.DocEntry,
//             T0.DocTotal - T0.VatSum AS TotalOrderValue
//           FROM ORDR T0
//           ${orderWhereSQL}
//         ) AS FilteredOrders
//         GROUP BY [Month-Year], year, monthNumber
//         ORDER BY year, monthNumber;
//       `;

//     // ─── Run all queries in parallel ──────────────────────────────────────────
//     const [salesResults, invoiceResults, orderValueResults] = await Promise.all([
//       queryDatabase(salesQuery, params),
//       queryDatabase(invoiceCountQuery, params),
//       queryDatabase(orderValueQuery, params),
//     ]);

//     // ─── Merge into a unified month map ───────────────────────────────────────
//     const salesMap = {};
//     salesResults.forEach((row) => {
//       salesMap[row["Month-Year"]] = {
//         monthYear:      row["Month-Year"],
//         year:           row.year,
//         monthNumber:    row.monthNumber,
//         totalSales:     parseFloat(row.TotalSales)      || 0,
//         totalCogs:      parseFloat(row.TotalCOGS)       || 0,
//         grossMarginPct: parseFloat(row.GrossMarginPct)  || 0,
//       };
//     });

//     const invoiceMap = {};
//     invoiceResults.forEach((row) => {
//       invoiceMap[row["Month-Year"]] = {
//         monthYear:    row["Month-Year"],
//         invoiceCount: parseInt(row.InvoiceCount) || 0,
//       };
//     });

//     const orderValueMap = {};
//     orderValueResults.forEach((row) => {
//       orderValueMap[row["Month-Year"]] = {
//         monthYear:  row["Month-Year"],
//         year:       row.year,
//         monthNumber: row.monthNumber,
//         orderValue: parseFloat(row.TotalOrderValue) || 0,
//       };
//     });

//     // Union of all month keys across the three result sets
//     const allMonthKeys = new Set([
//       ...Object.keys(salesMap),
//       ...Object.keys(invoiceMap),
//       ...Object.keys(orderValueMap),
//     ]);

//     const data = Array.from(allMonthKeys)
//       .map((key) => {
//         const s = salesMap[key]      || {};
//         const i = invoiceMap[key]    || {};
//         const o = orderValueMap[key] || {};

//         return {
//           monthYear:      key,
//           year:           s.year       ?? o.year       ?? null,
//           monthNumber:    s.monthNumber ?? o.monthNumber ?? null,
//           totalSales:     s.totalSales     || 0,
//           totalCogs:      s.totalCogs      || 0,
//           grossMarginPct: s.grossMarginPct || 0,
//           invoiceCount:   i.invoiceCount   || 0,
//           orderValue:     o.orderValue     || 0,
//         };
//       })
//       .sort((a, b) =>
//         a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber
//       );

//     // ─── Available calendar years ─────────────────────────────────────────────
//     // The API returns ALL calendar years that have invoice data.
//     // The frontend's buildFinancialYears() adds the current FY on top,
//     // so a brand-new FY with zero invoices will still appear in the dropdown.
//     const yearsCacheKey = "sales-data:available-years";
//     let availableYears = await getCache(yearsCacheKey);

//     if (!availableYears) {
//       const yearsQuery = `
//         SELECT DISTINCT YEAR(DocDate) AS year
//         FROM OINV
//         WHERE CANCELED = 'N'
//         ORDER BY year DESC;
//       `;
//       const yearsResult = await queryDatabase(yearsQuery);
//       availableYears = yearsResult.map((row) => row.year);
//       await setCache(yearsCacheKey, availableYears, 86400); // cache 1 day
//     }

//     const responseData = { data, availableYears };
//     await setCache(cacheKey, responseData, 1800); // cache 30 mins

//     return res.status(200).json(responseData);
//   } catch (error) {
//     console.error("API handler error:", error);
//     return res.status(500).json({
//       error: "Internal server error",
//       details: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// }
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