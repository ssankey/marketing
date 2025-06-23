
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { orderNo, customerPONo } = req.query;

  if (!orderNo && !customerPONo) {
    return res.status(400).json({ 
      message: "Either orderNo or customerPONo must be provided" 
    });
  }

  try {
    // let query = `
    //   SELECT
    //     T13.DocNum AS "SO No",
    //     T13.DocDate AS "SO Date",
    //     T13.NumAtCard AS "Customer Ref. No",
    //     TA.Name AS "Contact Person",
    //     T12.ItemCode AS "Item No.",
    //     T12.Dscription AS "Item/Service Description",
    //     T12.U_CasNo AS "Cas No",
    //     T12.VendorNum AS "Vendor Catalog No.",
    //     T12.U_Packsize AS "PKZ",
    //     T12.Quantity AS "Qty",
    //     CASE 
    //       WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'N' THEN 'Closed'
    //       WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'Y' THEN 'Cancelled'
    //       WHEN T0.DocStatus = 'O' THEN 'Open'
    //       ELSE 'NA'
    //     END AS "STATU",
    //     T0.DocNum AS "Inv#",
    //     T0.DocDate AS "Invoice Posting Dt.",
    //     T0.TrackNo AS "Tracking Number",
    //     T0.U_DispatchDate AS "Dispatch Date",
    //     T0.U_DeliveryDate AS "DELIVER DATE",
    //     T12.Price AS "Unit Sales Price",
    //     T12.LineTotal AS "Total Sales Price/Open Value",
    //     T15.U_vendorbatchno AS "BatchNum",
    //     T12.U_Mkt_feedback AS "Mkt_Feedback"
    //   FROM ORDR T13
    //   INNER JOIN OCPR TA ON T13.CntctCode = TA.CntctCode
    //   INNER JOIN RDR1 T12 ON T13.DocEntry = T12.DocEntry
    //   LEFT JOIN DLN1 T2 ON T2.BaseEntry = T12.DocEntry 
    //                     AND T2.BaseType = 17 
    //                     AND T2.BaseLine = T12.LineNum
    //                     AND T2.ItemCode = T12.ItemCode
    //   LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
    //   LEFT JOIN INV1 T1 ON T1.BaseEntry = T2.DocEntry 
    //                     AND T1.BaseType = 15 
    //                     AND T1.BaseLine = T2.LineNum
    //                     AND T1.ItemCode = T2.ItemCode
    //   LEFT JOIN OINV T0 ON T0.DocEntry = T1.DocEntry AND T0.CANCELED = 'N'
    //   LEFT JOIN IBT1 T4 ON T4.BaseEntry = T2.DocEntry
    //                   AND T4.BaseType = 15
    //                   AND T4.BaseLinNum = T2.LineNum
    //                   AND T4.ItemCode = T2.ItemCode
    //   LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode
    //                     AND T4.BatchNum = T15.BatchNum
    //   WHERE 1=1
    // `;
      let query = `
      SELECT
        T13.DocNum AS "SO No",
        T13.DocDate AS "SO Date",
        T13.NumAtCard AS "Customer Ref. No",
        TA.Name AS "Contact Person",
        T12.ItemCode AS "Item No.",
        T12.Dscription AS "Item/Service Description",
        T12.U_CasNo AS "Cas No",
        T12.VendorNum AS "Vendor Catalog No.",
        T12.U_Packsize AS "PKZ",
        T12.Quantity AS "Qty",
        CASE 
        WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'Y' THEN 'Cancelled'
        WHEN T0.DocNum IS NOT NULL THEN 'Closed'
        ELSE 'Open'
        END AS "STATUS",
        T0.DocNum AS "Inv#",
        T0.DocDate AS "Invoice Posting Dt.",
        T0.TrackNo AS "Tracking Number",
        T0.U_DispatchDate AS "Dispatch Date",
        T0.U_DeliveryDate AS "DELIVER DATE",
        T12.Price AS "Unit Sales Price",
        T12.LineTotal AS "Total Sales Price/Open Value",
        T15.U_vendorbatchno AS "BatchNum",
        T12.U_Mkt_feedback AS "Mkt_Feedback"
      FROM ORDR T13
      INNER JOIN OCPR TA ON T13.CntctCode = TA.CntctCode
      INNER JOIN RDR1 T12 ON T13.DocEntry = T12.DocEntry
      LEFT JOIN DLN1 T2 ON T2.BaseEntry = T12.DocEntry 
                        AND T2.BaseType = 17 
                        AND T2.BaseLine = T12.LineNum
                        AND T2.ItemCode = T12.ItemCode
      LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
      LEFT JOIN INV1 T1 ON T1.BaseEntry = T2.DocEntry 
                        AND T1.BaseType = 15 
                        AND T1.BaseLine = T2.LineNum
                        AND T1.ItemCode = T2.ItemCode
      LEFT JOIN OINV T0 ON T0.DocEntry = T1.DocEntry AND T0.CANCELED = 'N'
      LEFT JOIN IBT1 T4 ON T4.BaseEntry = T2.DocEntry
                      AND T4.BaseType = 15
                      AND T4.BaseLinNum = T2.LineNum
                      AND T4.ItemCode = T2.ItemCode
      LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode
                        AND T4.BatchNum = T15.BatchNum
      WHERE 1=1
    `;

    if (orderNo) {
      const orderNumber = parseInt(orderNo, 10);
      if (isNaN(orderNumber)) {
        return res.status(400).json({ message: "Invalid order number format" });
      }
      query += ` AND T13.DocNum = ${orderNumber}`;
    } 
    
    if (customerPONo) {
      const escapedPONo = customerPONo.replace(/'/g, "''");
      query += ` AND T13.NumAtCard = '${escapedPONo}'`;
    }

    query += ` ORDER BY T13.DocNum, T12.LineNum`;

    const results = await queryDatabase(query);
    
    if (results.length === 0) {
      return res.status(404).json({
        message: "No records found",
        suggestion: "Check if the order exists in the system"
      });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ 
      message: "Error fetching order details",
      error: error.message
    });
  }
}




//   CASE 
//           WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'N' THEN 'Closed'
//           WHEN T0.DocStatus = 'C' AND T0.CANCELED = 'Y' THEN 'Cancelled'
//           WHEN T0.DocStatus = 'O' THEN 'Open'
//           ELSE 'NA'
//         END AS "STATU",