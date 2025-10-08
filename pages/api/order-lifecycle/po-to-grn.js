

// // // // // pages/api/order-lifecycle/po-to-grn.js
// // // // import { queryDatabase } from "../../../lib/db";
// // // // import sql from "mssql";

// // // // export default async function handler(req, res) {
// // // //   if (req.method !== "GET") {
// // // //     return res.status(405).json({ error: "Method Not Allowed" });
// // // //   }

// // // //   try {
// // // //     const { ranges, slpCode, cardCode, cntctCode, itmsGrpCod } = req.query;

// // // //     // Parse ranges dynamically from query parameter
// // // //     const dayRanges = ranges
// // // //       ? JSON.parse(ranges)
// // // //       : [
// // // //           { min: 0, max: 3, label: "0-3 days" },
// // // //           { min: 4, max: 5, label: "4-5 days" },
// // // //           { min: 6, max: 8, label: "6-8 days" },
// // // //           { min: 9, max: 10, label: "9-10 days" },
// // // //           { min: 11, max: 999, label: "10+ days" },
// // // //         ];

// // // //     // Build CASE statement dynamically based on ranges
// // // //     const buildCaseStatement = (d1, d2) => {
// // // //       let c = "CASE\n";
// // // //       for (const r of dayRanges) {
// // // //         if (r.max === 999 || r.max === null || typeof r.max === "undefined") {
// // // //           c += `  WHEN DATEDIFF(DAY, ${d1}, ${d2}) >= ${r.min} THEN '${r.label}'\n`;
// // // //         } else {
// // // //           c += `  WHEN DATEDIFF(DAY, ${d1}, ${d2}) BETWEEN ${r.min} AND ${r.max} THEN '${r.label}'\n`;
// // // //         }
// // // //       }
// // // //       c += "  ELSE 'Unknown'\nEND";
// // // //       return c;
// // // //     };

// // // //     const caseStmt = buildCaseStatement("PO.DocDate", "OPDN.DocDate");

// // // //     // Build WHERE clause with frontend filters
// // // //     const whereParts = ["OPDN.CANCELED = 'N'"];
// // // //     const params = [];

// // // //     if (slpCode) {
// // // //       whereParts.push("PO.SlpCode = @slpCode");
// // // //       params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode, 10) });
// // // //     }
// // // //     if (cardCode) {
// // // //       whereParts.push("PO.CardCode = @cardCode");
// // // //       params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
// // // //     }
// // // //     if (cntctCode) {
// // // //       whereParts.push("PO.CntctCode = @cntctCode");
// // // //       params.push({ name: "cntctCode", type: sql.Int, value: parseInt(cntctCode, 10) });
// // // //     }
// // // //     if (itmsGrpCod) {
// // // //       whereParts.push("OITM.ItmsGrpCod = @itmsGrpCod");
// // // //       params.push({ name: "itmsGrpCod", type: sql.Int, value: parseInt(itmsGrpCod, 10) });
// // // //     }

// // // //     const whereSQL = whereParts.join(" AND ");

// // // //     const query = `
// // // //       WITH PO_GRN AS (
// // // //         SELECT
// // // //           'PO to GRN' AS Type,
// // // //           FORMAT(PO.DocDate, 'yyyy-MM') AS Month,
// // // //           ${caseStmt} AS Bucket,
// // // //           YEAR(PO.DocDate) AS Year,
// // // //           MONTH(PO.DocDate) AS MonthNumber
// // // //         FROM OPOR PO
// // // //         JOIN POR1 ON PO.DocEntry = POR1.DocEntry
// // // //         JOIN PDN1 ON POR1.DocEntry = PDN1.BaseEntry 
// // // //              AND POR1.LineNum = PDN1.BaseLine
// // // //         JOIN OPDN ON PDN1.DocEntry = OPDN.DocEntry
// // // //         ${itmsGrpCod ? 'LEFT JOIN OITM ON POR1.ItemCode = OITM.ItemCode' : ''}
// // // //         WHERE ${whereSQL}
// // // //       ),
// // // //       BucketCounts AS (
// // // //         SELECT 
// // // //           Type, Month, Bucket, Year, MonthNumber, 
// // // //           COUNT(*) AS TotalCount
// // // //         FROM PO_GRN 
// // // //         GROUP BY Type, Month, Bucket, Year, MonthNumber
// // // //       ),
// // // //       BucketPercents AS (
// // // //         SELECT
// // // //           Type, Month, Bucket, Year, MonthNumber, TotalCount,
// // // //           CAST(100.0 * TotalCount / SUM(TotalCount) OVER (PARTITION BY Type, Month) AS DECIMAL(5,2)) AS Percentage
// // // //         FROM BucketCounts
// // // //       )
// // // //       SELECT Type, Month, Year, MonthNumber, Bucket, TotalCount, Percentage
// // // //       FROM BucketPercents
// // // //       ORDER BY Year, MonthNumber, Bucket;
// // // //     `;

// // // //     const results = await queryDatabase(query, params);

// // // //     // Format results
// // // //     const formattedResults = (results || []).map(row => ({
// // // //       Type: row.Type,
// // // //       Month: row.Month,
// // // //       Year: parseInt(row.Year),
// // // //       MonthNumber: parseInt(row.MonthNumber),
// // // //       Bucket: row.Bucket,
// // // //       TotalCount: parseInt(row.TotalCount) || 0,
// // // //       Percentage: parseFloat(row.Percentage) || 0
// // // //     }));

// // // //     res.status(200).json({ 
// // // //       success: true, 
// // // //       data: formattedResults,
// // // //       meta: {
// // // //         type: "PO to GRN",
// // // //         recordCount: formattedResults.length,
// // // //         ranges: dayRanges,
// // // //         filters: { slpCode, cardCode, cntctCode, itmsGrpCod },
// // // //       }
// // // //     });

// // // //   } catch (error) {
// // // //     console.error("Error in PO to GRN API:", error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       error: "Failed to fetch PO to GRN data",
// // // //       message: error.message,
// // // //     });
// // // //   }
// // // // }

// // // // // pages/api/order-lifecycle/po-to-grn.js
// // // // import { queryDatabase } from "../../../lib/db";
// // // // import sql from "mssql";

// // // // export default async function handler(req, res) {
// // // //   if (req.method !== "GET") {
// // // //     return res.status(405).json({ error: "Method Not Allowed" });
// // // //   }

// // // //   try {
// // // //     const { ranges, slpCode, cardCode, cntctCode, itmsGrpCod } = req.query;

// // // //     // Parse ranges dynamically from query parameter
// // // //     const dayRanges = ranges
// // // //       ? JSON.parse(ranges)
// // // //       : [
// // // //           { min: 0, max: 3, label: "0-3 days" },
// // // //           { min: 4, max: 5, label: "4-5 days" },
// // // //           { min: 6, max: 8, label: "6-8 days" },
// // // //           { min: 9, max: 10, label: "9-10 days" },
// // // //           { min: 11, max: 999, label: "10+ days" },
// // // //         ];

// // // //     // Build CASE statement dynamically based on ranges
// // // //     const buildCaseStatement = (d1, d2) => {
// // // //       let c = "CASE\n";
// // // //       for (const r of dayRanges) {
// // // //         if (r.max === 999 || r.max === null || typeof r.max === "undefined") {
// // // //           c += `  WHEN DATEDIFF(DAY, ${d1}, ${d2}) >= ${r.min} THEN '${r.label}'\n`;
// // // //         } else {
// // // //           c += `  WHEN DATEDIFF(DAY, ${d1}, ${d2}) BETWEEN ${r.min} AND ${r.max} THEN '${r.label}'\n`;
// // // //         }
// // // //       }
// // // //       c += "  ELSE 'Unknown'\nEND";
// // // //       return c;
// // // //     };

// // // //     const caseStmt = buildCaseStatement("PO.DocDate", "OPDN.DocDate");

// // // //     // Build WHERE clause with frontend filters
// // // //     const whereParts = ["OPDN.CANCELED = 'N'"];
// // // //     const params = [];

// // // //     if (slpCode) {
// // // //       whereParts.push("PO.SlpCode = @slpCode");
// // // //       params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode, 10) });
// // // //     }
// // // //     if (cardCode) {
// // // //       whereParts.push("PO.CardCode = @cardCode");
// // // //       params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
// // // //     }
// // // //     if (cntctCode) {
// // // //       whereParts.push("PO.CntctCode = @cntctCode");
// // // //       params.push({ name: "cntctCode", type: sql.Int, value: parseInt(cntctCode, 10) });
// // // //     }
// // // //     if (itmsGrpCod) {
// // // //       whereParts.push("OITM.ItmsGrpCod = @itmsGrpCod");
// // // //       params.push({ name: "itmsGrpCod", type: sql.VarChar, value: itmsGrpCod });
// // // //     }

// // // //     const whereSQL = whereParts.join(" AND ");

// // // //     const query = `
// // // //       WITH PO_GRN AS (
// // // //         SELECT
// // // //           'PO to GRN' AS Type,
// // // //           FORMAT(PO.DocDate, 'yyyy-MM') AS Month,
// // // //           ${caseStmt} AS Bucket,
// // // //           YEAR(PO.DocDate) AS Year,
// // // //           MONTH(PO.DocDate) AS MonthNumber
// // // //         FROM OPOR PO
// // // //         JOIN POR1 ON PO.DocEntry = POR1.DocEntry
// // // //         JOIN PDN1 ON POR1.DocEntry = PDN1.BaseEntry 
// // // //              AND POR1.LineNum = PDN1.BaseLine
// // // //         JOIN OPDN ON PDN1.DocEntry = OPDN.DocEntry
// // // //         ${itmsGrpCod ? 'LEFT JOIN OITM ON POR1.ItemCode = OITM.ItemCode' : ''}
// // // //         WHERE ${whereSQL}
// // // //       ),
// // // //       BucketCounts AS (
// // // //         SELECT 
// // // //           Type, Month, Bucket, Year, MonthNumber, 
// // // //           COUNT(*) AS TotalCount
// // // //         FROM PO_GRN 
// // // //         GROUP BY Type, Month, Bucket, Year, MonthNumber
// // // //       ),
// // // //       BucketPercents AS (
// // // //         SELECT
// // // //           Type, Month, Bucket, Year, MonthNumber, TotalCount,
// // // //           CAST(100.0 * TotalCount / SUM(TotalCount) OVER (PARTITION BY Type, Month) AS DECIMAL(5,2)) AS Percentage
// // // //         FROM BucketCounts
// // // //       )
// // // //       SELECT Type, Month, Year, MonthNumber, Bucket, TotalCount, Percentage
// // // //       FROM BucketPercents
// // // //       ORDER BY Year, MonthNumber, Bucket;
// // // //     `;

// // // //     const results = await queryDatabase(query, params);

// // // //     // Format results
// // // //     const formattedResults = (results || []).map(row => ({
// // // //       Type: row.Type,
// // // //       Month: row.Month,
// // // //       Year: parseInt(row.Year),
// // // //       MonthNumber: parseInt(row.MonthNumber),
// // // //       Bucket: row.Bucket,
// // // //       TotalCount: parseInt(row.TotalCount) || 0,
// // // //       Percentage: parseFloat(row.Percentage) || 0
// // // //     }));

// // // //     res.status(200).json({ 
// // // //       success: true, 
// // // //       data: formattedResults,
// // // //       meta: {
// // // //         type: "PO to GRN",
// // // //         recordCount: formattedResults.length,
// // // //         ranges: dayRanges,
// // // //         filters: { slpCode, cardCode, cntctCode, itmsGrpCod },
// // // //       }
// // // //     });

// // // //   } catch (error) {
// // // //     console.error("Error in PO to GRN API:", error);
// // // //     res.status(500).json({
// // // //       success: false,
// // // //       error: "Failed to fetch PO to GRN data",
// // // //       message: error.message,
// // // //     });
// // // //   }
// // // // }

// // // // pages/api/order-lifecycle/po-to-grn.js
// // // import { queryDatabase } from "../../../lib/db";
// // // import sql from "mssql";

// // // export default async function handler(req, res) {
// // //   if (req.method !== "GET") {
// // //     return res.status(405).json({ error: "Method Not Allowed" });
// // //   }

// // //   try {
// // //     const { ranges, slpCode, cardCode, cntctCode, itmsGrpCod } = req.query;

// // //     // Parse ranges dynamically from query parameter
// // //     const dayRanges = ranges
// // //       ? JSON.parse(ranges)
// // //       : [
// // //           { min: 0, max: 3, label: "0-3 days" },
// // //           { min: 4, max: 5, label: "4-5 days" },
// // //           { min: 6, max: 8, label: "6-8 days" },
// // //           { min: 9, max: 10, label: "9-10 days" },
// // //           { min: 11, max: 999, label: "10+ days" },
// // //         ];

// // //     // Build CASE statement dynamically based on ranges
// // //     const buildCaseStatement = (d1, d2) => {
// // //       let c = "CASE\n";
// // //       for (const r of dayRanges) {
// // //         if (r.max === 999 || r.max === null || typeof r.max === "undefined") {
// // //           c += `  WHEN DATEDIFF(DAY, ${d1}, ${d2}) >= ${r.min} THEN '${r.label}'\n`;
// // //         } else {
// // //           c += `  WHEN DATEDIFF(DAY, ${d1}, ${d2}) BETWEEN ${r.min} AND ${r.max} THEN '${r.label}'\n`;
// // //         }
// // //       }
// // //       c += "  ELSE 'Unknown'\nEND";
// // //       return c;
// // //     };

// // //     const caseStmt = buildCaseStatement("PO.DocDate", "OPDN.DocDate");

// // //     // Build WHERE clause with frontend filters
// // //     const whereParts = ["OPDN.CANCELED = 'N'"];
// // //     const params = [];

// // //     if (slpCode) {
// // //       whereParts.push("T5.SlpName = @slpCode");
// // //       params.push({ name: "slpCode", type: sql.VarChar, value: slpCode });
// // //     }
// // //     if (cardCode) {
// // //       whereParts.push("C.CardCode = @cardCode");
// // //       params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
// // //     }
// // //     if (cntctCode) {
// // //       whereParts.push("CP.Name = @cntctCode");
// // //       params.push({ name: "cntctCode", type: sql.VarChar, value: cntctCode });
// // //     }
// // //     if (itmsGrpCod) {
// // //       whereParts.push("ITB.ItmsGrpNam = @itmsGrpCod");
// // //       params.push({ name: "itmsGrpCod", type: sql.VarChar, value: itmsGrpCod });
// // //     }

// // //     const whereSQL = whereParts.join(" AND ");

// // //     const query = `
// // //       SELECT 
// // //         'PO to GRN' AS [Type],
// // //         FORMAT(PO.DocDate, 'yyyy-MM') AS [Month],
// // //         YEAR(PO.DocDate) AS [Year],
// // //         MONTH(PO.DocDate) AS [MonthNumber],
// // //         ${caseStmt} AS [Bucket],
// // //         COUNT(*) AS [Total Count]
// // //       FROM OPOR PO
// // //       JOIN POR1 R1 ON PO.DocEntry = R1.DocEntry
// // //       JOIN PDN1 D1 ON R1.DocEntry = D1.BaseEntry AND R1.LineNum = D1.BaseLine
// // //       JOIN OPDN ON D1.DocEntry = OPDN.DocEntry
// // //       INNER JOIN OCRD C ON PO.CardCode = C.CardCode
// // //       LEFT JOIN OCPR CP ON PO.CntctCode = CP.CntctCode
// // //       LEFT JOIN OSLP T5 ON PO.SlpCode = T5.SlpCode
// // //       LEFT JOIN OITM ITM ON R1.ItemCode = ITM.ItemCode
// // //       LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
// // //       WHERE ${whereSQL}
// // //       GROUP BY 
// // //         FORMAT(PO.DocDate, 'yyyy-MM'),
// // //         YEAR(PO.DocDate),
// // //         MONTH(PO.DocDate),
// // //         ${caseStmt}
// // //       ORDER BY [Year], [MonthNumber], [Bucket];
// // //     `;

// // //     const results = await queryDatabase(query, params);

// // //     // Calculate percentages
// // //     const monthMap = {};
// // //     results.forEach(row => {
// // //       const key = row.Month;
// // //       if (!monthMap[key]) monthMap[key] = { total: 0, rows: [] };
// // //       monthMap[key].total += parseInt(row['Total Count']) || 0;
// // //       monthMap[key].rows.push(row);
// // //     });

// // //     const formattedResults = [];
// // //     Object.values(monthMap).forEach(({ total, rows }) => {
// // //       rows.forEach(row => {
// // //         const count = parseInt(row['Total Count']) || 0;
// // //         const percentage = total > 0 ? (count * 100.0) / total : 0;
// // //         formattedResults.push({
// // //           Type: row.Type,
// // //           Month: row.Month,
// // //           Year: parseInt(row.Year),
// // //           MonthNumber: parseInt(row.MonthNumber),
// // //           Bucket: row.Bucket,
// // //           TotalCount: count,
// // //           Percentage: parseFloat(percentage.toFixed(2))
// // //         });
// // //       });
// // //     });

// // //     res.status(200).json({ 
// // //       success: true, 
// // //       data: formattedResults,
// // //       meta: {
// // //         type: "PO to GRN",
// // //         recordCount: formattedResults.length,
// // //         ranges: dayRanges,
// // //         filters: { slpCode, cardCode, cntctCode, itmsGrpCod },
// // //       }
// // //     });

// // //   } catch (error) {
// // //     console.error("Error in PO to GRN API:", error);
// // //     res.status(500).json({
// // //       success: false,
// // //       error: "Failed to fetch PO to GRN data",
// // //       message: error.message,
// // //     });
// // //   }
// // // }

// // // pages/api/order-lifecycle/po-to-grn.js
// // import { queryDatabase } from "../../../lib/db";
// // import sql from "mssql";

// // export default async function handler(req, res) {
// //   if (req.method !== "GET") {
// //     return res.status(405).json({ error: "Method Not Allowed" });
// //   }

// //   try {
// //     const { slpName, cardCode, contactPerson, category } = req.query;

// //     // Build WHERE clause
// //     const whereParts = ["OPDN.CANCELED = 'N'"];
// //     const params = [];

// //     if (slpName) {
// //       whereParts.push("T5.SlpName = @slpName");
// //       params.push({ name: "slpName", type: sql.VarChar, value: slpName });
// //     }
// //     if (cardCode) {
// //       whereParts.push("C.CardCode = @cardCode");
// //       params.push({ name: "cardCode", type: sql.VarChar, value: cardCode });
// //     }
// //     if (contactPerson) {
// //       whereParts.push("CP.Name = @contactPerson");
// //       params.push({ name: "contactPerson", type: sql.VarChar, value: contactPerson });
// //     }
// //     if (category) {
// //       whereParts.push("ITB.ItmsGrpNam = @category");
// //       params.push({ name: "category", type: sql.VarChar, value: category });
// //     }

// //     const whereSQL = whereParts.join(" AND ");

// //     const query = `
// //       SELECT 
// //         'PO to GRN' AS [Type],
// //         FORMAT(PO.DocDate, 'yyyy-MM') AS [Month],
// //         YEAR(PO.DocDate) AS [Year],
// //         MONTH(PO.DocDate) AS [MonthNumber],
// //         CASE 
// //           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) <= 3 THEN '0-3 days'
// //           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
// //           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
// //           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
// //           ELSE '10+ days'
// //         END AS [Bucket],
// //         COUNT(*) AS [Total Count]
// //       FROM OPOR PO
// //       JOIN POR1 R1 ON PO.DocEntry = R1.DocEntry
// //       JOIN PDN1 D1 ON R1.DocEntry = D1.BaseEntry AND R1.LineNum = D1.BaseLine
// //       JOIN OPDN ON D1.DocEntry = OPDN.DocEntry
// //       INNER JOIN OCRD C ON PO.CardCode = C.CardCode
// //       LEFT JOIN OCPR CP ON PO.CntctCode = CP.CntctCode
// //       LEFT JOIN OSLP T5 ON PO.SlpCode = T5.SlpCode
// //       LEFT JOIN OITM ITM ON R1.ItemCode = ITM.ItemCode
// //       LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
// //       WHERE ${whereSQL}
// //       GROUP BY 
// //         FORMAT(PO.DocDate, 'yyyy-MM'),
// //         YEAR(PO.DocDate),
// //         MONTH(PO.DocDate),
// //         CASE 
// //           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) <= 3 THEN '0-3 days'
// //           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
// //           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
// //           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
// //           ELSE '10+ days'
// //         END
// //       ORDER BY [Year], [MonthNumber], [Bucket];
// //     `;

// //     const results = await queryDatabase(query, params);

// //     // Calculate percentages
// //     const monthMap = {};
// //     results.forEach(row => {
// //       const key = row.Month;
// //       if (!monthMap[key]) monthMap[key] = { total: 0, rows: [] };
// //       monthMap[key].total += parseInt(row['Total Count']) || 0;
// //       monthMap[key].rows.push(row);
// //     });

// //     const formattedResults = [];
// //     Object.values(monthMap).forEach(({ total, rows }) => {
// //       rows.forEach(row => {
// //         const count = parseInt(row['Total Count']) || 0;
// //         const percentage = total > 0 ? (count * 100.0) / total : 0;
// //         formattedResults.push({
// //           Type: row.Type,
// //           Month: row.Month,
// //           Year: parseInt(row.Year),
// //           MonthNumber: parseInt(row.MonthNumber),
// //           Bucket: row.Bucket,
// //           TotalCount: count,
// //           Percentage: parseFloat(percentage.toFixed(2))
// //         });
// //       });
// //     });

// //     res.status(200).json({ 
// //       success: true, 
// //       data: formattedResults,
// //       meta: {
// //         type: "PO to GRN",
// //         recordCount: formattedResults.length,
// //         filters: { slpName, cardCode, contactPerson, category },
// //       }
// //     });

// //   } catch (error) {
// //     console.error("Error in PO to GRN API:", error);
// //     res.status(500).json({
// //       success: false,
// //       error: "Failed to fetch PO to GRN data",
// //       message: error.message,
// //     });
// //   }
// // }


// // ✅ pages/api/order-lifecycle/po-to-grn.js
// import { queryDatabase } from "../../../lib/db";
// import sql from "mssql";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     const { slpName, customerName, contactPerson, category } = req.query;

//     // Build WHERE clause
//     const whereParts = ["OPDN.CANCELED = 'N'"];
//     const params = [];

//     if (slpName) {
//       whereParts.push("T5.SlpName = @slpName");
//       params.push({ name: "slpName", type: sql.NVarChar, value: slpName });
//     }
//     if (customerName) {
//       whereParts.push("C.CardName = @customerName");
//       params.push({ name: "customerName", type: sql.NVarChar, value: customerName });
//     }
//     if (contactPerson) {
//       whereParts.push("CP.Name = @contactPerson");
//       params.push({ name: "contactPerson", type: sql.NVarChar, value: contactPerson });
//     }
//     if (category) {
//       whereParts.push("ITB.ItmsGrpNam = @category");
//       params.push({ name: "category", type: sql.NVarChar, value: category });
//     }

//     const whereSQL = whereParts.join(" AND ");

//     // Main data query
//     const dataQuery = `
//       SELECT 
//         'PO to GRN' AS [Type],
//         FORMAT(PO.DocDate, 'yyyy-MM') AS [Month],
//         YEAR(PO.DocDate) AS [Year],
//         MONTH(PO.DocDate) AS [MonthNumber],
//         T5.SlpName AS [Sales Person],
//         CP.Name AS [Contact Person],
//         C.CardName AS [Customer Name],
//         ITB.ItmsGrpNam AS [Category],
//         CASE 
//           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) <= 3 THEN '0-3 days'
//           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
//           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
//           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
//           ELSE '10+ days'
//         END AS [Bucket],
//         COUNT(*) AS [Total Count]
//       FROM OPOR PO
//       JOIN POR1 R1 ON PO.DocEntry = R1.DocEntry
//       JOIN PDN1 D1 ON R1.DocEntry = D1.BaseEntry AND R1.LineNum = D1.BaseLine
//       JOIN OPDN ON D1.DocEntry = OPDN.DocEntry
//       INNER JOIN OCRD C ON PO.CardCode = C.CardCode
//       LEFT JOIN OCPR CP ON PO.CntctCode = CP.CntctCode
//       LEFT JOIN OSLP T5 ON PO.SlpCode = T5.SlpCode
//       LEFT JOIN OITM ITM ON R1.ItemCode = ITM.ItemCode
//       LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
//       WHERE ${whereSQL}
//       GROUP BY 
//         FORMAT(PO.DocDate, 'yyyy-MM'),
//         YEAR(PO.DocDate),
//         MONTH(PO.DocDate),
//         T5.SlpName,
//         CP.Name,
//         C.CardName,
//         ITB.ItmsGrpNam,
//         CASE 
//           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) <= 3 THEN '0-3 days'
//           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
//           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
//           WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
//           ELSE '10+ days'
//         END
//       ORDER BY [Year], [MonthNumber], [Bucket];
//     `;

//     // Unique values query (always get all unique values regardless of filters)
//     const uniqueQuery = `
//       SELECT DISTINCT
//         T5.SlpName AS [Sales Person],
//         CP.Name AS [Contact Person],
//         C.CardName AS [Customer Name],
//         ITB.ItmsGrpNam AS [Category]
//       FROM OPOR PO
//       JOIN POR1 R1 ON PO.DocEntry = R1.DocEntry
//       JOIN PDN1 D1 ON R1.DocEntry = D1.BaseEntry AND R1.LineNum = D1.BaseLine
//       JOIN OPDN ON D1.DocEntry = OPDN.DocEntry
//       INNER JOIN OCRD C ON PO.CardCode = C.CardCode
//       LEFT JOIN OCPR CP ON PO.CntctCode = CP.CntctCode
//       LEFT JOIN OSLP T5 ON PO.SlpCode = T5.SlpCode
//       LEFT JOIN OITM ITM ON R1.ItemCode = ITM.ItemCode
//       LEFT JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
//       WHERE OPDN.CANCELED = 'N'
//     `;

//     const [dataResults, uniqueResults] = await Promise.all([
//       queryDatabase(dataQuery, params),
//       queryDatabase(uniqueQuery, [])
//     ]);

//     // Calculate percentages
//     const monthMap = {};
//     dataResults.forEach(row => {
//       const key = row.Month;
//       if (!monthMap[key]) monthMap[key] = { total: 0, rows: [] };
//       monthMap[key].total += parseInt(row['Total Count']) || 0;
//       monthMap[key].rows.push(row);
//     });

//     const formattedResults = [];
//     Object.values(monthMap).forEach(({ total, rows }) => {
//       rows.forEach(row => {
//         const count = parseInt(row['Total Count']) || 0;
//         const percentage = total > 0 ? (count * 100.0) / total : 0;
//         formattedResults.push({
//           Type: row.Type,
//           Month: row.Month,
//           Year: parseInt(row.Year),
//           MonthNumber: parseInt(row.MonthNumber),
//           Bucket: row.Bucket,
//           TotalCount: count,
//           Percentage: parseFloat(percentage.toFixed(2))
//         });
//       });
//     });

//     // Extract unique values
//     const uniqueValues = {
//       salesPersons: [...new Set(uniqueResults.map(r => r['Sales Person']).filter(Boolean))].sort(),
//       contactPersons: [...new Set(uniqueResults.map(r => r['Contact Person']).filter(Boolean))].sort(),
//       customers: [...new Set(uniqueResults.map(r => r['Customer Name']).filter(Boolean))].sort(),
//       categories: [...new Set(uniqueResults.map(r => r['Category']).filter(Boolean))].sort()
//     };

//     res.status(200).json({ 
//       success: true, 
//       data: formattedResults,
//       uniqueValues,
//       meta: {
//         type: "PO to GRN",
//         recordCount: formattedResults.length,
//         filters: { slpName, customerName, contactPerson, category },
//       }
//     });

//   } catch (error) {
//     console.error("Error in PO to GRN API:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch PO to GRN data",
//       message: error.message,
//     });
//   }
// }


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