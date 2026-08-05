// pages/api/order-lifecycle/po-to-invoice.js
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

    // Build CASE statement for buckets - NOW TRACKING PO DATE TO INVOICE DATE
    const buildCaseStatement = () => {
      let caseStmt = "CASE\n";
      for (const range of dayRanges) {
        const max = range.max === null || range.max === 999 ? 999 : range.max;
        caseStmt += `  WHEN DATEDIFF(DAY, PO.DocDate, OINV.DocDate) BETWEEN ${range.min} AND ${max} THEN '${range.label}'\n`;
      }
      caseStmt += "  ELSE 'Unknown'\nEND";
      return caseStmt;
    };

    // Filters on PO (OPOR) table
    const whereParts = ["OINV.CANCELED = 'N'"];
    const params = [];

    if (salesPerson) {
      whereParts.push("T5.SlpName = @salesPerson");
      params.push({ name: "salesPerson", type: sql.VarChar, value: salesPerson });
    }
    if (customer) {
      whereParts.push("C.CardName = @customer");
      params.push({ name: "customer", type: sql.VarChar, value: customer });
    }
    if (contactPerson) {
      whereParts.push("CP.Name = @contactPerson");
      params.push({ name: "contactPerson", type: sql.VarChar, value: contactPerson });
    }
    if (category) {
      whereParts.push("ITB.ItmsGrpNam = @category");
      params.push({ name: "category", type: sql.VarChar, value: category });
    }

    const whereSQL = whereParts.join(" AND ");
    const caseStatement = buildCaseStatement();

    // Query now joins PO directly to Invoice through GRN
    const query = `
      SELECT 
        'PO to Invoice' AS [Type],
        FORMAT(PO.DocDate, 'yyyy-MM') AS [Month],
        YEAR(PO.DocDate) AS [Year],
        MONTH(PO.DocDate) AS [MonthNumber],
        ${caseStatement} AS [Bucket],
        COUNT(DISTINCT PO.DocEntry) AS [TotalCount]
      FROM OPOR PO
      JOIN POR1 R1 ON PO.DocEntry = R1.DocEntry
      JOIN PDN1 D1 ON R1.DocEntry = D1.BaseEntry AND R1.LineNum = D1.BaseLine
      JOIN OPDN ON D1.DocEntry = OPDN.DocEntry
      JOIN INV1 I1 ON D1.DocEntry = I1.BaseEntry AND D1.LineNum = I1.BaseLine
      JOIN OINV ON I1.DocEntry = OINV.DocEntry
      INNER JOIN OCRD C ON PO.CardCode = C.CardCode
      LEFT JOIN OCPR CP ON PO.CntctCode = CP.CntctCode
      LEFT JOIN OSLP T5 ON PO.SlpCode = T5.SlpCode
      LEFT JOIN OITM ITM ON R1.ItemCode = ITM.ItemCode
      LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
      WHERE ${whereSQL}
      GROUP BY 
        FORMAT(PO.DocDate, 'yyyy-MM'),
        YEAR(PO.DocDate),
        MONTH(PO.DocDate),
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
        type: "PO to Invoice",
        recordCount: formattedResults.length,
        filters: { salesPerson, customer, contactPerson, category },
      },
    });
  } catch (error) {
    console.error("Error in PO to Invoice API:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch PO to Invoice data",
      message: error.message,
    });
  }
}