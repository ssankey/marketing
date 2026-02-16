// // pages/api/monthly-orders.js
// import { verify } from 'jsonwebtoken';
// import sql from 'mssql';
// import { queryDatabase } from '../../lib/db';
// import { getCache, setCache } from '../../lib/redis';

// export default async function handler(req, res) {
//   try {
//     const { year, slpCode, itmsGrpCod, itemCode, cardCode, contactPerson } = req.query;
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ error: 'Missing or malformed Authorization header' });
//     }

//     const token = authHeader.split(' ')[1];
//     let decoded;
//     try {
//       decoded = verify(token, process.env.JWT_SECRET);
//     } catch (verifyError) {
//       console.error('Token verification failed:', verifyError);
//       return res.status(401).json({ error: 'Token verification failed' });
//     }

//     const isAdmin = decoded.role === 'admin';
//     const contactCodes = decoded.contactCodes || [];
//     const cardCodes = decoded.cardCodes || [];

//     const cacheKey = `monthly-orders-aggregate:${year || 'all'}:${slpCode || 'all'}:${itmsGrpCod || 'all'}:${itemCode || 'all'}:${cardCode || 'all'}:${contactPerson || 'all'}:${isAdmin ? 'admin' : contactCodes.join(',')}`;

//     const cachedData = await getCache(cacheKey);
//     if (cachedData) {
//       return res.status(200).json(cachedData);
//     }

//     const query = `
//       WITH OrderStatusCTE AS (
//         SELECT 
//           T0.DocEntry,
//           YEAR(T0.DocDate) AS year,
//           DATENAME(MONTH, T0.DocDate) AS month,
//           MONTH(T0.DocDate) AS monthNumber,
//           CASE 
//             WHEN (
//               T0.DocStatus = 'O'
//               AND EXISTS (
//                 SELECT 1 FROM RDR1 T1
//                 LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
//                 LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
//                 LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
//                 WHERE T1.DocEntry = T0.DocEntry AND V.DocEntry IS NOT NULL
//               )
//               AND EXISTS (
//                 SELECT 1 FROM RDR1 T1
//                 LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
//                 LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
//                 LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
//                 WHERE T1.DocEntry = T0.DocEntry AND V.DocEntry IS NULL
//               )
//             ) THEN 'Partial'
//             WHEN T0.DocStatus = 'O' THEN 'Open'
//             ELSE 'Other'
//           END AS Status
//         FROM ORDR T0
//         WHERE T0.CANCELED = 'N'
//     `;

//     let whereClauses = [];
//     let params = [];

//     if (year) {
//       whereClauses.push(`YEAR(T0.DocDate) = @year`);
//       params.push({ name: 'year', type: sql.Int, value: parseInt(year) });
//     }

//     if (slpCode) {
//       whereClauses.push(`T0.SlpCode = @slpCode`);
//       params.push({ name: 'slpCode', type: sql.Int, value: parseInt(slpCode) });
//     }

//     if (itmsGrpCod) {
//       whereClauses.push(`EXISTS (
//         SELECT 1 FROM RDR1 T1 
//         INNER JOIN OITM T2 ON T1.ItemCode = T2.ItemCode 
//         INNER JOIN OITB T3 ON T2.ItmsGrpCod = T3.ItmsGrpCod 
//         WHERE T1.DocEntry = T0.DocEntry 
//         AND T3.ItmsGrpNam = @itmsGrpCod
//       )`);
//       params.push({ name: 'itmsGrpCod', type: sql.VarChar, value: itmsGrpCod });
//     }

//     if (itemCode) {
//       whereClauses.push(`EXISTS (
//         SELECT 1 FROM RDR1 T1 
//         WHERE T1.DocEntry = T0.DocEntry 
//         AND T1.ItemCode = @itemCode
//       )`);
//       params.push({ name: 'itemCode', type: sql.VarChar, value: itemCode });
//     }

//     if (cardCode) {
//       whereClauses.push(`T0.CardCode = @cardCode`);
//       params.push({ name: 'cardCode', type: sql.VarChar, value: cardCode });
//     }

//     if (contactPerson) {
//       whereClauses.push(`T0.CntctCode = @contactPerson`);
//       params.push({ name: 'contactPerson', type: sql.Int, value: parseInt(contactPerson) });
//     }

//     if (!isAdmin) {
//       if (cardCodes.length > 0) {
//         whereClauses.push(`T0.CardCode IN (${cardCodes.map(code => `'${code}'`).join(',')})`);
//       } else if (contactCodes.length > 0) {
//         whereClauses.push(`T0.SlpCode IN (${contactCodes.map(code => `'${code}'`).join(',')})`);
//       }
//     }

//     const fullQuery = `
//       ${query}
//       ${whereClauses.length > 0 ? ` AND ${whereClauses.join(' AND ')}` : ''}
//       ),
//       LineItemSummary AS (
//         SELECT
//             C.DocEntry,
//             COUNT(T1.LineNum) AS lineItemCount,
//             SUM(T1.LineTotal) AS totalSales
//         FROM OrderStatusCTE C
//         INNER JOIN RDR1 T1 ON C.DocEntry = T1.DocEntry
//         LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
//         LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
//         LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
//         WHERE V.DocEntry IS NULL  -- only include uninvoiced line items
//         GROUP BY C.DocEntry
//       ),
//       MonthlyAggregated AS (
//         SELECT 
//             C.year,
//             C.month,
//             C.monthNumber,
//             C.Status,
//             COUNT(DISTINCT C.DocEntry) AS uniqueOrders,
//             SUM(ISNULL(L.lineItemCount, 0)) AS totalLineItems,
//             SUM(ISNULL(L.totalSales, 0)) AS totalSales
//         FROM OrderStatusCTE C
//         LEFT JOIN LineItemSummary L ON C.DocEntry = L.DocEntry
//         WHERE C.Status IN ('Open', 'Partial')
//         GROUP BY C.year, C.month, C.monthNumber, C.Status
//       )
//       SELECT 
//         year,
//         month,
//         monthNumber,
//         SUM(CASE WHEN Status = 'Open' THEN uniqueOrders ELSE 0 END) AS openOrders,
//         SUM(CASE WHEN Status = 'Partial' THEN uniqueOrders ELSE 0 END) AS partialOrders,
//         SUM(CASE WHEN Status = 'Open' THEN totalLineItems ELSE 0 END) AS openOrderLineItems,
//         SUM(CASE WHEN Status = 'Partial' THEN totalLineItems ELSE 0 END) AS partialOrderLineItems,
//         SUM(CASE WHEN Status = 'Open' THEN totalSales ELSE 0 END) AS openOrderSales,
//         SUM(CASE WHEN Status = 'Partial' THEN totalSales ELSE 0 END) AS partialOrderSales,
//         SUM(uniqueOrders) AS totalOrders
//       FROM MonthlyAggregated
//       GROUP BY year, month, monthNumber
//       ORDER BY year, monthNumber
//     `;

//     const results = await queryDatabase(fullQuery, params);

//     const data = results.map(row => ({
//       year: row.year,
//       month: row.month,
//       monthNumber: row.monthNumber,
//       openOrders: parseInt(row.openOrders) || 0,
//       partialOrders: parseInt(row.partialOrders) || 0,
//       openOrderLineItems: parseInt(row.openOrderLineItems) || 0,
//       partialOrderLineItems: parseInt(row.partialOrderLineItems) || 0,
//       openOrderSales: parseFloat(row.openOrderSales) || 0,
//       partialOrderSales: parseFloat(row.partialOrderSales) || 0,
//       totalOrders: parseInt(row.totalOrders) || 0
//     }));

//     const responseData = { 
//       data,
//       availableYears: await getAvailableYears()
//     };

//     await setCache(cacheKey, responseData, 3600);
//     return res.status(200).json(responseData);
//   } catch (error) {
//     console.error('API handler error:', error);
//     return res.status(500).json({
//       error: 'Internal server error',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// }

// async function getAvailableYears() {
//   const yearsKey = 'monthly-orders:available-years';
//   const cachedYears = await getCache(yearsKey);

//   if (cachedYears) {
//     return cachedYears;
//   }

//   const yearsQuery = `
//     SELECT DISTINCT YEAR(DocDate) as year
//     FROM ORDR
//     WHERE CANCELED = 'N'
//     ORDER BY year DESC
//   `;
//   const yearsResult = await queryDatabase(yearsQuery);
//   const availableYears = yearsResult.map(row => row.year);
//   await setCache(yearsKey, availableYears, 86400);
//   return availableYears;
// }

// pages/api/monthly-orders.js
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

    // CACHING LOGIC START (commented out)
    /*
    const cacheKey = `monthly-orders-aggregate:${year || 'all'}:${slpCode || 'all'}:${itmsGrpCod || 'all'}:${itemCode || 'all'}:${cardCode || 'all'}:${contactPerson || 'all'}:${isAdmin ? 'admin' : contactCodes.join(',')}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }
    */

    const query = `
      WITH OrderStatusCTE AS (
        SELECT 
          T0.DocEntry,
          YEAR(T0.DocDate) AS year,
          DATENAME(MONTH, T0.DocDate) AS month,
          MONTH(T0.DocDate) AS monthNumber,
          CASE 
            WHEN (
              T0.DocStatus = 'O'
              AND EXISTS (
                SELECT 1 FROM RDR1 T1
                LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
                LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
                LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
                WHERE T1.DocEntry = T0.DocEntry AND V.DocEntry IS NOT NULL
              )
              AND EXISTS (
                SELECT 1 FROM RDR1 T1
                LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
                LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
                LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
                WHERE T1.DocEntry = T0.DocEntry AND V.DocEntry IS NULL
              )
            ) THEN 'Partial'
            WHEN T0.DocStatus = 'O' THEN 'Open'
            ELSE 'Other'
          END AS Status
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

    const fullQuery = `
      ${query}
      ${whereClauses.length > 0 ? ` AND ${whereClauses.join(' AND ')}` : ''}
      ),
      LineItemSummary AS (
        SELECT
            C.DocEntry,
            COUNT(T1.LineNum) AS lineItemCount,
            SUM(T1.LineTotal) AS totalSales
        FROM OrderStatusCTE C
        INNER JOIN RDR1 T1 ON C.DocEntry = T1.DocEntry
        LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
        LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
        LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
        WHERE V.DocEntry IS NULL  -- only include uninvoiced line items
        GROUP BY C.DocEntry
      ),
      MonthlyAggregated AS (
        SELECT 
            C.year,
            C.month,
            C.monthNumber,
            C.Status,
            COUNT(DISTINCT C.DocEntry) AS uniqueOrders,
            SUM(ISNULL(L.lineItemCount, 0)) AS totalLineItems,
            SUM(ISNULL(L.totalSales, 0)) AS totalSales
        FROM OrderStatusCTE C
        LEFT JOIN LineItemSummary L ON C.DocEntry = L.DocEntry
        WHERE C.Status IN ('Open', 'Partial')
        GROUP BY C.year, C.month, C.monthNumber, C.Status
      )
      SELECT 
        year,
        month,
        monthNumber,
        SUM(CASE WHEN Status = 'Open' THEN uniqueOrders ELSE 0 END) AS openOrders,
        SUM(CASE WHEN Status = 'Partial' THEN uniqueOrders ELSE 0 END) AS partialOrders,
        SUM(CASE WHEN Status = 'Open' THEN totalLineItems ELSE 0 END) AS openOrderLineItems,
        SUM(CASE WHEN Status = 'Partial' THEN totalLineItems ELSE 0 END) AS partialOrderLineItems,
        SUM(CASE WHEN Status = 'Open' THEN totalSales ELSE 0 END) AS openOrderSales,
        SUM(CASE WHEN Status = 'Partial' THEN totalSales ELSE 0 END) AS partialOrderSales,
        SUM(uniqueOrders) AS totalOrders
      FROM MonthlyAggregated
      GROUP BY year, month, monthNumber
      ORDER BY year, monthNumber
    `;

    const results = await queryDatabase(fullQuery, params);

    const data = results.map(row => ({
      year: row.year,
      month: row.month,
      monthNumber: row.monthNumber,
      openOrders: parseInt(row.openOrders) || 0,
      partialOrders: parseInt(row.partialOrders) || 0,
      openOrderLineItems: parseInt(row.openOrderLineItems) || 0,
      partialOrderLineItems: parseInt(row.partialOrderLineItems) || 0,
      openOrderSales: parseFloat(row.openOrderSales) || 0,
      partialOrderSales: parseFloat(row.partialOrderSales) || 0,
      totalOrders: parseInt(row.totalOrders) || 0
    }));

    const responseData = { 
      data,
      availableYears: await getAvailableYears()
    };

    // CACHING LOGIC CONTINUED (commented out)
    /*
    await setCache(cacheKey, responseData, 3600);
    */
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function getAvailableYears() {
  // CACHING LOGIC FOR YEARS (commented out)
  /*
  const yearsKey = 'monthly-orders:available-years';
  const cachedYears = await getCache(yearsKey);

  if (cachedYears) {
    return cachedYears;
  }
  */

  const yearsQuery = `
    SELECT DISTINCT YEAR(DocDate) as year
    FROM ORDR
    WHERE CANCELED = 'N'
    ORDER BY year DESC
  `;
  const yearsResult = await queryDatabase(yearsQuery);
  const availableYears = yearsResult.map(row => row.year);
  
  // CACHING LOGIC CONTINUED (commented out)
  /*
  await setCache(yearsKey, availableYears, 86400);
  */
  return availableYears;
}