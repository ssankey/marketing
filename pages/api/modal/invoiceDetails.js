// pages/api/modal/invoiceDetails.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { invoiceNo } = req.query;

  if (!invoiceNo) {
    return res.status(400).json({ 
      message: "Invoice number must be provided" 
    });
  }

  try {
    const query = `
      SELECT
        T13.DocNum                       AS [SO No],
        T13.DocDate                      AS [SO Date],
        T13.NumAtCard                    AS [SO Customer Ref. No],
        CP.Name                          AS [Contact Person],
        T1.ItemCode                      AS [Item No.],
        T1.Dscription                    AS [Item/Service Description],
        T1.U_CasNo                       AS [Cas No],
        T1.VendorNum                     AS [Vendor Catalog No.],
        T1.U_Packsize                    AS [PKZ],
        T4.Quantity                      AS [Qty],
         CASE 
                WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'Y' THEN 'Cancelled'
                WHEN T0.DocNum IS NOT NULL THEN 'Invoiced'
                ELSE 'Open'
                END AS "STATUS",
        T0.DocNum                        AS [Inv#],
        T0.DocDate                       AS [Invoice Posting Dt.],
        T0.TrackNo                       AS [Tracking Number],
        T0.U_DispatchDate                AS [Dispatch Date],
        T0.U_DeliveryDate                AS [DELIVER DATE],
        T1.PriceBefDi                    AS [Unit Sales Price],
        CASE
          WHEN T1.InvQty = 0 THEN T1.LineTotal
          WHEN T4.Quantity IS NULL THEN T1.LineTotal
          WHEN T1.InvQty <> 0 AND T4.Quantity IS NOT NULL
          THEN (T1.LineTotal / T1.InvQty) * T4.Quantity
        END                              AS [Total Sales Price/Open Value],
        T15.U_vendorbatchno              AS [BatchNum],
        T1.U_Mkt_feedback                AS [Mkt_Feedback]
      FROM OINV T0
      INNER JOIN INV1 T1      ON T0.DocEntry = T1.DocEntry
      INNER JOIN INV12 B      ON T0.DocEntry = B.DocEntry
      INNER JOIN DLN1 T2      ON T2.ItemCode = T1.ItemCode
                            AND T2.DocEntry = T1.BaseEntry
                            AND T1.BaseType = 15
                            AND T1.BaseLine = T2.LineNum
      INNER JOIN ODLN T3      ON T3.DocEntry = T2.DocEntry
      INNER JOIN RDR1 T12     ON T12.ItemCode = T2.ItemCode
                            AND T12.DocEntry = T2.BaseEntry
                            AND T2.BaseType = 17
                            AND T2.BaseLine = T12.LineNum
      INNER JOIN ORDR T13     ON T13.DocEntry = T12.DocEntry
      INNER JOIN OCPR CP      ON T13.CntctCode = CP.CntctCode
      LEFT JOIN IBT1 T4       ON T4.CardCode = T3.CardCode
                            AND T4.ItemCode = T2.ItemCode
                            AND T4.BaseNum = T3.DocNum
                            AND T4.BaseEntry = T3.DocEntry
                            AND T4.BaseType = 15
                            AND T4.BaseLinNum = T2.LineNum
                            AND T4.Direction = 1
      INNER JOIN OIBT T15     ON T4.ItemCode = T15.ItemCode
                            AND T4.BatchNum = T15.BatchNum
      WHERE T0.CANCELED = 'N'
      AND T0.DocNum = ${invoiceNo}
    `;

    const results = await queryDatabase(query);
    
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    res.status(500).json({ 
      message: "Error fetching invoice details",
      error: error.message
    });
  }
}