// // pages/api/main-page/order-to-invoice.js

// // pages/api/main-page/order-to-invoice.js

// import { verify } from "jsonwebtoken";
// import sql from "mssql";
// import { queryDatabase } from "../../../lib/db";
// import { getCache, setCache } from "../../../lib/redis";

// export default async function handler(req, res) {
//   try {
//     const { year, slpCode, itmsGrpCod, itemCode, cntctCode, cardCode } = req.query;
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

//     const cacheKey = `order-to-invoice:${userIdentifier}:${year || "all"}:${
//       slpCode || "all"
//     }:${cardCode || "all"}:${cntctCode || "all"}:${itmsGrpCod || "all"}:${itemCode || "all"}`;

//     const cachedResult = await getCache(cacheKey);
//     if (cachedResult) {
//       return res.status(200).json(cachedResult);
//     }

//     // Your SQL query from the document
//     const orderToInvoiceQuery = `
//       WITH PO_GRN AS (
//           SELECT 
//               'PO to GRN' AS Type,
//               FORMAT(PO.DocDate, 'yyyy-MM') AS Month,
//               CASE 
//                   WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) < 0 THEN '0-3 days'
//                   WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) <= 3 THEN '0-3 days'
//                   WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
//                   WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
//                   WHEN DATEDIFF(DAY, PO.DocDate, OPDN.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
//                   ELSE '10+ days'
//               END AS Bucket,
//               YEAR(PO.DocDate) AS Year,
//               MONTH(PO.DocDate) AS MonthNumber
//           FROM OPOR PO
//           JOIN POR1 ON PO.DocEntry = POR1.DocEntry
//           JOIN PDN1 ON POR1.DocEntry = PDN1.BaseEntry AND POR1.LineNum = PDN1.BaseLine
//           JOIN OPDN ON PDN1.DocEntry = OPDN.DocEntry
//           WHERE OPDN.CANCELED = 'N'
//       ),
//       GRN_INV AS (
//           SELECT 
//               'GRN to Invoice' AS Type,
//               FORMAT(OPDN.DocDate, 'yyyy-MM') AS Month,
//               CASE 
//                   WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) < 0 THEN '0-3 days'
//                   WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) <= 3 THEN '0-3 days'
//                   WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
//                   WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
//                   WHEN DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
//                   ELSE '10+ days'
//               END AS Bucket,
//               YEAR(OPDN.DocDate) AS Year,
//               MONTH(OPDN.DocDate) AS MonthNumber
//           FROM OPDN
//           JOIN PDN1 ON OPDN.DocEntry = PDN1.DocEntry
//           JOIN INV1 ON PDN1.DocEntry = INV1.BaseEntry AND PDN1.LineNum = INV1.BaseLine
//           JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//           WHERE OINV.CANCELED = 'N'
//       ),
//       INV_DISP AS (
//           SELECT 
//               'Invoice to Dispatch' AS Type,
//               FORMAT(OINV.DocDate, 'yyyy-MM') AS Month,
//               CASE 
//                   WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) < 0 THEN '0-3 days'
//                   WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) <= 3 THEN '0-3 days'
//                   WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) BETWEEN 4 AND 5 THEN '4-5 days'
//                   WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) BETWEEN 6 AND 8 THEN '6-8 days'
//                   WHEN DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate) BETWEEN 9 AND 10 THEN '9-10 days'
//                   ELSE '10+ days'
//               END AS Bucket,
//               YEAR(OINV.DocDate) AS Year,
//               MONTH(OINV.DocDate) AS MonthNumber
//           FROM OINV
//           WHERE OINV.CANCELED = 'N' 
//             AND OINV.U_DispatchDate IS NOT NULL
//       ),
//       Combined AS (
//           SELECT * FROM PO_GRN
//           UNION ALL
//           SELECT * FROM GRN_INV
//           UNION ALL
//           SELECT * FROM INV_DISP
//       ),
//       BucketCounts AS (
//           SELECT 
//               Type,
//               Month,
//               Bucket,
//               Year,
//               MonthNumber,
//               COUNT(*) AS TotalCount
//           FROM Combined
//           GROUP BY Type, Month, Bucket, Year, MonthNumber
//       ),
//       BucketPercents AS (
//           SELECT 
//               Type,
//               Month,
//               Bucket,
//               Year,
//               MonthNumber,
//               TotalCount,
//               CAST(100.0 * TotalCount / SUM(TotalCount) OVER(PARTITION BY Type, Month) AS DECIMAL(5,2)) AS Percentage
//           FROM BucketCounts
//       )
//       SELECT 
//           Type,
//           Month,
//           Year,
//           MonthNumber,
//           Bucket,
//           TotalCount,
//           Percentage
//       FROM BucketPercents
//       ORDER BY Type, Year, MonthNumber;
//     `;

//     // Get available years for financial year dropdown
//     const yearsQuery = `
//       WITH AllDates AS (
//         SELECT YEAR(DocDate) as year FROM OPOR WHERE CANCELED = 'N'
//         UNION
//         SELECT YEAR(DocDate) as year FROM OPDN WHERE CANCELED = 'N'  
//         UNION
//         SELECT YEAR(DocDate) as year FROM OINV WHERE CANCELED = 'N'
//       )
//       SELECT DISTINCT year
//       FROM AllDates
//       ORDER BY year DESC
//     `;

//     const [orderToInvoiceResults, yearsResult] = await Promise.all([
//       queryDatabase(orderToInvoiceQuery),
//       queryDatabase(yearsQuery),
//     ]);

//     const availableYears = yearsResult.map((row) => row.year);

//     // Transform the data to the format expected by the frontend
//     const transformedData = [];
    
//     // Group by Type and Month
//     const groupedData = {};
    
//     orderToInvoiceResults.forEach(row => {
//       const key = `${row.Type}_${row.Month}`;
//       if (!groupedData[key]) {
//         groupedData[key] = {
//           type: row.Type,
//           month: row.Month,
//           year: row.Year,
//           monthNumber: row.MonthNumber,
//           buckets: {}
//         };
//       }
      
//       groupedData[key].buckets[row.Bucket] = {
//         count: row.TotalCount,
//         percentage: row.Percentage
//       };
//     });

//     // Convert to array and ensure all buckets are present
//     const bucketOrder = ['0-3 days', '4-5 days', '6-8 days', '9-10 days', '10+ days'];
    
//     Object.values(groupedData).forEach(item => {
//       const transformedItem = {
//         type: item.type,
//         month: item.month,
//         year: item.year,
//         monthNumber: item.monthNumber
//       };
      
//       // Add all buckets with default 0 values
//       bucketOrder.forEach(bucket => {
//         transformedItem[`${bucket}_count`] = item.buckets[bucket]?.count || 0;
//         transformedItem[`${bucket}_percentage`] = item.buckets[bucket]?.percentage || 0;
//       });
      
//       transformedData.push(transformedItem);
//     });

//     const responseData = { 
//       data: transformedData, 
//       availableYears 
//     };
    
//     await setCache(cacheKey, responseData, 1800);

//     return res.status(200).json(responseData);
//   } catch (error) {
//     console.error("API handler error:", error);
//     return res.status(500).json({
//       error: "Internal server error",
//       details: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// }


// pages/api/main-page/order-to-invoice.js
import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../../lib/db";
import { getCache, setCache } from "../../../lib/redis";

export default async function handler(req, res) {
  try {
    const { year, slpCode, itmsGrpCod, itemCode, cntctCode, cardCode } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
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

    const cacheKey = `order-to-invoice:${userIdentifier}:${year || "all"}:${slpCode || "all"}:${cardCode || "all"}:${cntctCode || "all"}:${itmsGrpCod || "all"}:${itemCode || "all"}`;
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) return res.status(200).json(cachedResult);

    const filters = [];
    if (!isAdmin) {
      if (contactCodes.length > 0) filters.push(`T0.SlpCode IN (${contactCodes.map(c => `'${c}'`).join(",")})`);
      else if (cardCodes.length > 0) filters.push(`T0.CardCode IN (${cardCodes.map(c => `'${c}'`).join(",")})`);
      else return res.status(403).json({ error: "No access" });
    }
    if (year) filters.push(`YEAR(T0.DocDate) = ${parseInt(year)}`);
    if (slpCode) filters.push(`T0.SlpCode = ${parseInt(slpCode)}`);
    if (cntctCode) filters.push(`T0.CntctCode = ${parseInt(cntctCode)}`);
    if (itmsGrpCod) filters.push(`T3.ItmsGrpCod = ${parseInt(itmsGrpCod)}`);
    if (cardCode) filters.push(`T0.CardCode = '${cardCode}'`);
    if (itemCode) filters.push(`T1.ItemCode = '${itemCode}'`);

    const whereSQL = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const query = `
      WITH PO_GRN AS (
        SELECT 'PO to GRN' AS Type, FORMAT(PO.DocDate,'yyyy-MM') AS Month,
          CASE WHEN DATEDIFF(DAY,PO.DocDate,OPDN.DocDate)<=3 THEN '0-3 days'
               WHEN DATEDIFF(DAY,PO.DocDate,OPDN.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
               WHEN DATEDIFF(DAY,PO.DocDate,OPDN.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
               WHEN DATEDIFF(DAY,PO.DocDate,OPDN.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
               ELSE '10+ days' END AS Bucket,
          YEAR(PO.DocDate) AS Year, MONTH(PO.DocDate) AS MonthNumber
        FROM OPOR PO
        JOIN POR1 ON PO.DocEntry=POR1.DocEntry
        JOIN PDN1 ON POR1.DocEntry=PDN1.BaseEntry AND POR1.LineNum=PDN1.BaseLine
        JOIN OPDN ON PDN1.DocEntry=OPDN.DocEntry
        WHERE OPDN.CANCELED='N'
      ),
      GRN_INV AS (
        SELECT 'GRN to Invoice' AS Type, FORMAT(OPDN.DocDate,'yyyy-MM') AS Month,
          CASE WHEN DATEDIFF(DAY,OPDN.DocDate,OINV.DocDate)<=3 THEN '0-3 days'
               WHEN DATEDIFF(DAY,OPDN.DocDate,OINV.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
               WHEN DATEDIFF(DAY,OPDN.DocDate,OINV.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
               WHEN DATEDIFF(DAY,OPDN.DocDate,OINV.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
               ELSE '10+ days' END AS Bucket,
          YEAR(OPDN.DocDate) AS Year, MONTH(OPDN.DocDate) AS MonthNumber
        FROM OPDN
        JOIN PDN1 ON OPDN.DocEntry=PDN1.DocEntry
        JOIN INV1 ON PDN1.DocEntry=INV1.BaseEntry AND PDN1.LineNum=INV1.BaseLine
        JOIN OINV ON INV1.DocEntry=OINV.DocEntry
        WHERE OINV.CANCELED='N'
      ),
      INV_DISP AS (
        SELECT 'Invoice to Dispatch' AS Type, FORMAT(OINV.DocDate,'yyyy-MM') AS Month,
          CASE WHEN DATEDIFF(DAY,OINV.DocDate,OINV.U_DispatchDate)<=3 THEN '0-3 days'
               WHEN DATEDIFF(DAY,OINV.DocDate,OINV.U_DispatchDate) BETWEEN 4 AND 5 THEN '4-5 days'
               WHEN DATEDIFF(DAY,OINV.DocDate,OINV.U_DispatchDate) BETWEEN 6 AND 8 THEN '6-8 days'
               WHEN DATEDIFF(DAY,OINV.DocDate,OINV.U_DispatchDate) BETWEEN 9 AND 10 THEN '9-10 days'
               ELSE '10+ days' END AS Bucket,
          YEAR(OINV.DocDate) AS Year, MONTH(OINV.DocDate) AS MonthNumber
        FROM OINV WHERE OINV.CANCELED='N' AND OINV.U_DispatchDate IS NOT NULL
      ),
      ORD_INV AS (
        SELECT 'Order to Invoice' AS Type, FORMAT(T0.DocDate,'yyyy-MM') AS Month,
          CASE WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate)<=3 THEN '0-3 days'
               WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) BETWEEN 4 AND 5 THEN '4-5 days'
               WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) BETWEEN 6 AND 8 THEN '6-8 days'
               WHEN DATEDIFF(DAY,T0.DocDate,OINV.DocDate) BETWEEN 9 AND 10 THEN '9-10 days'
               ELSE '10+ days' END AS Bucket,
          YEAR(T0.DocDate) AS Year, MONTH(T0.DocDate) AS MonthNumber
        FROM ORDR T0
        JOIN RDR1 T1 ON T0.DocEntry=T1.DocEntry
        JOIN INV1 ON T1.DocEntry=INV1.BaseEntry AND T1.LineNum=INV1.BaseLine
        JOIN OINV ON INV1.DocEntry=OINV.DocEntry
        ${whereSQL}
      ),
      Combined AS (
        SELECT * FROM PO_GRN UNION ALL
        SELECT * FROM GRN_INV UNION ALL
        SELECT * FROM INV_DISP UNION ALL
        SELECT * FROM ORD_INV
      ),
      BucketCounts AS (
        SELECT Type,Month,Bucket,Year,MonthNumber,COUNT(*) AS TotalCount
        FROM Combined GROUP BY Type,Month,Bucket,Year,MonthNumber
      ),
      BucketPercents AS (
        SELECT Type,Month,Bucket,Year,MonthNumber,TotalCount,
          CAST(100.0*TotalCount/SUM(TotalCount) OVER(PARTITION BY Type,Month) AS DECIMAL(5,2)) AS Percentage
        FROM BucketCounts
      )
      SELECT Type,Month,Year,MonthNumber,Bucket,TotalCount,Percentage
      FROM BucketPercents ORDER BY Type,Year,MonthNumber;
    `;

    const yearsQuery = `
      WITH AllDates AS (
        SELECT YEAR(DocDate) as year FROM OPOR WHERE CANCELED='N'
        UNION SELECT YEAR(DocDate) as year FROM OPDN WHERE CANCELED='N'
        UNION SELECT YEAR(DocDate) as year FROM OINV WHERE CANCELED='N'
        UNION SELECT YEAR(DocDate) as year FROM ORDR WHERE CANCELED='N'
      )
      SELECT DISTINCT year FROM AllDates ORDER BY year DESC
    `;

    const [rows, yearsResult] = await Promise.all([queryDatabase(query), queryDatabase(yearsQuery)]);
    const availableYears = yearsResult.map(r => r.year);

    const grouped = {};
    rows.forEach(r => {
      const key = `${r.Type}_${r.Month}`;
      if (!grouped[key]) {
        grouped[key] = { type: r.Type, month: r.Month, year: r.Year, monthNumber: r.MonthNumber, buckets: {} };
      }
      grouped[key].buckets[r.Bucket] = { count: r.TotalCount, percentage: r.Percentage };
    });

    const bucketOrder = ['0-3 days','4-5 days','6-8 days','9-10 days','10+ days'];
    const transformed = Object.values(grouped).map(item => {
      const obj = { type:item.type, month:item.month, year:item.year, monthNumber:item.monthNumber };
      bucketOrder.forEach(b => {
        obj[`${b}_count`] = item.buckets[b]?.count || 0;
        obj[`${b}_percentage`] = item.buckets[b]?.percentage || 0;
      });
      return obj;
    });

    const responseData = { data: transformed, availableYears };
    await setCache(cacheKey, responseData, 1800);
    res.status(200).json(responseData);

  } catch (error) {
    console.error("API handler error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
