// // import { verify } from "jsonwebtoken";
// // import sql from "mssql";
// // import { queryDatabase } from "../../../lib/db";
// // import { getCache, setCache } from "../../../lib/redis";

// // export default async function handler(req, res) {
// //   try {
// //     const { year, slpCode, region, state } = req.query;
// //     const authHeader = req.headers.authorization;

// //     if (!authHeader || !authHeader.startsWith("Bearer ")) {
// //       return res.status(401).json({
// //         error: "Missing or malformed Authorization header",
// //         received: authHeader,
// //       });
// //     }

// //     const token = authHeader.split(" ")[1];
// //     let decoded;

// //     try {
// //       decoded = verify(token, process.env.JWT_SECRET);
// //     } catch (verifyError) {
// //       console.error("Token verification failed:", verifyError);
// //       return res.status(401).json({ error: "Token verification failed" });
// //     }

// //     const isAdmin = decoded.role === "admin";
// //     const contactCodes = decoded.contactCodes || [];
// //     const cardCodes = decoded.cardCodes || [];

// //     const userIdentifier = isAdmin
// //       ? "admin"
// //       : contactCodes.length
// //         ? contactCodes.join("-")
// //         : cardCodes.join("-");
    
// //     const cacheKey = `target-analytics:quarterly:${userIdentifier}:${year || "all"}:${slpCode || "all"}:${region || "all"}:${state || "all"}`;

// //     const cachedResult = await getCache(cacheKey);
// //     if (cachedResult) {
// //       return res.status(200).json(cachedResult);
// //     }

// //     // Build WHERE clauses for the dynamic SQL
// //     const whereClauses = ["T0.CANCELED = ''N''", "T0.[IssReason] <> ''4''"];

// //     if (!isAdmin) {
// //       if (contactCodes.length > 0) {
// //         whereClauses.push(
// //           `T0.SlpCode IN (${contactCodes.map((code) => `''${code}''`).join(",")})`
// //         );
// //       } else if (cardCodes.length > 0) {
// //         whereClauses.push(
// //           `T0.CardCode IN (${cardCodes.map((code) => `''${code}''`).join(",")})`
// //         );
// //       } else {
// //         return res.status(403).json({
// //           error: "No access: cardCodes or contactCodes not provided",
// //         });
// //       }
// //     }

// //     // Filter by year if provided and not "Complete"
// //     if (year && year !== "Complete") {
// //       const fyYear = parseInt(year.split(" ")[1].split("-")[0]);
// //       whereClauses.push(
// //         `((YEAR(T0.DocDate) = ${fyYear} AND MONTH(T0.DocDate) >= 4) OR (YEAR(T0.DocDate) = ${fyYear + 1} AND MONTH(T0.DocDate) <= 3))`
// //       );
// //     }

// //     // Filter by sales person
// //     if (slpCode) {
// //       whereClauses.push(`T0.SlpCode = ${parseInt(slpCode)}`);
// //     }

// //     // Build region/state filter
// //     let regionStateJoin = "";
// //     let regionStateFilter = "";
    
// //     if (region || state) {
// //       regionStateJoin = `
// //         JOIN OCRD C ON T0.CardCode = C.CardCode
// //         OUTER APPLY (
// //           SELECT TOP 1 State, Country
// //           FROM CRD1 
// //           WHERE CardCode = C.CardCode AND AdresType = ''B''
// //           ORDER BY Address
// //         ) AS C1
// //       `;

// //       if (region) {
// //         const regionStateMapping = {
// //           "Overseas": "ISNULL(C1.Country, '''') <> ''IN''",
// //           "Central": "C1.State IN (''AP'', ''TE'')",
// //           "South": "C1.State IN (''KL'', ''KT'', ''TN'', ''PC'')",
// //           "West 1": "C1.State IN (''MH'', ''GO'', ''DN'')",
// //           "West 2": "C1.State = ''GJ''",
// //           "North": "C1.State IN (''DL'', ''HR'', ''HP'', ''PU'', ''RJ'', ''UP'', ''UT'', ''MP'', ''CH'')",
// //           "East": "C1.State IN (''WB'', ''JH'', ''AS'', ''ME'')"
// //         };
        
// //         if (regionStateMapping[region]) {
// //           regionStateFilter = regionStateMapping[region];
// //         }
// //       }

// //       if (state) {
// //         if (state === "Overseas") {
// //           regionStateFilter = "ISNULL(C1.Country, '''') <> ''IN''";
// //         } else {
// //           const stateCodeMapping = {
// //             "Telangana": "TE", "Maharashtra": "MH", "Tamil Nadu": "TN",
// //             "Uttar Pradesh": "UP", "Gujarat": "GJ", "Karnataka": "KT",
// //             "Madhya Pradesh": "MP", "West Bengal": "WB", "Delhi": "DL",
// //             "Goa": "GO", "Andhra Pradesh": "AP", "Punjab": "PU",
// //             "Haryana": "HR", "Rajasthan": "RJ", "Jharkhand": "JH",
// //             "Kerala": "KL", "Uttarakhand": "UT", "Assam": "AS",
// //             "Himachal Pradesh": "HP", "Chandigarh": "CH"
// //           };
          
// //           if (stateCodeMapping[state]) {
// //             regionStateFilter = `C1.State = ''${stateCodeMapping[state]}''`;
// //           }
// //         }
// //       }

// //       if (regionStateFilter) {
// //         whereClauses.push(regionStateFilter);
// //       }
// //     }

// //     const whereSQL = whereClauses.join(" AND ");

// //     // Build the complete dynamic query
// //     const query = `
// //       DECLARE @sql NVARCHAR(MAX);
// //       DECLARE @cols NVARCHAR(MAX);

// //       SELECT @cols = STRING_AGG(
// //         QUOTENAME(ItmsGrpNam + '_Sales') + ', ' + QUOTENAME(ItmsGrpNam + '_Margin'),
// //         ', '
// //       )
// //       FROM (
// //         SELECT DISTINCT ItmsGrpNam FROM OITB
// //       ) AS Categories;

// //       SET @sql = '
// //       WITH BaseData AS (
// //         SELECT 
// //           YEAR(T0.DocDate) AS Year,
// //           DATENAME(MONTH, T0.DocDate) AS Month,
// //           MONTH(T0.DocDate) AS MonthNumber,
// //           T6.ItmsGrpNam AS Category,
// //           SUM(T1.LineTotal) AS Sales,
// //           CASE 
// //             WHEN SUM(T1.LineTotal) = 0 THEN 0
// //             ELSE ROUND(
// //               ((SUM(T1.LineTotal) - SUM(T1.GrossBuyPr * T1.Quantity)) * 100.0) / SUM(T1.LineTotal),
// //               2
// //             )
// //           END AS Margin
// //         FROM OINV T0
// //         JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
// //         JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
// //         JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
// //         ${regionStateJoin}
// //         WHERE ${whereSQL}
// //         GROUP BY YEAR(T0.DocDate), MONTH(T0.DocDate), DATENAME(MONTH, T0.DocDate), T6.ItmsGrpNam
// //       ),
// //       Unpivoted AS (
// //         SELECT 
// //           Year,
// //           Month,
// //           MonthNumber,
// //           Category + ''_Sales'' AS Metric,
// //           Sales AS Value
// //         FROM BaseData
// //         UNION ALL
// //         SELECT 
// //           Year,
// //           Month,
// //           MonthNumber,
// //           Category + ''_Margin'' AS Metric,
// //           Margin AS Value
// //         FROM BaseData
// //       )
// //       SELECT 
// //         Year,
// //         Month,
// //         MonthNumber,
// //         ' + @cols + '
// //       FROM Unpivoted
// //       PIVOT (
// //         MAX(Value)
// //         FOR Metric IN (' + @cols + ')
// //       ) AS PivotTable
// //       ORDER BY Year, MonthNumber;
// //       ';

// //       EXEC sp_executesql @sql;
// //     `;

// //     const results = await queryDatabase(query, []);

// //     const responseData = { data: results };
// //     await setCache(cacheKey, responseData, 1800);

// //     return res.status(200).json(responseData);
// //   } catch (error) {
// //     console.error("API handler error:", error);
// //     return res.status(500).json({
// //       error: "Internal server error",
// //       details:
// //         process.env.NODE_ENV === "development" ? error.message : undefined,
// //     });
// //   }
// // }

// import { verify } from "jsonwebtoken";
// import sql from "mssql";
// import { queryDatabase } from "../../../lib/db";
// import { getCache, setCache } from "../../../lib/redis";

// export default async function handler(req, res) {
//   try {
//     const { year, slpCode, region, state } = req.query;
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

//     const isAdmin = decoded.role === "admin";
//     const contactCodes = decoded.contactCodes || [];
//     const cardCodes = decoded.cardCodes || [];

//     const userIdentifier = isAdmin
//       ? "admin"
//       : contactCodes.length
//         ? contactCodes.join("-")
//         : cardCodes.join("-");
    
//     const cacheKey = `target-analytics:quarterly:${userIdentifier}:${year || "all"}:${slpCode || "all"}:${region || "all"}:${state || "all"}`;

//     const cachedResult = await getCache(cacheKey);
//     if (cachedResult) {
//       return res.status(200).json(cachedResult);
//     }

//     // Build WHERE clauses for the dynamic SQL
//     const whereClauses = ["T0.CANCELED = N''N''", "T0.[IssReason] <> N''4''"];

//     if (!isAdmin) {
//       if (contactCodes.length > 0) {
//         whereClauses.push(
//           `T0.SlpCode IN (${contactCodes.map((code) => parseInt(code)).join(",")})`
//         );
//       } else if (cardCodes.length > 0) {
//         whereClauses.push(
//           `T0.CardCode IN (${cardCodes.map((code) => `N''''${code}''''`).join(",")})`
//         );
//       } else {
//         return res.status(403).json({
//           error: "No access: cardCodes or contactCodes not provided",
//         });
//       }
//     }

//     // Filter by year if provided and not "Complete"
//     if (year && year !== "Complete") {
//       const fyYear = parseInt(year.split(" ")[1].split("-")[0]);
//       whereClauses.push(
//         `((YEAR(T0.DocDate) = ${fyYear} AND MONTH(T0.DocDate) >= 4) OR (YEAR(T0.DocDate) = ${fyYear + 1} AND MONTH(T0.DocDate) <= 3))`
//       );
//     }

//     // Filter by sales person
//     if (slpCode) {
//       whereClauses.push(`T0.SlpCode = ${parseInt(slpCode)}`);
//     }

//     // Build region/state filter
//     let regionStateJoin = "";
//     let regionStateFilter = "";
    
//     if (region || state) {
//       regionStateJoin = `
//         JOIN OCRD C ON T0.CardCode = C.CardCode
//         OUTER APPLY (
//           SELECT TOP 1 State, Country
//           FROM CRD1 
//           WHERE CardCode = C.CardCode AND AdresType = N''''B''''
//           ORDER BY Address
//         ) AS C1
//       `;

//       if (region) {
//         const regionStateMapping = {
//           "Overseas": "ISNULL(C1.Country, N'''''''') <> N''''IN''''",
//           "Central": "C1.State IN (N''''AP'''', N''''TE'''')",
//           "South": "C1.State IN (N''''KL'''', N''''KT'''', N''''TN'''', N''''PC'''')",
//           "West 1": "C1.State IN (N''''MH'''', N''''GO'''', N''''DN'''')",
//           "West 2": "C1.State = N''''GJ''''",
//           "North": "C1.State IN (N''''DL'''', N''''HR'''', N''''HP'''', N''''PU'''', N''''RJ'''', N''''UP'''', N''''UT'''', N''''MP'''', N''''CH'''')",
//           "East": "C1.State IN (N''''WB'''', N''''JH'''', N''''AS'''', N''''ME'''')"
//         };
        
//         if (regionStateMapping[region]) {
//           regionStateFilter = regionStateMapping[region];
//         }
//       }

//       if (state) {
//         if (state === "Overseas") {
//           regionStateFilter = "ISNULL(C1.Country, N'''''''') <> N''''IN''''";
//         } else {
//           const stateCodeMapping = {
//             "Telangana": "TE", "Maharashtra": "MH", "Tamil Nadu": "TN",
//             "Uttar Pradesh": "UP", "Gujarat": "GJ", "Karnataka": "KT",
//             "Madhya Pradesh": "MP", "West Bengal": "WB", "Delhi": "DL",
//             "Goa": "GO", "Andhra Pradesh": "AP", "Punjab": "PU",
//             "Haryana": "HR", "Rajasthan": "RJ", "Jharkhand": "JH",
//             "Kerala": "KL", "Uttarakhand": "UT", "Assam": "AS",
//             "Himachal Pradesh": "HP", "Chandigarh": "CH"
//           };
          
//           if (stateCodeMapping[state]) {
//             regionStateFilter = `C1.State = N''''${stateCodeMapping[state]}''''`;
//           }
//         }
//       }

//       if (regionStateFilter) {
//         whereClauses.push(regionStateFilter);
//       }
//     }

//     const whereSQL = whereClauses.join(" AND ");

//     // Build the complete dynamic query
//     const query = `
//       DECLARE @sql NVARCHAR(MAX);
//       DECLARE @cols NVARCHAR(MAX);

//       SELECT @cols = STRING_AGG(
//         QUOTENAME(ItmsGrpNam + '_Sales') + ', ' + QUOTENAME(ItmsGrpNam + '_Margin'),
//         ', '
//       )
//       FROM (
//         SELECT DISTINCT ItmsGrpNam FROM OITB
//       ) AS Categories;

//       SET @sql = N'
//       WITH BaseData AS (
//         SELECT 
//           YEAR(T0.DocDate) AS Year,
//           DATENAME(MONTH, T0.DocDate) AS Month,
//           MONTH(T0.DocDate) AS MonthNumber,
//           T6.ItmsGrpNam AS Category,
//           SUM(T1.LineTotal) AS Sales,
//           CASE 
//             WHEN SUM(T1.LineTotal) = 0 THEN 0
//             ELSE ROUND(
//               ((SUM(T1.LineTotal) - SUM(T1.GrossBuyPr * T1.Quantity)) * 100.0) / SUM(T1.LineTotal),
//               2
//             )
//           END AS Margin
//         FROM OINV T0
//         JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//         JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
//         JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
//         ${regionStateJoin}
//         WHERE ${whereSQL}
//         GROUP BY YEAR(T0.DocDate), MONTH(T0.DocDate), DATENAME(MONTH, T0.DocDate), T6.ItmsGrpNam
//       ),
//       Unpivoted AS (
//         SELECT 
//           Year,
//           Month,
//           MonthNumber,
//           Category + ''_Sales'' AS Metric,
//           Sales AS Value
//         FROM BaseData
//         UNION ALL
//         SELECT 
//           Year,
//           Month,
//           MonthNumber,
//           Category + ''_Margin'' AS Metric,
//           Margin AS Value
//         FROM BaseData
//       )
//       SELECT 
//         Year,
//         Month,
//         MonthNumber,
//         ' + @cols + N'
//       FROM Unpivoted
//       PIVOT (
//         MAX(Value)
//         FOR Metric IN (' + @cols + N')
//       ) AS PivotTable
//       ORDER BY Year, MonthNumber;
//       ';

//       EXEC sp_executesql @sql;
//     `;

//     const results = await queryDatabase(query, []);

//     const responseData = { data: results };
//     await setCache(cacheKey, responseData, 1800);

//     return res.status(200).json(responseData);
//   } catch (error) {
//     console.error("API handler error:", error);
//     return res.status(500).json({
//       error: "Internal server error",
//       details:
//         process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// }


import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const { year, slpCode, region, state } = req.query;

    // Build WHERE clauses
    const whereClauses = ["T0.CANCELED = 'N'", "T0.[IssReason] <> '4'"];

    // Filter by year if provided and not "Complete"
    if (year && year !== "Complete") {
      const fyYear = parseInt(year.split(" ")[1].split("-")[0]);
      whereClauses.push(
        `((YEAR(T0.DocDate) = ${fyYear} AND MONTH(T0.DocDate) >= 4) OR (YEAR(T0.DocDate) = ${fyYear + 1} AND MONTH(T0.DocDate) <= 3))`
      );
    }

    // Filter by sales person
    if (slpCode) {
      whereClauses.push(`T0.SlpCode = ${parseInt(slpCode)}`);
    }

    // Build region/state filter
    let regionStateJoin = "";
    let regionStateFilter = "";
    
    if (region || state) {
      regionStateJoin = `
        JOIN OCRD C ON T0.CardCode = C.CardCode
        OUTER APPLY (
          SELECT TOP 1 State, Country
          FROM CRD1 
          WHERE CardCode = C.CardCode AND AdresType = 'B'
          ORDER BY Address
        ) AS C1
      `;

      if (region) {
        const regionStateMapping = {
          "Overseas": "ISNULL(C1.Country, '') <> 'IN'",
          "Central": "C1.State IN ('AP', 'TE')",
          "South": "C1.State IN ('KL', 'KT', 'TN', 'PC')",
          "West 1": "C1.State IN ('MH', 'GO', 'DN')",
          "West 2": "C1.State = 'GJ'",
          "North": "C1.State IN ('DL', 'HR', 'HP', 'PU', 'RJ', 'UP', 'UT', 'MP', 'CH')",
          "East": "C1.State IN ('WB', 'JH', 'AS', 'ME')"
        };
        
        if (regionStateMapping[region]) {
          regionStateFilter = regionStateMapping[region];
        }
      }

      if (state) {
        if (state === "Overseas") {
          regionStateFilter = "ISNULL(C1.Country, '') <> 'IN'";
        } else {
          const stateCodeMapping = {
            "Telangana": "TE", "Maharashtra": "MH", "Tamil Nadu": "TN",
            "Uttar Pradesh": "UP", "Gujarat": "GJ", "Karnataka": "KT",
            "Madhya Pradesh": "MP", "West Bengal": "WB", "Delhi": "DL",
            "Goa": "GO", "Andhra Pradesh": "AP", "Punjab": "PU",
            "Haryana": "HR", "Rajasthan": "RJ", "Jharkhand": "JH",
            "Kerala": "KL", "Uttarakhand": "UT", "Assam": "AS",
            "Himachal Pradesh": "HP", "Chandigarh": "CH"
          };
          
          if (stateCodeMapping[state]) {
            regionStateFilter = `C1.State = '${stateCodeMapping[state]}'`;
          }
        }
      }

      if (regionStateFilter) {
        whereClauses.push(regionStateFilter);
      }
    }

    const whereSQL = whereClauses.join(" AND ");

    // Simple query that returns flat data
    const query = `
      SELECT 
        YEAR(T0.DocDate) AS Year,
        MONTH(T0.DocDate) AS MonthNumber,
        DATENAME(MONTH, T0.DocDate) AS Month,
        T6.ItmsGrpNam AS Category,
        SUM(T1.LineTotal) AS Sales,
        CASE 
          WHEN SUM(T1.LineTotal) = 0 THEN 0
          ELSE ROUND(
            ((SUM(T1.LineTotal) - SUM(T1.GrossBuyPr * T1.Quantity)) * 100.0) / SUM(T1.LineTotal),
            2
          )
        END AS Margin
      FROM OINV T0
      JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      ${regionStateJoin}
      WHERE ${whereSQL}
      GROUP BY YEAR(T0.DocDate), MONTH(T0.DocDate), DATENAME(MONTH, T0.DocDate), T6.ItmsGrpNam
      ORDER BY Year DESC, MonthNumber DESC
    `;

    const results = await queryDatabase(query, []);

    // Pivot the data in JavaScript
    const pivotedData = {};
    
    results.forEach(row => {
      const key = `${row.Year}-${row.MonthNumber}`;
      if (!pivotedData[key]) {
        pivotedData[key] = {
          Year: row.Year,
          Month: row.Month,
          MonthNumber: row.MonthNumber
        };
      }
      
      // Add category sales and margin
      pivotedData[key][`${row.Category}_Sales`] = row.Sales || 0;
      pivotedData[key][`${row.Category}_Margin`] = row.Margin || 0;
    });

    // Convert to array
    const transformedResults = Object.values(pivotedData);

    return res.status(200).json({ data: transformedResults });
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}