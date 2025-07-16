// pages/api/monthly-orders-details.js
import { verify } from 'jsonwebtoken';
import sql from 'mssql';
import { queryDatabase } from '../../lib/db';
import { getCache, setCache } from '../../lib/redis';

export default async function handler(req, res) {
  try {
    const { year, month, status, slpCode, itmsGrpCod, itemCode, cardCode, contactPerson } = req.query;
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

    const cacheKey = `monthly-orders-details:${year}:${month}:${status}:${slpCode || 'all'}:${itmsGrpCod || 'all'}:${itemCode || 'all'}:${cardCode || 'all'}:${contactPerson || 'all'}:${isAdmin ? 'admin' : contactCodes.join(',')}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const query = `
      WITH OrderStatusCTE AS (
        SELECT 
          T0.DocEntry,
          T0.DocNum AS OrderNo,
          T0.DocDate,
          T0.NumAtCard AS CustomerRefNo,
          T0.CntctCode,
          T0.SlpCode,
          T0.CardCode,
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
          AND YEAR(T0.DocDate) = @year
          AND DATENAME(MONTH, T0.DocDate) = @month
          ${status ? `AND (
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
            END
          ) = @status` : ''}
    `;

    let whereClauses = [];
    let params = [
      { name: 'year', type: sql.Int, value: parseInt(year) },
      { name: 'month', type: sql.VarChar, value: month }
    ];

    if (status) {
      params.push({ name: 'status', type: sql.VarChar, value: status });
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
      DetailedLineItems AS (
        SELECT 
          CTE.OrderNo,
          CTE.Status,
          CTE.DocDate,
          CTE.CustomerRefNo,
          CTE.CntctCode,
          CTE.SlpCode,
          CTE.CardCode,
          OCRD.CardName,
          SP.SlpName,
          T1.LineNum,
          T1.ItemCode,
          T1.Dscription,
          T1.U_CasNo,
          T1.VendorNum,
          T1.U_Packsize,
          T1.Quantity,
          T1.Price,
          T1.LineTotal,
          T1.U_Mkt_feedback,
          V.DocNum AS InvoiceNo,
          V.DocDate AS InvoiceDate,
          V.TrackNo AS TrackingNo,
          V.U_DispatchDate AS DispatchDate,
          V.U_DeliveryDate AS DeliveryDate,
          T15.U_vendorbatchno AS BatchNo
        FROM OrderStatusCTE CTE
        INNER JOIN RDR1 T1 ON CTE.DocEntry = T1.DocEntry
        INNER JOIN OCRD ON CTE.CardCode = OCRD.CardCode
        LEFT JOIN OSLP SP ON CTE.SlpCode = SP.SlpCode
        LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
        LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
        LEFT JOIN OINV V ON I.DocEntry = V.DocEntry AND V.CANCELED = 'N'
        LEFT JOIN IBT1 T4 ON T4.BaseEntry = D.DocEntry
                        AND T4.BaseType = 15
                        AND T4.BaseLinNum = D.LineNum
                        AND T4.ItemCode = D.ItemCode
        LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode
                          AND T4.BatchNum = T15.BatchNum
        WHERE 
          CTE.Status IN ('Open', 'Partial')
          AND V.DocEntry IS NULL
      )
      SELECT 
        DLI.OrderNo AS "SO No",
        DLI.DocDate AS "SO Date",
        DLI.CardName AS "Customer Name",
        DLI.CustomerRefNo AS "Customer Ref No",
        TA.Name AS "Contact Person",
        DLI.SlpName AS "Sales Person",
        DLI.ItemCode AS "Item No",
        DLI.Dscription AS "Description",
        DLI.U_CasNo AS "Cas No",
        DLI.VendorNum AS "Vendor Cat No",
        DLI.U_Packsize AS "PKZ",
        DLI.Quantity AS "Qty",
        DLI.Status AS "Status",
        DLI.Price AS "Unit Price",
        DLI.LineTotal AS "Total Value",
        DLI.BatchNo AS "Batch No",
        DLI.U_Mkt_feedback AS "Mkt Feedback",
        DLI.InvoiceNo AS "Invoice No",
        DLI.InvoiceDate AS "Invoice Date",
        DLI.TrackingNo AS "Tracking No",
        DLI.DispatchDate AS "Dispatch Date",
        DLI.DeliveryDate AS "Delivery Date"
      FROM DetailedLineItems DLI
      LEFT JOIN OCPR TA ON DLI.CntctCode = TA.CntctCode
      ORDER BY DLI.DocDate DESC, DLI.OrderNo, DLI.LineNum
    `;

    const results = await queryDatabase(fullQuery, params);
    await setCache(cacheKey, results, 1800);
    return res.status(200).json(results);
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
