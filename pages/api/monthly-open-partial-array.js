// pages/api/monthly-open-partial-array.js
import sql from 'mssql';
import { queryDatabase } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const query = `
      WITH OrderStatusCTE AS (
        SELECT 
          T0.DocEntry,
          T0.DocNum AS OrderNo,
          T0.DocDate,
          T0.NumAtCard AS CustomerRefNo,
          T0.CntctCode,
          CASE 
            WHEN (
              T0.DocStatus = 'O'
              AND EXISTS (
                SELECT 1
                FROM RDR1 T1
                LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
                LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
                LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
                WHERE T1.DocEntry = T0.DocEntry
                  AND V.DocEntry IS NOT NULL
              )
              AND EXISTS (
                SELECT 1
                FROM RDR1 T1
                LEFT JOIN DLN1 D ON T1.DocEntry = D.BaseEntry AND T1.LineNum = D.BaseLine AND D.BaseType = 17
                LEFT JOIN INV1 I ON D.DocEntry = I.BaseEntry AND D.LineNum = I.BaseLine AND I.BaseType = 15
                LEFT JOIN OINV V ON V.DocEntry = I.DocEntry AND V.CANCELED = 'N'
                WHERE T1.DocEntry = T0.DocEntry
                  AND V.DocEntry IS NULL
              )
            ) THEN 'Partial'
            WHEN T0.DocStatus = 'O' THEN 'Open'
            ELSE 'Other'
          END AS Status
        FROM ORDR T0
        WHERE T0.CANCELED = 'N'
      ),
      OpenLineItems AS (
        SELECT 
          CTE.OrderNo,
          CTE.DocDate,
          CTE.Status,
          CTE.CustomerRefNo,
          CTE.CntctCode,
          T12.ItemCode,
          T12.Dscription,
          T12.U_CasNo,
          T12.VendorNum,
          T12.U_Packsize,
          T12.Quantity,
          T12.Price,
          T12.LineTotal,
          T0.DocNum AS InvoiceNo,
          T0.DocDate AS InvoiceDate,
          T0.TrackNo,
          T0.U_DispatchDate,
          T0.U_DeliveryDate,
          T15.U_vendorbatchno AS BatchNum,
          T12.U_Mkt_feedback AS MktFeedback
        FROM OrderStatusCTE CTE
        INNER JOIN RDR1 T12 ON CTE.DocEntry = T12.DocEntry
        LEFT JOIN DLN1 T2 ON T2.BaseEntry = T12.DocEntry AND T2.BaseType = 17 AND T2.BaseLine = T12.LineNum AND T2.ItemCode = T12.ItemCode
        LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
        LEFT JOIN INV1 T1 ON T1.BaseEntry = T2.DocEntry AND T1.BaseType = 15 AND T1.BaseLine = T2.LineNum AND T1.ItemCode = T2.ItemCode
        LEFT JOIN OINV T0 ON T0.DocEntry = T1.DocEntry AND T0.CANCELED = 'N'
        LEFT JOIN IBT1 T4 ON T4.BaseEntry = T2.DocEntry AND T4.BaseType = 15 AND T4.BaseLinNum = T2.LineNum AND T4.ItemCode = T2.ItemCode
        LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode AND T4.BatchNum = T15.BatchNum
        WHERE 
          CTE.Status IN ('Open', 'Partial')
          AND T0.DocEntry IS NULL
      )
      SELECT 
        YEAR(OL.DocDate) AS [Year],
        DATENAME(MONTH, OL.DocDate) AS [Month],
        MONTH(OL.DocDate) AS [MonthNumber],
        OL.Status,
        OL.OrderNo AS [SO_No],
        OL.DocDate AS [SO_Date],
        OL.CustomerRefNo AS [Customer_Ref_No],
        CP.Name AS [Contact_Person],
        OL.ItemCode AS [Item_No],
        OL.Dscription AS [Item_Service_Description],
        OL.U_CasNo AS [Cas_No],
        OL.VendorNum AS [Vendor_Catalog_No],
        OL.U_Packsize AS [PKZ],
        OL.Quantity AS [Qty],
        'Open' AS [Line_Status],
        NULL AS [Invoice_No],
        NULL AS [Invoice_Date],
        OL.TrackNo AS [Tracking_Number],
        OL.U_DispatchDate AS [Dispatch_Date],
        OL.U_DeliveryDate AS [Delivery_Date],
        OL.Price AS [Unit_Sales_Price],
        OL.LineTotal AS [Total_Sales_Price_Open_Value],
        OL.BatchNum AS [Batch_No],
        OL.MktFeedback AS [Mkt_Feedback]
      FROM OpenLineItems OL
      LEFT JOIN OCPR CP ON OL.CntctCode = CP.CntctCode
      ORDER BY [Year], [MonthNumber], OL.Status, [SO_No];
    `;

    const results = await queryDatabase(query);
    
    // Return the plain array of objects
    res.status(200).json(results || []);

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}