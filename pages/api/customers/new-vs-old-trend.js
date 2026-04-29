// pages/api/customers/new-vs-old-trend.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      mode = "fy",
      fy,
      month,
      year,
      slpCode,
      itmsGrpCod,
      cardCode,
      region,
      state,
    } = req.query;

    // ── Date range ────────────────────────────────────────────────────────────
    let startDate, endDate;
    if (mode === "daily") {
      const m = parseInt(month), y = parseInt(year);
      startDate = `${y}-${String(m).padStart(2,"0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      endDate = `${y}-${String(m).padStart(2,"0")}-${lastDay}`;
    } else {
      const [fyStart, fyEndShort] = fy.split("-");
      const fyStartYear = parseInt(fyStart);
      const fyEndYear   = fyEndShort.length === 2 ? 2000 + parseInt(fyEndShort) : parseInt(fyEndShort);
      startDate = `${fyStartYear}-04-01`;
      endDate   = `${fyEndYear}-03-31`;
    }

    // Wrap dates for safe SQL Server casting (avoids locale-dependent conversion errors)
    const SD = `CONVERT(DATE,'${startDate}',23)`;
    const ED = `CONVERT(DATE,'${endDate}',23)`;

    // ── Optional filter clauses ───────────────────────────────────────────────
    const extraWhere  = [];   // for ORDR header-level filters
    const params      = [];

    if (slpCode) {
      extraWhere.push(`T0.SlpCode = @slpCode`);
      params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
    }
    if (cardCode) {
      extraWhere.push(`T0.CardCode = @cardCode`);
      params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
    }

    // Category filter: must be applied at LINE level (join through RDR1/INV1 → OITM → OITB)
    // This matches the pattern in sales-cogs.js which joins T5/T6 for item/category filtering.
    // Without this, header-level DocTotal includes ALL lines regardless of category.
    const hasCategoryFilter = !!itmsGrpCod;
    const categoryJoinORDR = hasCategoryFilter
      ? `INNER JOIN RDR1 RL ON T0.DocEntry = RL.DocEntry
         INNER JOIN OITM IM ON RL.ItemCode  = IM.ItemCode
         INNER JOIN OITB IB ON IM.ItmsGrpCod = IB.ItmsGrpCod`
      : "";
    const categoryJoinOINV = hasCategoryFilter
      ? `INNER JOIN INV1 IL ON T0.DocEntry = IL.DocEntry
         INNER JOIN OITM IM ON IL.ItemCode  = IM.ItemCode
         INNER JOIN OITB IB ON IM.ItmsGrpCod = IB.ItmsGrpCod`
      : "";
    if (hasCategoryFilter) {
      extraWhere.push(`IB.ItmsGrpNam = @itmsGrpCod`);
      params.push({ name: "itmsGrpCod", type: sql.VarChar, value: itmsGrpCod });
    }

    // Region / state geo filter
    const regionStateMapping = {
      Overseas: `ISNULL(C1.Country,'') <> 'IN'`,
      Central:  `C1.State IN ('AP','TE')`,
      South:    `C1.State IN ('KL','KT','TN','PC')`,
      "West 1": `C1.State IN ('MH','GO','DN')`,
      "West 2": `C1.State = 'GJ'`,
      North:    `C1.State IN ('DL','HR','HP','PU','RJ','UP','UT','MP','CH')`,
      East:     `C1.State IN ('WB','JH','AS','ME')`,
    };
    const stateCodeMapping = {
      "Telangana":"TE","Maharashtra":"MH","Tamil Nadu":"TN","Uttar Pradesh":"UP",
      "Gujarat":"GJ","Karnataka":"KT","Madhya Pradesh":"MP","West Bengal":"WB",
      "Delhi":"DL","Goa":"GO","Andhra Pradesh":"AP","Punjab":"PU","Haryana":"HR",
      "Rajasthan":"RJ","Jharkhand":"JH","Kerala":"KL","Uttarakhand":"UT",
      "Assam":"AS","Himachal Pradesh":"HP","Chandigarh":"CH","Puducherry":"PC",
    };

    const geoJoin = (region || state)
      ? `LEFT JOIN OCRD GC ON T0.CardCode = GC.CardCode
         OUTER APPLY (
           SELECT TOP 1 State, Country FROM CRD1
           WHERE CardCode = GC.CardCode AND AdresType = 'B'
           ORDER BY Address
         ) AS C1`
      : "";

    if (region && regionStateMapping[region])      extraWhere.push(regionStateMapping[region]);
    else if (state === "Overseas")                  extraWhere.push(`ISNULL(C1.Country,'') <> 'IN'`);
    else if (state && stateCodeMapping[state])      extraWhere.push(`C1.State = '${stateCodeMapping[state]}'`);

    const extraSQL = extraWhere.length ? `AND ${extraWhere.join(" AND ")}` : "";

    // ── Trend chart query ─────────────────────────────────────────────────────
    // Counts distinct customers per period, classified as New or Old.
    // Category filter applied via DISTINCT CardCode from filtered ORDR,
    // so only customers who actually ordered the filtered category are counted.
    const trendQuery = `
      WITH FirstOrders AS (
        -- All-time first order date per customer (across entire history)
        SELECT CardCode, MIN(DocDate) AS FirstOrderDate
        FROM ORDR WHERE CANCELED = 'N'
        GROUP BY CardCode
      ),
      PeriodOrders AS (
        -- One row per (customer, period-bar).
        -- Carry PeriodStart/PeriodEnd so Classified can compare against
        -- each BAR's own date range — not the full FY/month range.
        SELECT DISTINCT
          T0.CardCode,
          ${mode === "daily" ? "DAY(T0.DocDate)" : "MONTH(T0.DocDate)"} AS Period,
          ${mode === "daily"
            ? "CAST(T0.DocDate AS DATE) AS PeriodStart, CAST(T0.DocDate AS DATE) AS PeriodEnd"
            : "DATEFROMPARTS(YEAR(T0.DocDate), MONTH(T0.DocDate), 1) AS PeriodStart, EOMONTH(T0.DocDate) AS PeriodEnd"
          }
        FROM ORDR T0
        ${categoryJoinORDR}
        ${geoJoin}
        WHERE T0.CANCELED = 'N'
          AND T0.DocDate >= ${SD}
          AND T0.DocDate <= ${ED}
          ${extraSQL}
      ),
      Classified AS (
        SELECT
          PO.CardCode,
          PO.Period,
          -- New  = first ever order is within THIS bar's own period
          -- Old  = had an order before this bar's period started
          -- Example: click April bar → New = first order in April
          --          click August bar → Customer B (first April) is now Old ✅
          CASE
            WHEN FO.FirstOrderDate >= PO.PeriodStart
             AND FO.FirstOrderDate <= PO.PeriodEnd
            THEN 'New' ELSE 'Old'
          END AS CustomerType
        FROM PeriodOrders PO
        LEFT JOIN FirstOrders FO ON PO.CardCode = FO.CardCode
      )
      SELECT
        Period,
        CustomerType,
        COUNT(DISTINCT CardCode) AS CustomerCount
      FROM Classified
      GROUP BY Period, CustomerType
      ORDER BY Period ASC;
    `;

    // ── KPI query ─────────────────────────────────────────────────────────────
    // FIX: OrderValue and Sales must be computed at LINE level when a category
    // filter is active — same as sales-cogs.js which uses LineTotal from RDR1/INV1
    // filtered through OITM → OITB. Using DocTotal without line-level filtering
    // inflates the number by including ALL product lines on a header that has
    // at least one line in the chosen category.
    const kpiQuery = `
      WITH FirstOrders AS (
        SELECT CardCode, MIN(DocDate) AS FirstOrderDate
        FROM ORDR WHERE CANCELED = 'N'
        GROUP BY CardCode
      ),
      -- Step 1: customers who had orders in this period matching all filters
      PeriodCustomers AS (
        SELECT DISTINCT T0.CardCode
        FROM ORDR T0
        ${categoryJoinORDR}
        ${geoJoin}
        WHERE T0.CANCELED = 'N'
          AND T0.DocDate >= ${SD}
          AND T0.DocDate <= ${ED}
          ${extraSQL}
      ),
      -- Step 2: classify each customer as New / Old
      Classified AS (
        SELECT
          PC.CardCode,
          CASE
            WHEN FO.FirstOrderDate >= ${SD} AND FO.FirstOrderDate <= ${ED}
            THEN 'New' ELSE 'Old'
          END AS CustomerType
        FROM PeriodCustomers PC
        LEFT JOIN FirstOrders FO ON PC.CardCode = FO.CardCode
      ),
      -- Step 3: Order value — sum at LINE level when category filter active,
      --         otherwise use DocTotal-VatSum per distinct DocEntry (matches sales-cogs.js)
      OrderValues AS (
        ${hasCategoryFilter ? `
        SELECT
          T0.CardCode,
          SUM(RL.LineTotal) AS OrderValue
        FROM ORDR T0
        INNER JOIN RDR1 RL ON T0.DocEntry   = RL.DocEntry
        INNER JOIN OITM IM ON RL.ItemCode   = IM.ItemCode
        INNER JOIN OITB IB ON IM.ItmsGrpCod = IB.ItmsGrpCod
        WHERE T0.CANCELED = 'N'
          AND T0.DocDate >= ${SD}
          AND T0.DocDate <= ${ED}
          AND IB.ItmsGrpNam = @itmsGrpCod
          ${slpCode  ? `AND T0.SlpCode  = @slpCode`  : ""}
          ${cardCode ? `AND T0.CardCode = @cardCode` : ""}
        GROUP BY T0.CardCode
        ` : `
        -- No category filter: sum RDR1.LineTotal per customer (net line value, no tax issues)
        -- ORDR does not have VatSum — using LineTotal from RDR1 matches sales-cogs.js approach
        SELECT T0.CardCode, SUM(RL.LineTotal) AS OrderValue
        FROM ORDR T0
        INNER JOIN RDR1 RL ON T0.DocEntry = RL.DocEntry
        ${geoJoin}
        WHERE T0.CANCELED = 'N'
          AND T0.DocDate >= ${SD}
          AND T0.DocDate <= ${ED}
          ${extraSQL}
        GROUP BY T0.CardCode
        `}
      ),
      -- Step 4: Invoice sales — sum INV1.LineTotal at line level when category
      --         filter active (same logic as sales-cogs.js TotalSales query)
      InvoiceSales AS (
        ${hasCategoryFilter ? `
        SELECT
          T0.CardCode,
          SUM(IL.LineTotal) AS Sales
        FROM OINV T0
        INNER JOIN INV1 IL ON T0.DocEntry   = IL.DocEntry
        INNER JOIN OITM IM ON IL.ItemCode   = IM.ItemCode
        INNER JOIN OITB IB ON IM.ItmsGrpCod = IB.ItmsGrpCod
        WHERE T0.CANCELED = 'N'
          AND T0.[IssReason] <> '4'
          AND T0.DocDate >= ${SD}
          AND T0.DocDate <= ${ED}
          AND IB.ItmsGrpNam = @itmsGrpCod
          ${slpCode  ? `AND T0.SlpCode  = @slpCode`  : ""}
          ${cardCode ? `AND T0.CardCode = @cardCode` : ""}
        GROUP BY T0.CardCode
        ` : `
        SELECT T0.CardCode, SUM(IL.LineTotal) AS Sales
        FROM OINV T0
        INNER JOIN INV1 IL ON T0.DocEntry = IL.DocEntry
        ${geoJoin.replace(/T0\./g,"T0.")}
        WHERE T0.CANCELED = 'N'
          AND T0.[IssReason] <> '4'
          AND T0.DocDate >= ${SD}
          AND T0.DocDate <= ${ED}
          ${extraSQL.replace(/T0\.SlpCode/g,"T0.SlpCode").replace(/T0\.CardCode/g,"T0.CardCode")}
        GROUP BY T0.CardCode
        `}
      )
      SELECT
        C.CustomerType,
        COUNT(DISTINCT C.CardCode)          AS CustomerCount,
        ISNULL(SUM(OV.OrderValue), 0)       AS OrderValue,
        ISNULL(SUM(IS2.Sales),     0)       AS Sales
      FROM Classified C
      LEFT JOIN OrderValues  OV  ON C.CardCode = OV.CardCode
      LEFT JOIN InvoiceSales IS2 ON C.CardCode = IS2.CardCode
      GROUP BY C.CustomerType;
    `;

    const [trendRows, kpiRows] = await Promise.all([
      queryDatabase(trendQuery, params),
      queryDatabase(kpiQuery,   params),
    ]);

    // ── Build period labels ───────────────────────────────────────────────────
    const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    let periods = [];
    if (mode === "daily") {
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const today   = new Date();
      const isCurrentMonth =
        today.getFullYear() === parseInt(year) &&
        today.getMonth() + 1 === parseInt(month);
      const maxDay = isCurrentMonth ? today.getDate() : lastDay;
      for (let d = 1; d <= maxDay; d++) periods.push(d);
    } else {
      const [fyStart] = fy.split("-");
      const fyStartYear = parseInt(fyStart);
      const fyEndYear   = fyStartYear + 1;
      const today = new Date();
      const fyMonths = [4,5,6,7,8,9,10,11,12,1,2,3];
      for (const m of fyMonths) {
        const mYear = m >= 4 ? fyStartYear : fyEndYear;
        if (
          mYear < today.getFullYear() ||
          (mYear === today.getFullYear() && m <= today.getMonth() + 1)
        ) {
          periods.push(m);
        }
      }
    }

    const lookup = {};
    trendRows.forEach(r => {
      const key = r.Period;
      if (!lookup[key]) lookup[key] = { New: 0, Old: 0 };
      lookup[key][r.CustomerType] = r.CustomerCount;
    });

    const chartData = periods.map(p => ({
      period:    mode === "daily" ? p : MONTH_LABELS[p - 1],
      periodNum: p,
      new: lookup[p]?.New || 0,
      old: lookup[p]?.Old || 0,
    }));

    // ── KPI totals ────────────────────────────────────────────────────────────
    let newKpi = { customerCount: 0, orderValue: 0, sales: 0 };
    let oldKpi = { customerCount: 0, orderValue: 0, sales: 0 };

    kpiRows.forEach(r => {
      const obj = {
        customerCount: parseInt(r.CustomerCount)  || 0,
        orderValue:    parseFloat(r.OrderValue)    || 0,
        sales:         parseFloat(r.Sales)         || 0,
      };
      if (r.CustomerType === "New") newKpi = obj;
      else                          oldKpi = obj;
    });

    const allKpi = {
      customerCount: newKpi.customerCount + oldKpi.customerCount,
      orderValue:    newKpi.orderValue    + oldKpi.orderValue,
      sales:         newKpi.sales         + oldKpi.sales,
    };

    const retentionRate = allKpi.customerCount > 0
      ? ((oldKpi.customerCount / allKpi.customerCount) * 100).toFixed(1)
      : "0.0";

    return res.status(200).json({
      chartData,
      kpi: { new: newKpi, old: oldKpi, all: allKpi, retentionRate },
      startDate,
      endDate,
    });

  } catch (err) {
    console.error("new-vs-old-trend API error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}