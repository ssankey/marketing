// // pages/api/order-lifecycle/invoice-to-dispatch/details.js
// import { queryDatabase } from "../../../../lib/db";
// import sql from "mssql";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     const { month, bucket, salesPerson, customer, contactPerson, category } = req.query;

//     if (!month || !bucket) {
//       return res.status(400).json({ error: "Month and bucket are required" });
//     }

//     // Parse bucket to get min and max days
//     const bucketMatch = bucket.match(/(\d+)-(\d+)|(\d+)\+/);
//     let minDays, maxDays;
    
//     if (bucketMatch) {
//       if (bucketMatch[3]) {
//         minDays = parseInt(bucketMatch[3]);
//         maxDays = 999;
//       } else {
//         minDays = parseInt(bucketMatch[1]);
//         maxDays = parseInt(bucketMatch[2]);
//       }
//     } else {
//       return res.status(400).json({ error: "Invalid bucket format" });
//     }

//     const whereParts = [
//       "OINV.CANCELED = 'N'",
//       "OINV.U_DispatchDate IS NOT NULL",
//       "FORMAT(OINV.DocDate, 'yyyy-MM') = @month",
//       `DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) BETWEEN @minDays AND @maxDays`
//     ];
    
//     const params = [
//       { name: "month", type: sql.VarChar, value: month },
//       { name: "minDays", type: sql.Int, value: minDays },
//       { name: "maxDays", type: sql.Int, value: maxDays }
//     ];

//     if (salesPerson) {
//       whereParts.push("T5.SlpName = @salesPerson");
//       params.push({ name: "salesPerson", type: sql.VarChar, value: salesPerson });
//     }
//     if (customer) {
//       whereParts.push("C.CardName = @customer");
//       params.push({ name: "customer", type: sql.VarChar, value: customer });
//     }
//     if (contactPerson) {
//       whereParts.push("CP.Name = @contactPerson");
//       params.push({ name: "contactPerson", type: sql.VarChar, value: contactPerson });
//     }
//     if (category) {
//       whereParts.push("ITB.ItmsGrpNam = @category");
//       params.push({ name: "category", type: sql.VarChar, value: category });
//     }

//     const whereSQL = whereParts.join(" AND ");

//     const query = `
//       SELECT 
//         OINV.DocDate AS InvoiceDate,
//         OINV.U_DispatchDate AS DispatchDate,
//         DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) AS DaysDiff,
//         OINV.DocNum AS InvoiceNo,
//         I1.ItemCode,
//         ITM.ItemName,
//         C.CardName AS CustomerName,
//         T5.SlpName AS SalesPerson,
//         ITB.ItmsGrpNam AS Category
//       FROM OINV
//       INNER JOIN INV1 I1 ON OINV.DocEntry = I1.DocEntry
//       INNER JOIN OCRD C ON OINV.CardCode = C.CardCode
//       LEFT JOIN OCPR CP ON OINV.CntctCode = CP.CntctCode
//       LEFT JOIN OSLP T5 ON OINV.SlpCode = T5.SlpCode
//       LEFT JOIN OITM ITM ON I1.ItemCode = ITM.ItemCode
//       LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
//       WHERE ${whereSQL}
//       ORDER BY OINV.DocDate DESC, DaysDiff DESC
//     `;

//     const results = await queryDatabase(query, params);

//     res.status(200).json({
//       success: true,
//       data: results || [],
//       meta: {
//         month,
//         bucket,
//         recordCount: results?.length || 0
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching Invoice to Dispatch details:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch details",
//       message: error.message
//     });
//   }
// }
        


// pages/api/order-lifecycle/invoice-to-dispatch/details.js (FIXED - Accepts Custom Ranges)
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

    const whereParts = [
      "OINV.CANCELED = 'N'",
      "OINV.U_DispatchDate IS NOT NULL",
      "FORMAT(OINV.DocDate, 'yyyy-MM') = @month"
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
        OINV.DocDate AS InvoiceDate,
        OINV.U_DispatchDate AS DispatchDate,
        DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) AS DaysDiff,
        OINV.DocNum AS InvoiceNo,
        I1.ItemCode,
        ITM.ItemName,
        C.CardName AS CustomerName,
        T5.SlpName AS SalesPerson,
        ITB.ItmsGrpNam AS Category
      FROM OINV
      INNER JOIN INV1 I1 ON OINV.DocEntry = I1.DocEntry
      INNER JOIN OCRD C ON OINV.CardCode = C.CardCode
      LEFT JOIN OCPR CP ON OINV.CntctCode = CP.CntctCode
      LEFT JOIN OSLP T5 ON OINV.SlpCode = T5.SlpCode
      LEFT JOIN OITM ITM ON I1.ItemCode = ITM.ItemCode
      LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
      WHERE ${whereSQL}
      AND DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) BETWEEN ${range.min} AND ${maxValue}
      ORDER BY OINV.DocDate DESC, DaysDiff DESC;
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
    console.error("Error fetching Invoice to Dispatch details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch details",
      message: error.message,
    });
  }
}