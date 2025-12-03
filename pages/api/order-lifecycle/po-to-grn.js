
// pages/api/order-lifecycle/po-to-grn.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { salesPerson, customer, contactPerson, category } = req.query;

    // Build WHERE clause
    const whereParts = ["OPDN.CANCELED = 'N'"];
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

    const query = `
      SELECT 
        'PO to GRN' AS [Type],
        FORMAT(PO.DocDate, 'yyyy-MM') AS [Month],
        YEAR(PO.DocDate) AS [Year],
        MONTH(PO.DocDate) AS [MonthNumber],
        CASE 
          WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) <= 3 THEN '0-3 days'
          WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
          WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
          WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
          ELSE '10+ days'
        END AS [Bucket],
        COUNT(*) AS [TotalCount]
      FROM OPOR PO
      JOIN POR1 R1 ON PO.DocEntry = R1.DocEntry
      JOIN PDN1 D1 ON R1.DocEntry = D1.BaseEntry AND R1.LineNum = D1.BaseLine
      JOIN OPDN ON D1.DocEntry = OPDN.DocEntry
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
        CASE 
          WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) <= 3 THEN '0-3 days'
          WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
          WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
          WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
          ELSE '10+ days'
        END
      ORDER BY [Year], [MonthNumber], [Bucket];
    `;

    const results = await queryDatabase(query, params);

    // Calculate percentages
    const monthMap = {};
    results.forEach(row => {
      const key = row.Month;
      if (!monthMap[key]) monthMap[key] = { total: 0, rows: [] };
      monthMap[key].total += parseInt(row.TotalCount) || 0;
      monthMap[key].rows.push(row);
    });

    const formattedResults = [];
    Object.values(monthMap).forEach(({ total, rows }) => {
      rows.forEach(row => {
        const count = parseInt(row.TotalCount) || 0;
        const percentage = total > 0 ? (count * 100.0) / total : 0;
        formattedResults.push({
          Type: row.Type,
          Month: row.Month,
          Year: parseInt(row.Year),
          MonthNumber: parseInt(row.MonthNumber),
          Bucket: row.Bucket,
          TotalCount: count,
          Percentage: parseFloat(percentage.toFixed(2))
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
      }
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