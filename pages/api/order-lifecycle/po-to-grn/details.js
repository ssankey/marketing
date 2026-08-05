

// // pages/api/order-lifecycle/po-to-grn/details.js (CORRECTED)
// import { queryDatabase } from "../../../../lib/db";
// import sql from "mssql";

// const DEFAULT_RANGES = [
//   { id: 1, min: 0, max: 3, label: "0-3 days" },
//   { id: 2, min: 4, max: 5, label: "4-5 days" },
//   { id: 3, min: 6, max: 8, label: "6-8 days" },
//   { id: 4, min: 9, max: 10, label: "9-10 days" },
//   { id: 5, min: 11, max: 999, label: "10+ days" },
// ];

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     const { month, bucket, salesPerson, customer, contactPerson, category } = req.query;

//     if (!month || !bucket) {
//       return res.status(400).json({ error: "Month and bucket are required" });
//     }

//     // Find the range definition for this bucket
//     const range = DEFAULT_RANGES.find(r => r.label === bucket);
//     if (!range) {
//       return res.status(400).json({ error: "Invalid bucket" });
//     }

//     const whereParts = [
//       "OPDN.CANCELED = 'N'",
//       "FORMAT(OPDN.DocDate, 'yyyy-MM') = @month"
//     ];
    
//     const params = [
//       { name: "month", type: sql.VarChar, value: month }
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

//     // Note: Using subquery to get PO Date based on BaseRef (PO DocNum) and BaseLine
//     // This matches the reference query structure
//     const query = `
//       SELECT 
//         (SELECT TOP 1 a.DocDate 
//          FROM OPOR a 
//          INNER JOIN POR1 b ON a.DocEntry = b.DocEntry 
//          WHERE a.DocNum = PDN1.BaseRef 
//          AND PDN1.BaseLine = b.LineNum) AS PODate,
//         OPDN.DocDate AS GRNDate,
//         DATEDIFF(DAY, 
//           (SELECT TOP 1 a.DocDate 
//            FROM OPOR a 
//            INNER JOIN POR1 b ON a.DocEntry = b.DocEntry 
//            WHERE a.DocNum = PDN1.BaseRef 
//            AND PDN1.BaseLine = b.LineNum),
//           OPDN.DocDate) AS DaysDiff,
//         PDN1.BaseRef AS PONumber,
//         OPDN.DocNum AS GRNNumber,
//         PDN1.ItemCode,
//         PDN1.Dscription AS ItemName,
//         C.CardName AS VendorName,
//         T5.SlpName AS SalesPerson,
//         ITB.ItmsGrpNam AS Category
//       FROM OPDN
//       INNER JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry
//       INNER JOIN OCRD C ON OPDN.CardCode = C.CardCode
//       LEFT JOIN OCPR CP ON OPDN.CntctCode = CP.CntctCode
//       LEFT JOIN OSLP T5 ON OPDN.SlpCode = T5.SlpCode
//       LEFT JOIN OITM ITM ON PDN1.ItemCode = ITM.ItemCode
//       LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
//       WHERE ${whereSQL}
//       AND DATEDIFF(DAY, 
//         (SELECT TOP 1 a.DocDate 
//          FROM OPOR a 
//          INNER JOIN POR1 b ON a.DocEntry = b.DocEntry 
//          WHERE a.DocNum = PDN1.BaseRef 
//          AND PDN1.BaseLine = b.LineNum),
//         OPDN.DocDate) BETWEEN ${range.min} AND ${range.max === 999 ? 999 : range.max}
//       ORDER BY OPDN.DocDate DESC, OPDN.DocNum DESC;
//     `;

//     const results = await queryDatabase(query, params);

//     res.status(200).json({
//       success: true,
//       data: results,
//       meta: {
//         month,
//         bucket,
//         recordCount: results.length,
//       },
//     });
//   } catch (error) {
//     console.error("Error in PO to GRN details API:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch details",
//       message: error.message,
//     });
//   }
// }


// // pages/api/order-lifecycle/po-to-grn/details.js (FIXED - ACCEPTS RANGES)
// import { queryDatabase } from "../../../../lib/db";
// import sql from "mssql";

// const DEFAULT_RANGES = [
//   { id: 1, min: 0, max: 3, label: "0-3 days" },
//   { id: 2, min: 4, max: 5, label: "4-5 days" },
//   { id: 3, min: 6, max: 8, label: "6-8 days" },
//   { id: 4, min: 9, max: 10, label: "9-10 days" },
//   { id: 5, min: 11, max: 999, label: "10+ days" },
// ];

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     // ✅ ADD ranges to destructuring
//     const { month, bucket, salesPerson, customer, contactPerson, category, ranges } = req.query;

//     if (!month || !bucket) {
//       return res.status(400).json({ error: "Month and bucket are required" });
//     }

//     // ✅ Parse custom ranges or use defaults
//     const dayRanges = ranges ? JSON.parse(ranges) : DEFAULT_RANGES;

//     // ✅ Find the range from custom ranges (not DEFAULT_RANGES)
//     const range = dayRanges.find(r => r.label === bucket);
//     if (!range) {
//       return res.status(400).json({ 
//         error: `Invalid bucket: "${bucket}". Available: ${dayRanges.map(r => r.label).join(', ')}` 
//       });
//     }

//     const whereParts = [
//       "OPDN.CANCELED = 'N'",
//       "FORMAT(OPDN.DocDate, 'yyyy-MM') = @month"
//     ];
    
//     const params = [
//       { name: "month", type: sql.VarChar, value: month }
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
    
//     // ✅ Handle max value properly
//     const maxValue = range.max === 999 || range.max === null ? 999 : range.max;

//     const query = `
//       SELECT 
//         (SELECT TOP 1 a.DocDate 
//          FROM OPOR a 
//          INNER JOIN POR1 b ON a.DocEntry = b.DocEntry 
//          WHERE a.DocNum = PDN1.BaseRef 
//          AND PDN1.BaseLine = b.LineNum) AS PODate,
//         OPDN.DocDate AS GRNDate,
//         DATEDIFF(DAY, 
//           (SELECT TOP 1 a.DocDate 
//            FROM OPOR a 
//            INNER JOIN POR1 b ON a.DocEntry = b.DocEntry 
//            WHERE a.DocNum = PDN1.BaseRef 
//            AND PDN1.BaseLine = b.LineNum),
//           OPDN.DocDate) AS DaysDiff,
//         PDN1.BaseRef AS PONumber,
//         OPDN.DocNum AS GRNNumber,
//         PDN1.ItemCode,
//         PDN1.Dscription AS ItemName,
//         C.CardName AS VendorName,
//         T5.SlpName AS SalesPerson,
//         ITB.ItmsGrpNam AS Category
//       FROM OPDN
//       INNER JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry
//       INNER JOIN OCRD C ON OPDN.CardCode = C.CardCode
//       LEFT JOIN OCPR CP ON OPDN.CntctCode = CP.CntctCode
//       LEFT JOIN OSLP T5 ON OPDN.SlpCode = T5.SlpCode
//       LEFT JOIN OITM ITM ON PDN1.ItemCode = ITM.ItemCode
//       LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
//       WHERE ${whereSQL}
//       AND DATEDIFF(DAY, 
//         (SELECT TOP 1 a.DocDate 
//          FROM OPOR a 
//          INNER JOIN POR1 b ON a.DocEntry = b.DocEntry 
//          WHERE a.DocNum = PDN1.BaseRef 
//          AND PDN1.BaseLine = b.LineNum),
//         OPDN.DocDate) BETWEEN ${range.min} AND ${maxValue}
//       ORDER BY OPDN.DocDate DESC, OPDN.DocNum DESC;
//     `;

//     const results = await queryDatabase(query, params);

//     res.status(200).json({
//       success: true,
//       data: results,
//       meta: {
//         month,
//         bucket,
//         recordCount: results.length,
//         rangeUsed: range,  // ✅ Include which range was used
//       },
//     });
//   } catch (error) {
//     console.error("Error in PO to GRN details API:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch details",
//       message: error.message,
//     });
//   }
// }

// pages/api/order-lifecycle/po-to-grn/details.js (FIXED - FILTERS BY PO DATE)
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
    const { month, bucket, salesPerson, customer, contactPerson, category, ranges } = req.query;

    if (!month || !bucket) {
      return res.status(400).json({ error: "Month and bucket are required" });
    }

    // Parse custom ranges or use defaults
    const dayRanges = ranges ? JSON.parse(ranges) : DEFAULT_RANGES;

    // Find the range from custom ranges
    const range = dayRanges.find(r => r.label === bucket);
    if (!range) {
      return res.status(400).json({ 
        error: `Invalid bucket: "${bucket}". Available: ${dayRanges.map(r => r.label).join(', ')}` 
      });
    }

    const whereParts = [
      "OPDN.CANCELED = 'N'",
      // ✅ CHANGED: Filter by PO date month instead of GRN date month
      "FORMAT(OPOR_PO.DocDate, 'yyyy-MM') = @month"
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
    
    // Handle max value properly
    const maxValue = range.max === 999 || range.max === null ? 999 : range.max;

    // ✅ OPTIMIZED: Join to OPOR once instead of using subqueries multiple times
    const query = `
      SELECT 
        OPOR_PO.DocDate AS PODate,
        OPDN.DocDate AS GRNDate,
        DATEDIFF(DAY, OPOR_PO.DocDate, OPDN.DocDate) AS DaysDiff,
        PDN1.BaseRef AS PONumber,
        OPDN.DocNum AS GRNNumber,
        PDN1.ItemCode,
        PDN1.Dscription AS ItemName,
        C.CardName AS VendorName,
        T5.SlpName AS SalesPerson,
        ITB.ItmsGrpNam AS Category
      FROM OPDN
      INNER JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry
      -- ✅ JOIN to OPOR first using DocNum (PO Number)
      INNER JOIN OPOR OPOR_PO ON PDN1.BaseRef = OPOR_PO.DocNum
      INNER JOIN POR1 ON OPOR_PO.DocEntry = POR1.DocEntry AND PDN1.BaseLine = POR1.LineNum
      INNER JOIN OCRD C ON OPDN.CardCode = C.CardCode
      LEFT JOIN OCPR CP ON OPDN.CntctCode = CP.CntctCode
      LEFT JOIN OSLP T5 ON OPDN.SlpCode = T5.SlpCode
      LEFT JOIN OITM ITM ON PDN1.ItemCode = ITM.ItemCode
      LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
      WHERE ${whereSQL}
      AND DATEDIFF(DAY, OPOR_PO.DocDate, OPDN.DocDate) BETWEEN ${range.min} AND ${maxValue}
      ORDER BY OPOR_PO.DocDate DESC, OPDN.DocNum DESC;
    `;

    const results = await queryDatabase(query, params);

    res.status(200).json({
      success: true,
      data: results,
      meta: {
        month,
        bucket,
        recordCount: results.length,
        rangeUsed: range,
        note: "Filtered by PO date month, showing GRN lifecycle"
      },
    });
  } catch (error) {
    console.error("Error in PO to GRN details API:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch details",
      message: error.message,
    });
  }
}