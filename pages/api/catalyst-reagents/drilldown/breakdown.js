// pages/api/catalyst-reagents/drilldown/breakdown.js
// Generic replacement for drilldown/category.js + drilldown/customers.js —
// the drill-down modal (and the inline "current period" breakdown table)
// let the user pick an arbitrary ordered sequence of up to 4 dimensions
// (Category / CAS No. / CAT No. / Customer), so every level needs the SAME
// shape of query: group by one chosen dimension, filtered by whichever
// dimension=value pairs were already picked at shallower levels. There's no
// structurally special "leaf" level — whichever dimension ends up last in
// the sequence is just another grouped query, same as any other level.
//
// Scoped by an explicit startDate/endDate range rather than year+monthNumber
// — a single clicked month resolves to that month's first/last day before
// calling this, and the inline breakdown table passes whatever range its own
// date picker has (FY, or the default current-month custom range) — so both
// callers share one date-range contract instead of two different ones.

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../../lib/db";

const getMulti = (query, key) => {
  const val = query[key];
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

// groupBy: SQL GROUP BY columns for a flat (non-subquery) query.
// key/label: SELECT expressions for this dimension.
// filter: the same underlying expression, used when a shallower level has
// already picked a value for this dimension (kept identical to key/label so
// the "N/A" CAS bucket filters back to itself consistently).
const DIMENSIONS = {
  category: {
    groupBy: ["T6.ItmsGrpNam"],
    key: "T6.ItmsGrpNam",
    label: "T6.ItmsGrpNam",
    filter: "T6.ItmsGrpNam",
  },
  cas: {
    groupBy: ["ISNULL(NULLIF(LTRIM(RTRIM(T5.U_CasNo)), ''), 'N/A')"],
    key: "ISNULL(NULLIF(LTRIM(RTRIM(T5.U_CasNo)), ''), 'N/A')",
    label: "ISNULL(NULLIF(LTRIM(RTRIM(T5.U_CasNo)), ''), 'N/A')",
    filter: "ISNULL(NULLIF(LTRIM(RTRIM(T5.U_CasNo)), ''), 'N/A')",
  },
  item: {
    groupBy: ["T5.ItemCode", "T5.ItemName"],
    key: "T5.ItemCode",
    label: "T5.ItemCode + ' - ' + T5.ItemName",
    filter: "T5.ItemCode",
  },
  customer: {
    groupBy: ["T0.CardCode", "T0.CardName"],
    key: "T0.CardCode",
    label: "T0.CardName",
    filter: "T0.CardCode",
  },
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }
  try {
    verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch (e) {
    console.error("Token verification failed:", e);
    return res.status(401).json({ error: "Token verification failed" });
  }

  try {
    const itmsGrpNams = getMulti(req.query, "itmsGrpNam");
    const { startDate, endDate, groupBy } = req.query;

    if (itmsGrpNams.length === 0) {
      return res.status(400).json({ error: "At least one itmsGrpNam is required" });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }
    const dim = DIMENSIONS[groupBy];
    if (!dim) {
      return res.status(400).json({ error: "groupBy must be one of: category, cas, item, customer" });
    }

    // Already-selected dimension=value pairs from shallower levels, e.g.
    // ?filter_category=Catalyst&filter_cas=50-00-0
    const filterDims = Object.keys(DIMENSIONS).filter((d) => req.query[`filter_${d}`] !== undefined);

    const catParams = itmsGrpNams.map((_, i) => `@cat${i}`).join(",");
    const params = [
      { name: "startDate", type: sql.Date, value: startDate },
      { name: "endDate", type: sql.Date, value: endDate },
      ...itmsGrpNams.map((v, i) => ({ name: `cat${i}`, type: sql.NVarChar, value: v })),
    ];
    filterDims.forEach((d) => {
      params.push({ name: `filter_${d}`, type: sql.NVarChar, value: String(req.query[`filter_${d}`]) });
    });

    const filterClauses = filterDims.map((d) => `AND ${DIMENSIONS[d].filter} = @filter_${d}`).join("\n      ");

    const baseWhere = `
      T0.CANCELED <> 'Y' AND T0.CANCELED <> 'C'
      AND T0.DocDate >= @startDate AND T0.DocDate < DATEADD(day, 1, @endDate)
      AND T6.ItmsGrpNam IN (${catParams})
      ${filterClauses}
    `;

    const groupByCols = dim.groupBy.join(", ");

    const salesQuery = `
      SELECT [Key], Label,
        SUM(LineTotalAmt) AS Sales,
        SUM(CogsAmt) AS Cogs,
        CASE WHEN SUM(LineTotalAmt) = 0 THEN 0
             ELSE ROUND(((SUM(LineTotalAmt) - SUM(CogsAmt)) * 100.0) / SUM(LineTotalAmt), 2)
        END AS GrossMarginPct,
        SUM(Lines) AS LineItems
      FROM (
        SELECT
          ${dim.key} AS [Key], ${dim.label} AS Label,
          T1.LineTotal AS LineTotalAmt,
          (CASE WHEN IC.ParsedItemCost IS NOT NULL AND IC.ParsedItemCost <> 0
                THEN IC.ParsedItemCost ELSE T1.GrossBuyPr END) * T1.Quantity AS CogsAmt,
          1 AS Lines
        FROM OINV T0
        JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
        JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
        CROSS APPLY (SELECT TRY_CAST(NULLIF(LTRIM(RTRIM(T1.U_ItemCost)), '') AS FLOAT) AS ParsedItemCost) IC
        WHERE ${baseWhere}

        UNION ALL

        SELECT
          ${dim.key} AS [Key], ${dim.label} AS Label,
          -T1.LineTotal AS LineTotalAmt,
          0 AS CogsAmt,
          0 AS Lines
        FROM ORIN T0
        JOIN RIN1 T1 ON T0.DocEntry = T1.DocEntry
        JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
        JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
        WHERE ${baseWhere}
      ) AS Combined
      GROUP BY [Key], Label
    `;

    const orderValueQuery = `
      SELECT ${dim.key} AS [Key], SUM(T1.LineTotal) AS OrderValue
      FROM ORDR T0
      JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
      JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      WHERE ${baseWhere}
      GROUP BY ${groupByCols}
    `;

    const [salesRes, orderRes] = await Promise.all([
      queryDatabase(salesQuery, params),
      queryDatabase(orderValueQuery, params),
    ]);

    const orderMap = {};
    orderRes.forEach((r) => { orderMap[r.Key] = parseFloat(r.OrderValue) || 0; });

    const data = salesRes
      .map((r) => ({
        key: r.Key,
        label: r.Label,
        sales: parseFloat(r.Sales) || 0,
        cogs: parseFloat(r.Cogs) || 0,
        grossMarginPct: parseFloat(r.GrossMarginPct) || 0,
        lineItems: parseInt(r.LineItems) || 0,
        orderValue: orderMap[r.Key] || 0,
      }))
      .sort((a, b) => b.sales - a.sales);

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Catalyst-reagents drilldown/breakdown error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
