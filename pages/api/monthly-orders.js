

// import { verify } from 'jsonwebtoken';
// import sql from 'mssql';
// import { queryDatabase } from '../../lib/db';
// import { getCache, setCache } from '../../lib/redis';

// export default async function handler(req, res) {
//     try {
//         const { year, slpCode, itmsGrpCod, itemCode, cardCode, contactPerson } = req.query;
//         const authHeader = req.headers.authorization;

//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.status(401).json({ error: 'Missing or malformed Authorization header' });
//         }

//         const token = authHeader.split(' ')[1];
//         let decoded;
//         try {
//             decoded = verify(token, process.env.JWT_SECRET);
//         } catch (verifyError) {
//             console.error('Token verification failed:', verifyError);
//             return res.status(401).json({ error: 'Token verification failed' });
//         }

//         const isAdmin = decoded.role === 'admin';
//         const contactCodes = decoded.contactCodes || [];
//         const cardCodes = decoded.cardCodes || [];

//         const cacheKey = `monthly-orders:${year || 'all'}:${slpCode || 'all'}:${itmsGrpCod || 'all'}:${itemCode || 'all'}:${cardCode || 'all'}:${contactPerson || 'all'}:${isAdmin ? 'admin' : contactCodes.join(',')}`;

//         const cachedData = await getCache(cacheKey);
//         if (cachedData) {
//             return res.status(200).json(cachedData);
//         }

//         // Build the base query with CTE to pre-calculate order status
//         let baseQuery = `
//             WITH OrderStatusCTE AS (
//                 SELECT 
//                     T0.DocEntry,
//                     T0.DocDate,
//                     T0.DocTotal,
//                     CASE 
//                         WHEN (
//                             T0.DocStatus = 'O'
//                             AND EXISTS (
//                                 SELECT 1
//                                 FROM RDR1 T1
//                                 LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                                                AND T1.LineNum = DLN1.BaseLine
//                                                AND DLN1.BaseType = 17
//                                 LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                                                AND DLN1.LineNum = INV1.BaseLine
//                                                AND INV1.BaseType = 15
//                                 LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                                                AND OINV.CANCELED = 'N'
//                                 WHERE T1.DocEntry = T0.DocEntry
//                                   AND OINV.DocNum IS NOT NULL
//                                   AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
//                             )
//                             AND EXISTS (
//                                 SELECT 1
//                                 FROM RDR1 T1
//                                 LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry
//                                                AND T1.LineNum = DLN1.BaseLine
//                                                AND DLN1.BaseType = 17
//                                 LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry
//                                                AND DLN1.LineNum = INV1.BaseLine
//                                                AND INV1.BaseType = 15
//                                 LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry
//                                                AND OINV.CANCELED = 'N'
//                                 WHERE T1.DocEntry = T0.DocEntry
//                                   AND (
//                                     OINV.DocNum IS NULL
//                                     OR CAST(OINV.DocNum AS VARCHAR) = 'N/A'
//                                   )
//                             )
//                         )
//                         THEN 'Partial'
//                         WHEN (T0.DocStatus='C' AND T0.CANCELED='N') THEN 'Closed'
//                         WHEN (T0.DocStatus='C' AND T0.CANCELED='Y') THEN 'Cancelled'
//                         WHEN T0.DocStatus='O' THEN 'Open'
//                         ELSE 'NA'
//                     END AS OrderStatus
//                 FROM ORDR T0
//                 WHERE T0.CANCELED = 'N'
//         `;

//         let whereClauses = [];
//         let params = [];

//         if (year) {
//             whereClauses.push(`YEAR(T0.DocDate) = @year`);
//             params.push({ name: 'year', type: sql.Int, value: parseInt(year) });
//         }

//         if (slpCode) {
//             whereClauses.push(`T0.SlpCode = @slpCode`);
//             params.push({ name: 'slpCode', type: sql.Int, value: parseInt(slpCode) });
//         }

//         if (itmsGrpCod) {
//             whereClauses.push(`EXISTS (
//                 SELECT 1 FROM RDR1 T1 
//                 INNER JOIN OITM T2 ON T1.ItemCode = T2.ItemCode 
//                 INNER JOIN OITB T3 ON T2.ItmsGrpCod = T3.ItmsGrpCod 
//                 WHERE T1.DocEntry = T0.DocEntry 
//                 AND T3.ItmsGrpNam = @itmsGrpCod
//             )`);
//             params.push({ name: 'itmsGrpCod', type: sql.VarChar, value: itmsGrpCod });
//         }

//         if (itemCode) {
//             whereClauses.push(`EXISTS (
//                 SELECT 1 FROM RDR1 T1 
//                 WHERE T1.DocEntry = T0.DocEntry 
//                 AND T1.ItemCode = @itemCode
//             )`);
//             params.push({ name: 'itemCode', type: sql.VarChar, value: itemCode });
//         }

//         if (cardCode) {
//             whereClauses.push(`T0.CardCode = @cardCode`);
//             params.push({ name: 'cardCode', type: sql.VarChar, value: cardCode });
//         }

//         if (contactPerson) {
//             whereClauses.push(`T0.CntctCode = @contactPerson`);
//             params.push({ name: 'contactPerson', type: sql.Int, value: parseInt(contactPerson) });
//         }

//         if (!isAdmin) {
//             // Use cardCodes for customer login
//             if (cardCodes.length > 0) {
//                 whereClauses.push(
//                     `T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`
//                 );
//             } 
//             // Use contactCodes for salesperson login (only if no cardCodes)
//             else if (contactCodes.length > 0) {
//                 whereClauses.push(
//                     `T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})`
//                 );
//             }
//         }

//         // Add additional WHERE clauses to the CTE
//         if (whereClauses.length > 0) {
//             baseQuery += ` AND ${whereClauses.join(' AND ')}`;
//         }

//         // Complete the query with the main SELECT
//         // const fullQuery = `
//         //     ${baseQuery}
//         //     )
//         //     SELECT 
//         //         YEAR(DocDate) AS year,
//         //         DATENAME(MONTH, DocDate) AS month,
//         //         MONTH(DocDate) AS monthNumber,
//         //         SUM(CASE WHEN OrderStatus = 'Open' THEN 1 ELSE 0 END) AS openOrders,
//         //         SUM(CASE WHEN OrderStatus = 'Closed' THEN 1 ELSE 0 END) AS closedOrders,
//         //         SUM(CASE WHEN OrderStatus = 'Open' THEN DocTotal ELSE 0 END) AS openSales,
//         //         SUM(CASE WHEN OrderStatus = 'Closed' THEN DocTotal ELSE 0 END) AS closedSales
//         //     FROM OrderStatusCTE
//         //     GROUP BY 
//         //         YEAR(DocDate),
//         //         DATENAME(MONTH, DocDate),
//         //         MONTH(DocDate)
//         //     ORDER BY 
//         //         YEAR(DocDate), MONTH(DocDate)
//         // `;

//         // Complete the query with the main SELECT
// // const fullQuery = `
// //     ${baseQuery}
// //     )
// //     SELECT 
// //         YEAR(DocDate) AS year,
// //         DATENAME(MONTH, DocDate) AS month,
// //         MONTH(DocDate) AS monthNumber,
// //         SUM(CASE WHEN OrderStatus = 'Open' THEN 1 ELSE 0 END) AS openOrders,
// //         SUM(CASE WHEN OrderStatus = 'Closed' THEN 1 ELSE 0 END) AS closedOrders,
// //         SUM(CASE WHEN OrderStatus = 'Open' THEN DocTotal ELSE 0 END) AS openSales,
// //         SUM(CASE WHEN OrderStatus = 'Closed' THEN DocTotal ELSE 0 END) AS closedSales,
// //         SUM(CASE WHEN OrderStatus = 'Open' THEN (
// //             SELECT COUNT(*) FROM RDR1 WHERE DocEntry = OrderStatusCTE.DocEntry
// //         ) ELSE 0 END) AS openLineItems
// //     FROM OrderStatusCTE
// //     GROUP BY 
// //         YEAR(DocDate),
// //         DATENAME(MONTH, DocDate),
// //         MONTH(DocDate)
// //     ORDER BY 
// //         YEAR(DocDate), MONTH(DocDate)
// // `;
// //         const fullQuery = `
// //     ${baseQuery}
// //     ),
// //     OrderLineItems AS (
// //         SELECT 
// //             T0.DocEntry,
// //             COUNT(T1.LineNum) AS LineItemsCount
// //         FROM ORDR T0
// //         INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
// //         WHERE T0.CANCELED = 'N'
// //         ${whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : ''}
// //         GROUP BY T0.DocEntry
// //     ),
// //     MonthlyData AS (
// //         SELECT 
// //             YEAR(CTE.DocDate) AS year,
// //             DATENAME(MONTH, CTE.DocDate) AS month,
// //             MONTH(CTE.DocDate) AS monthNumber,
// //             SUM(CASE WHEN CTE.OrderStatus = 'Open' THEN 1 ELSE 0 END) AS openOrders,
// //             SUM(CASE WHEN CTE.OrderStatus = 'Closed' THEN 1 ELSE 0 END) AS closedOrders,
// //             SUM(CASE WHEN CTE.OrderStatus = 'Open' THEN CTE.DocTotal ELSE 0 END) AS openSales,
// //             SUM(CASE WHEN CTE.OrderStatus = 'Closed' THEN CTE.DocTotal ELSE 0 END) AS closedSales
// //         FROM OrderStatusCTE CTE
// //         GROUP BY 
// //             YEAR(CTE.DocDate),
// //             DATENAME(MONTH, CTE.DocDate),
// //             MONTH(CTE.DocDate)
// //     ),
// //     MonthlyLineItems AS (
// //         SELECT 
// //             YEAR(T0.DocDate) AS year,
// //             MONTH(T0.DocDate) AS monthNumber,
// //             SUM(LI.LineItemsCount) AS openLineItems
// //         FROM ORDR T0
// //         INNER JOIN OrderLineItems LI ON T0.DocEntry = LI.DocEntry
// //         WHERE T0.CANCELED = 'N'
// //         AND T0.DocStatus = 'O'
// //         ${whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : ''}
// //         GROUP BY 
// //             YEAR(T0.DocDate),
// //             MONTH(T0.DocDate)
// //     )
// //     SELECT 
// //         MD.year,
// //         MD.month,
// //         MD.monthNumber,
// //         MD.openOrders,
// //         MD.closedOrders,
// //         MD.openSales,
// //         MD.closedSales,
// //         COALESCE(MLI.openLineItems, 0) AS openLineItems
// //     FROM MonthlyData MD
// //     LEFT JOIN MonthlyLineItems MLI ON MD.year = MLI.year AND MD.monthNumber = MLI.monthNumber
// //     ORDER BY 
// //         MD.year, MD.monthNumber
// // `; 

//         const fullQuery = `
//     ${baseQuery}
//     )
//     SELECT 
//         YEAR(CTE.DocDate) AS year,
//         DATENAME(MONTH, CTE.DocDate) AS month,
//         MONTH(CTE.DocDate) AS monthNumber,
//         SUM(CASE WHEN CTE.OrderStatus = 'Open' THEN 1 ELSE 0 END) AS openOrders,
//         SUM(CASE WHEN CTE.OrderStatus = 'Closed' THEN 1 ELSE 0 END) AS closedOrders,
//         SUM(CASE WHEN CTE.OrderStatus = 'Open' THEN CTE.DocTotal ELSE 0 END) AS openSales,
//         SUM(CASE WHEN CTE.OrderStatus = 'Closed' THEN CTE.DocTotal ELSE 0 END) AS closedSales,
//         SUM(CASE WHEN CTE.OrderStatus IN ('Open', 'Partial') THEN (
//             SELECT COUNT(*) 
//             FROM RDR1 
//             WHERE DocEntry = CTE.DocEntry 
//             AND LineStatus = 'O'
//         ) ELSE 0 END) AS openLineItems
//     FROM OrderStatusCTE CTE
//     GROUP BY 
//         YEAR(CTE.DocDate),
//         DATENAME(MONTH, CTE.DocDate),
//         MONTH(CTE.DocDate)
//     ORDER BY 
//         YEAR(CTE.DocDate), MONTH(CTE.DocDate)
// `;

//         const results = await queryDatabase(fullQuery, params);

//         const data = results.map(row => ({
//             year: row.year,
//             month: row.month,
//             monthNumber: row.monthNumber,
//             openOrders: parseInt(row.openOrders) || 0,
//             closedOrders: parseInt(row.closedOrders) || 0,
//             openSales: parseFloat(row.openSales) || 0,
//             closedSales: parseFloat(row.closedSales) || 0,
//             openLineItems: parseInt(row.openLineItems) || 0,
//         }));

//         let availableYears;
//         const yearsKey = 'monthly-orders:available-years';
//         const cachedYears = await getCache(yearsKey);

//         if (cachedYears) {
//             availableYears = cachedYears;
//         } else {
//             const yearsQuery = `
//                 SELECT DISTINCT YEAR(DocDate) as year
//                 FROM ORDR
//                 WHERE CANCELED = 'N'
//                 ORDER BY year DESC
//             `;
//             const yearsResult = await queryDatabase(yearsQuery);
//             availableYears = yearsResult.map(row => row.year);
//             await setCache(yearsKey, availableYears, 86400);
//         }

//         const responseData = { data, availableYears };
//         const cacheTTL = year ? 3600 : 1800;
//         await setCache(cacheKey, responseData, cacheTTL);

//         return res.status(200).json(responseData);
//     } catch (error) {
//         console.error('API handler error:', error);
//         return res.status(500).json({
//             error: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// }

import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from '../../lib/db';
import { getCache, setCache } from '../../lib/redis';

export default async function handler(req, res) {
  try {
    const { year, slpCode, itmsGrpCod, itemCode, cardCode, contactPerson } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(401).json({ error: 'Token verification failed' });
    }

    const isAdmin = decoded.role === 'admin';
    const contactCodes = decoded.contactCodes || [];
    const cardCodes = decoded.cardCodes || [];

    const cacheKey = `monthly-orders:${year || 'all'}:${slpCode || 'all'}:${itmsGrpCod || 'all'}:${itemCode || 'all'}:${cardCode || 'all'}:${contactPerson || 'all'}:${isAdmin ? 'admin' : contactCodes.join(',')}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Base query with CTE
    let baseQuery = `
      WITH OrderStatusCTE AS (
        SELECT 
          T0.DocEntry,
          T0.DocDate,
          T0.DocTotal,
          CASE 
            WHEN (
              T0.DocStatus = 'O'
              AND EXISTS (
                SELECT 1
                FROM RDR1 T1
                LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17
                LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15
                LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
                WHERE T1.DocEntry = T0.DocEntry AND OINV.DocNum IS NOT NULL AND CAST(OINV.DocNum AS VARCHAR) <> 'N/A'
              )
              AND EXISTS (
                SELECT 1
                FROM RDR1 T1
                LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry AND T1.LineNum = DLN1.BaseLine AND DLN1.BaseType = 17
                LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry AND DLN1.LineNum = INV1.BaseLine AND INV1.BaseType = 15
                LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
                WHERE T1.DocEntry = T0.DocEntry AND (OINV.DocNum IS NULL OR CAST(OINV.DocNum AS VARCHAR) = 'N/A')
              )
            ) THEN 'Partial'
            WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'N') THEN 'Closed'
            WHEN (T0.DocStatus = 'C' AND T0.CANCELED = 'Y') THEN 'Cancelled'
            WHEN T0.DocStatus = 'O' THEN 'Open'
            ELSE 'NA'
          END AS OrderStatus
        FROM ORDR T0
        WHERE T0.CANCELED = 'N'
    `;

    let whereClauses = [];
    let params = [];

    if (year) {
      whereClauses.push(`YEAR(T0.DocDate) = @year`);
      params.push({ name: 'year', type: sql.Int, value: parseInt(year) });
    }

    if (slpCode) {
      whereClauses.push(`T0.SlpCode = @slpCode`);
      params.push({ name: 'slpCode', type: sql.Int, value: parseInt(slpCode) });
    }

    if (itmsGrpCod) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM RDR1 T1 
        INNER JOIN OITM T2 ON T1.ItemCode = T2.ItemCode 
        INNER JOIN OITB T3 ON T2.ItmsGrpCod = T3.ItmsGrpCod 
        WHERE T1.DocEntry = T0.DocEntry 
        AND T3.ItmsGrpNam = @itmsGrpCod
      )`);
      params.push({ name: 'itmsGrpCod', type: sql.VarChar, value: itmsGrpCod });
    }

    if (itemCode) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM RDR1 T1 
        WHERE T1.DocEntry = T0.DocEntry 
        AND T1.ItemCode = @itemCode
      )`);
      params.push({ name: 'itemCode', type: sql.VarChar, value: itemCode });
    }

    if (cardCode) {
      whereClauses.push(`T0.CardCode = @cardCode`);
      params.push({ name: 'cardCode', type: sql.VarChar, value: cardCode });
    }

    if (contactPerson) {
      whereClauses.push(`T0.CntctCode = @contactPerson`);
      params.push({ name: 'contactPerson', type: sql.Int, value: parseInt(contactPerson) });
    }

    if (!isAdmin) {
      if (cardCodes.length > 0) {
        whereClauses.push(`T0.CardCode IN (${cardCodes.map(code => `'${code}'`).join(',')})`);
      } else if (contactCodes.length > 0) {
        whereClauses.push(`T0.SlpCode IN (${contactCodes.map(code => `'${code}'`).join(',')})`);
      }
    }

    if (whereClauses.length > 0) {
      baseQuery += ` AND ${whereClauses.join(' AND ')}`;
    }

    // Final full query
    const fullQuery = `
      ${baseQuery}
      ),
      MonthlyData AS (
        SELECT 
          YEAR(DocDate) AS year,
          DATENAME(MONTH, DocDate) AS month,
          MONTH(DocDate) AS monthNumber,
          SUM(CASE WHEN OrderStatus = 'Open' THEN 1 ELSE 0 END) AS openOrders,
          SUM(CASE WHEN OrderStatus = 'Closed' THEN 1 ELSE 0 END) AS closedOrders,
          SUM(CASE WHEN OrderStatus = 'Open' THEN DocTotal ELSE 0 END) AS openSales,
          SUM(CASE WHEN OrderStatus = 'Closed' THEN DocTotal ELSE 0 END) AS closedSales
        FROM OrderStatusCTE
        GROUP BY 
          YEAR(DocDate),
          DATENAME(MONTH, DocDate),
          MONTH(DocDate)
      ),
      MonthlyLineItems AS (
        SELECT 
          YEAR(T0.DocDate) AS year,
          MONTH(T0.DocDate) AS monthNumber,
          COUNT(*) AS openLineItems
        FROM RDR1 T1
        INNER JOIN OrderStatusCTE T0 ON T1.DocEntry = T0.DocEntry
        WHERE T0.OrderStatus IN ('Open', 'Partial') AND T1.LineStatus = 'O'
        GROUP BY 
          YEAR(T0.DocDate),
          MONTH(T0.DocDate)
      )
      SELECT 
        MD.year,
        MD.month,
        MD.monthNumber,
        MD.openOrders,
        MD.closedOrders,
        MD.openSales,
        MD.closedSales,
        COALESCE(MLI.openLineItems, 0) AS openLineItems
      FROM MonthlyData MD
      LEFT JOIN MonthlyLineItems MLI 
        ON MD.year = MLI.year AND MD.monthNumber = MLI.monthNumber
      ORDER BY MD.year, MD.monthNumber
    `;

    const results = await queryDatabase(fullQuery, params);

    const data = results.map(row => ({
      year: row.year,
      month: row.month,
      monthNumber: row.monthNumber,
      openOrders: parseInt(row.openOrders) || 0,
      closedOrders: parseInt(row.closedOrders) || 0,
      openSales: parseFloat(row.openSales) || 0,
      closedSales: parseFloat(row.closedSales) || 0,
      openLineItems: parseInt(row.openLineItems) || 0,
    }));

    let availableYears;
    const yearsKey = 'monthly-orders:available-years';
    const cachedYears = await getCache(yearsKey);

    if (cachedYears) {
      availableYears = cachedYears;
    } else {
      const yearsQuery = `
        SELECT DISTINCT YEAR(DocDate) as year
        FROM ORDR
        WHERE CANCELED = 'N'
        ORDER BY year DESC
      `;
      const yearsResult = await queryDatabase(yearsQuery);
      availableYears = yearsResult.map(row => row.year);
      await setCache(yearsKey, availableYears, 86400);
    }

    const responseData = { data, availableYears };
    const cacheTTL = year ? 3600 : 1800;
    await setCache(cacheKey, responseData, cacheTTL);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
