// pages/api/order-lifecycle/grn-to-invoice/details.js (NEW - Filters by GRN Date)
import { queryDatabase } from "../../../../lib/db";
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
    // ✅ ADD ranges to destructuring
    const { month, bucket, salesPerson, customer, contactPerson, category, ranges } = req.query;

    if (!month || !bucket) {
      return res.status(400).json({ error: "Month and bucket are required" });
    }

    // ✅ Parse custom ranges or use defaults
    const dayRanges = ranges ? JSON.parse(ranges) : DEFAULT_RANGES;

    // ✅ Find the range from custom ranges (not DEFAULT_RANGES)
    const range = dayRanges.find(r => r.label === bucket);
    if (!range) {
      return res.status(400).json({ 
        error: `Invalid bucket: "${bucket}". Available: ${dayRanges.map(r => r.label).join(', ')}` 
      });
    }

    // ✅ Filter by GRN date month
    const whereParts = [
      "OPDN.CANCELED = 'N'",
      "OINV.CANCELED = 'N'",
      "FORMAT(OPDN.DocDate, 'yyyy-MM') = @month"
    ];
    
    const params = [
      { name: "month", type: sql.VarChar, value: month }
    ];

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
    
    // ✅ Handle max value properly
    const maxValue = range.max === 999 || range.max === null ? 999 : range.max;

    const query = `
      SELECT 
        OPDN.DocDate AS GRNDate,
        OINV.DocDate AS InvoiceDate,
        DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) AS DaysDiff,
        OPDN.DocNum AS GRNNumber,
        OINV.DocNum AS InvoiceNumber,
        D1.ItemCode,
        ITM.ItemName,
        C.CardName AS VendorName,
        T5.SlpName AS SalesPerson,
        ITB.ItmsGrpNam AS Category
      FROM OPDN
      INNER JOIN PDN1 D1 ON OPDN.DocEntry = D1.DocEntry
      INNER JOIN INV1 I1 ON D1.DocEntry = I1.BaseEntry AND D1.LineNum = I1.BaseLine
      INNER JOIN OINV ON I1.DocEntry = OINV.DocEntry
      INNER JOIN OCRD C ON OPDN.CardCode = C.CardCode
      LEFT JOIN OCPR CP ON OPDN.CntctCode = CP.CntctCode
      LEFT JOIN OSLP T5 ON OPDN.SlpCode = T5.SlpCode
      LEFT JOIN OITM ITM ON D1.ItemCode = ITM.ItemCode
      LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
      WHERE ${whereSQL}
      AND DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) BETWEEN ${range.min} AND ${maxValue}
      ORDER BY OPDN.DocDate DESC, DaysDiff DESC;
    `;

    const results = await queryDatabase(query, params);

    res.status(200).json({
      success: true,
      data: results || [],
      meta: {
        month,
        bucket,
        recordCount: results?.length || 0,
        rangeUsed: range,  // ✅ Include which range was used
      },
    });
  } catch (error) {
    console.error("Error fetching GRN to Invoice details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch details",
      message: error.message,
    });
  }
}