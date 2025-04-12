


// import { verify } from "jsonwebtoken";
// import sql from "mssql";
// import { queryDatabase } from "../../lib/db";
// import { getCache, setCache } from "../../lib/redis";

// export default async function handler(req, res) {
//   try {
//     const { year, slpCode, itmsGrpCod, itemCode } = req.query;
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

//     // Create a unique cache key based on query parameters and user permissions
//     const userIdentifier = decoded.isAdmin
//       ? "admin"
//       : decoded.cardCodes?.join("-") || "noCards";
//     const cacheKey = `sales-data:${userIdentifier}:${year || "all"}:${
//       slpCode || "all"
//     }:${itmsGrpCod || "all"}:${itemCode || "all"}`;

//     // Try to get data from cache first
//     const cachedResult = await getCache(cacheKey);
//     if (cachedResult) {
//       return res.status(200).json(cachedResult);
//     }

//     let baseQuery = `
//             SELECT 
//                 DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)),2) AS [Month-Year],
//                 YEAR(T0.DocDate) AS year,
//                 MONTH(T0.DocDate) AS monthNumber,
//                 ROUND(SUM(
//                     CASE 
//                         WHEN T1.InvQty = 0 THEN T1.LineTotal
//                         WHEN T4.Quantity IS NULL THEN T1.LineTotal
//                         ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity)
//                     END
//                 ), 2) AS TotalSales,
//                 ROUND(SUM(T1.GrossBuyPr * ISNULL(T4.Quantity, 0)), 2) AS TotalCOGS,
//                 ROUND(CASE 
//                     WHEN SUM(
//                         CASE 
//                             WHEN T1.InvQty = 0 THEN T1.LineTotal
//                             WHEN T4.Quantity IS NULL THEN T1.LineTotal
//                             ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity)
//                         END
//                     ) = 0 THEN 0
//                     ELSE 
//                         ((SUM(
//                             CASE 
//                                 WHEN T1.InvQty = 0 THEN T1.LineTotal
//                                 WHEN T4.Quantity IS NULL THEN T1.LineTotal
//                                 ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity)
//                             END
//                         ) - SUM(T1.GrossBuyPr * ISNULL(T4.Quantity, 0))) * 100.0 
//                         / SUM(
//                             CASE 
//                                 WHEN T1.InvQty = 0 THEN T1.LineTotal
//                                 WHEN T4.Quantity IS NULL THEN T1.LineTotal
//                                 ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity)
//                             END
//                         ))
//                 END, 2) AS GrossMarginPct
//             FROM OINV T0
//             INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//             LEFT JOIN DLN1 T2 
//                 ON T2.ItemCode = T1.ItemCode 
//                 AND T2.DocEntry = T1.BaseEntry 
//                 AND T1.BaseType = 15 
//                 AND T1.BaseLine = T2.LineNum
//             LEFT JOIN ODLN T3 
//                 ON T3.DocEntry = T2.DocEntry
//             LEFT JOIN IBT1 T4 
//                 ON T4.BsDocType = 17 
//                 AND T4.CardCode = T3.CardCode 
//                 AND T4.ItemCode = T2.ItemCode 
//                 AND T4.BaseNum = T3.DocNum 
//                 AND T4.BaseEntry = T3.DocEntry 
//                 AND T4.BaseType = 15 
//                 AND T4.BaseLinNum = T2.LineNum 
//                 AND T4.Direction = 1
//             INNER JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
//             INNER JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
//             WHERE T0.CANCELED = 'N'
//         `;

//     let whereClauses = [];
//     let params = [];

//     if (decoded.role !== "admin") {
//       if (decoded.cardCodes && decoded.cardCodes.length > 0) {
//         whereClauses.push(
//           `T0.CardCode IN (${decoded.cardCodes
//             .map((_, i) => `@cardCode${i}`)
//             .join(", ")})`
//         );
//         decoded.cardCodes.forEach((cardCode, i) => {
//           params.push({
//             name: `cardCode${i}`,
//             type: sql.VarChar,
//             value: cardCode,
//           });
//         });
//       } else if (decoded.contactCodes && decoded.contactCodes.length > 0) {
//         whereClauses.push(
//           `T0.SlpCode IN (${decoded.contactCodes
//             .map((_, i) => `@contactCode${i}`)
//             .join(", ")})`
//         );
//         decoded.contactCodes.forEach((contactCode, i) => {
//           params.push({
//             name: `contactCode${i}`,
//             type: sql.Int,
//             value: parseInt(contactCode),
//           });
//         });
//       } else {
//         return res
//           .status(403)
//           .json({ error: "No access: cardCodes or contactCodes not provided" });
//       }
//     }

//     if (year) {
//       whereClauses.push(`YEAR(T0.DocDate) = @year`);
//       params.push({ name: "year", type: sql.Int, value: parseInt(year) });
//     }

//     if (slpCode) {
//       whereClauses.push(`T0.SlpCode = @slpCode`);
//       params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
//     }

//     if (itmsGrpCod) {
//       whereClauses.push(`T6.ItmsGrpNam = @itmsGrpCod`);
//       params.push({ name: "itmsGrpCod", type: sql.VarChar, value: itmsGrpCod });
//     }

//     if (itemCode) {
//       whereClauses.push(`T5.ItemCode = @itemCode`);
//       params.push({ name: "itemCode", type: sql.VarChar, value: itemCode });
//     }

//     if (whereClauses.length > 0) {
//       baseQuery += ` AND ` + whereClauses.join(" AND ");
//     }

//     const fullQuery = `
//             ${baseQuery}
//             GROUP BY DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)),2),
//                      YEAR(T0.DocDate), MONTH(T0.DocDate)
//             ORDER BY YEAR(T0.DocDate), MONTH(T0.DocDate)
//         `;

//     const results = await queryDatabase(fullQuery, params);
//     const data = results.map((row) => ({
//       monthYear: row["Month-Year"],
//       year: row.year,
//       monthNumber: row.monthNumber,
//       totalSales: parseFloat(row.TotalSales) || 0,
//       totalCogs: parseFloat(row.TotalCOGS) || 0,
//       grossMarginPct: parseFloat(row.GrossMarginPct) || 0,
//     }));

//     // Use cached years if available, otherwise fetch them
//     const yearsCacheKey = "sales-data:available-years";
//     let availableYears = await getCache(yearsCacheKey);

//     if (!availableYears) {
//       const yearsQuery = `
//                 SELECT DISTINCT YEAR(DocDate) as year
//                 FROM OINV
//                 WHERE CANCELED = 'N'
//                 ORDER BY year DESC
//             `;
//       const yearsResult = await queryDatabase(yearsQuery);
//       availableYears = yearsResult.map((row) => row.year);

//       // Cache the years for a longer period (24 hours) as they don't change frequently
//       await setCache(yearsCacheKey, availableYears, 86400);
//     }

//     const responseData = { data, availableYears };

//     // Cache the response data for 30 minutes
//     // Sales data can change but 30 minutes is typically a good balance
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

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../lib/db";
import { getCache, setCache } from "../../lib/redis";

export default async function handler(req, res) {
  try {
    const { year, slpCode, itmsGrpCod, itemCode } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
        received: authHeader,
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ error: "Token verification failed" });
    }

    const isAdmin = decoded.role === "admin";
    const contactCodes = decoded.contactCodes || [];
    const cardCodes = decoded.cardCodes || [];

    const userIdentifier = isAdmin
      ? "admin"
      : contactCodes.length
      ? contactCodes.join("-")
      : cardCodes.join("-");
    const cacheKey = `sales-data:${userIdentifier}:${year || "all"}:${
      slpCode || "all"
    }:${itmsGrpCod || "all"}:${itemCode || "all"}`;

    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    let baseQuery = `
      SELECT 
          DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)),2) AS [Month-Year],
          YEAR(T0.DocDate) AS year,
          MONTH(T0.DocDate) AS monthNumber,
          ROUND(SUM(
              CASE 
                  WHEN T1.InvQty = 0 THEN T1.LineTotal
                  WHEN T4.Quantity IS NULL THEN T1.LineTotal
                  ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity)
              END
          ), 2) AS TotalSales,
          ROUND(SUM(T1.GrossBuyPr * ISNULL(T4.Quantity, 0)), 2) AS TotalCOGS,
          ROUND(CASE 
              WHEN SUM(
                  CASE 
                      WHEN T1.InvQty = 0 THEN T1.LineTotal
                      WHEN T4.Quantity IS NULL THEN T1.LineTotal
                      ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity)
                  END
              ) = 0 THEN 0
              ELSE 
                  ((SUM(
                      CASE 
                          WHEN T1.InvQty = 0 THEN T1.LineTotal
                          WHEN T4.Quantity IS NULL THEN T1.LineTotal
                          ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity)
                      END
                  ) - SUM(T1.GrossBuyPr * ISNULL(T4.Quantity, 0))) * 100.0 
                  / SUM(
                      CASE 
                          WHEN T1.InvQty = 0 THEN T1.LineTotal
                          WHEN T4.Quantity IS NULL THEN T1.LineTotal
                          ELSE ((T1.LineTotal / T1.InvQty) * T4.Quantity)
                      END
                  ))
          END, 2) AS GrossMarginPct
      FROM OINV T0
      INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      LEFT JOIN DLN1 T2 
          ON T2.ItemCode = T1.ItemCode 
          AND T2.DocEntry = T1.BaseEntry 
          AND T1.BaseType = 15 
          AND T1.BaseLine = T2.LineNum
      LEFT JOIN ODLN T3 
          ON T3.DocEntry = T2.DocEntry
      LEFT JOIN IBT1 T4 
          ON T4.BsDocType = 17 
          AND T4.CardCode = T3.CardCode 
          AND T4.ItemCode = T2.ItemCode 
          AND T4.BaseNum = T3.DocNum 
          AND T4.BaseEntry = T3.DocEntry 
          AND T4.BaseType = 15 
          AND T4.BaseLinNum = T2.LineNum 
          AND T4.Direction = 1
      INNER JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      INNER JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      WHERE T0.CANCELED = 'N'
    `;

    let whereClauses = [];
    let params = [];

    if (!isAdmin) {
      if (contactCodes.length > 0) {
        whereClauses.push(
          `T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})`
        );
      } else if (cardCodes.length > 0) {
        whereClauses.push(
          `T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`
        );
      } else {
        return res
          .status(403)
          .json({ error: "No access: cardCodes or contactCodes not provided" });
      }
    }

    if (year) {
      whereClauses.push(`YEAR(T0.DocDate) = @year`);
      params.push({ name: "year", type: sql.Int, value: parseInt(year) });
    }

    if (slpCode) {
      whereClauses.push(`T0.SlpCode = @slpCode`);
      params.push({ name: "slpCode", type: sql.Int, value: parseInt(slpCode) });
    }

    if (itmsGrpCod) {
      whereClauses.push(`T6.ItmsGrpNam = @itmsGrpCod`);
      params.push({ name: "itmsGrpCod", type: sql.VarChar, value: itmsGrpCod });
    }

    if (itemCode) {
      whereClauses.push(`T5.ItemCode = @itemCode`);
      params.push({ name: "itemCode", type: sql.VarChar, value: itemCode });
    }

    if (whereClauses.length > 0) {
      baseQuery += ` AND ` + whereClauses.join(" AND ");
    }

    const fullQuery = `
      ${baseQuery}
      GROUP BY DATENAME(MONTH, T0.DocDate) + '-' + RIGHT(CONVERT(VARCHAR(4), YEAR(T0.DocDate)),2),
               YEAR(T0.DocDate), MONTH(T0.DocDate)
      ORDER BY YEAR(T0.DocDate), MONTH(T0.DocDate)
    `;

    const results = await queryDatabase(fullQuery, params);
    const data = results.map((row) => ({
      monthYear: row["Month-Year"],
      year: row.year,
      monthNumber: row.monthNumber,
      totalSales: parseFloat(row.TotalSales) || 0,
      totalCogs: parseFloat(row.TotalCOGS) || 0,
      grossMarginPct: parseFloat(row.GrossMarginPct) || 0,
    }));

    const yearsCacheKey = "sales-data:available-years";
    let availableYears = await getCache(yearsCacheKey);

    if (!availableYears) {
      const yearsQuery = `
        SELECT DISTINCT YEAR(DocDate) as year
        FROM OINV
        WHERE CANCELED = 'N'
        ORDER BY year DESC
      `;
      const yearsResult = await queryDatabase(yearsQuery);
      availableYears = yearsResult.map((row) => row.year);
      await setCache(yearsCacheKey, availableYears, 86400);
    }

    const responseData = { data, availableYears };
    await setCache(cacheKey, responseData, 1800);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
