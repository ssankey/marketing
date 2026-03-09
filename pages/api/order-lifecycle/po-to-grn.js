

// pages/api/order-lifecycle/po-to-grn.js (FIXED - Filters by PO Date)
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

const DEFAULT_RANGES = [
  { id: 1, min: 0, max: 3, label: "0-3 days" },
  { id: 2, min: 4, max: 5, label: "4-5 days" },
  { id: 3, min: 6, max: 8, label: "6-8 days" },
  { id: 4, min: 9, max: 10, label: "9-10 days" },
  { id: 5, min: 11, max: 999, label: "10+ days" },
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { salesPerson, customer, contactPerson, category, ranges } = req.query;

    // Parse custom ranges or use defaults
    const dayRanges = ranges ? JSON.parse(ranges) : DEFAULT_RANGES;

    // Build CASE statement for buckets based on custom ranges
    const buildCaseStatement = (daysColumn) => {
      let caseStmt = "CASE\n";
      for (const range of dayRanges) {
        const max = range.max === null || range.max === 999 ? 999 : range.max;
        caseStmt += `  WHEN ${daysColumn} BETWEEN ${range.min} AND ${max} THEN '${range.label}'\n`;
      }
      caseStmt += "  ELSE 'Unknown'\nEND";
      return caseStmt;
    };

    // Build WHERE clause for filters
    const filterParts = [];
    const params = [];

    if (salesPerson) {
      filterParts.push("T5.SlpName = @salesPerson");
      params.push({ name: "salesPerson", type: sql.VarChar, value: salesPerson });
    }
    if (customer) {
      filterParts.push("C.CardName = @customer");
      params.push({ name: "customer", type: sql.VarChar, value: customer });
    }
    if (contactPerson) {
      filterParts.push("CP.Name = @contactPerson");
      params.push({ name: "contactPerson", type: sql.VarChar, value: contactPerson });
    }
    if (category) {
      filterParts.push("ITB.ItmsGrpNam = @category");
      params.push({ name: "category", type: sql.VarChar, value: category });
    }

    const filterSQL = filterParts.length > 0 ? ` AND ${filterParts.join(" AND ")}` : "";
    const caseStatement = buildCaseStatement("DaysDiff");

    // ✅ UPDATED: CTE now filters by PO date month and joins to OPOR
    const query = `
      WITH PO_GRN_Data AS (
        SELECT
          -- ✅ CHANGED: Group by PO date month instead of GRN date month
          FORMAT(OPOR_PO.DocDate, 'yyyy-MM') AS [Month],
          YEAR(OPOR_PO.DocDate) AS [Year],
          MONTH(OPOR_PO.DocDate) AS [MonthNumber],
          DATEDIFF(DAY, OPOR_PO.DocDate, OPDN.DocDate) AS DaysDiff
        FROM OPDN
        INNER JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry
        -- ✅ JOIN to OPOR first to get PO date (replacing subquery)
        INNER JOIN OPOR OPOR_PO ON PDN1.BaseRef = OPOR_PO.DocNum
        INNER JOIN POR1 ON OPOR_PO.DocEntry = POR1.DocEntry AND PDN1.BaseLine = POR1.LineNum
        INNER JOIN OCRD C ON OPDN.CardCode = C.CardCode
        LEFT JOIN OCPR CP ON OPDN.CntctCode = CP.CntctCode
        LEFT JOIN OSLP T5 ON OPDN.SlpCode = T5.SlpCode
        LEFT JOIN OITM ITM ON PDN1.ItemCode = ITM.ItemCode
        LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
        WHERE OPDN.CANCELED = 'N'${filterSQL}
      )
      SELECT 
        'PO to GRN' AS [Type],
        [Month],
        [Year],
        [MonthNumber],
        ${caseStatement} AS [Bucket],
        COUNT(*) AS [TotalCount]
      FROM PO_GRN_Data
      WHERE DaysDiff IS NOT NULL
      GROUP BY 
        [Month],
        [Year],
        [MonthNumber],
        ${caseStatement}
      ORDER BY [Year], [MonthNumber], [Bucket];
    `;

    const results = await queryDatabase(query, params);

    // Calculate percentages
    const monthMap = {};
    results.forEach((row) => {
      const key = row.Month;
      if (!monthMap[key]) monthMap[key] = { total: 0, rows: [] };
      monthMap[key].total += parseInt(row.TotalCount) || 0;
      monthMap[key].rows.push(row);
    });

    const formattedResults = [];
    Object.values(monthMap).forEach(({ total, rows }) => {
      rows.forEach((row) => {
        const count = parseInt(row.TotalCount) || 0;
        const percentage = total > 0 ? (count * 100.0) / total : 0;
        formattedResults.push({
          Type: row.Type,
          Month: row.Month,
          Year: parseInt(row.Year),
          MonthNumber: parseInt(row.MonthNumber),
          Bucket: row.Bucket,
          TotalCount: count,
          Percentage: parseFloat(percentage.toFixed(2)),
        });
      });
    });

    res.status(200).json({
      success: true,
      data: formattedResults,
      meta: {
        type: "PO to GRN",
        recordCount: formattedResults.length,
        filters: { salesPerson, customer, contactPerson, category },
        rangesUsed: dayRanges,
        note: "Grouped by PO date month, showing GRN lifecycle performance"
      },
    });
  } catch (error) {
    console.error("Error in PO to GRN API:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch PO to GRN data",
      message: error.message,
    });
  }
}