// models/order-lifecycle/order-lifecycle.js
import { queryDatabase } from "../../db";

export async function orderlifecycle({
  isAdmin = false,
  contactCodes = [],
  cardCodes = [],
       // ✅ New filter
}) {
  // Start building WHERE clause
  let whereClause = "T0.CANCELED = 'N'";

  // ✅ Use cardCodes for customer login
  if (!isAdmin && cardCodes.length > 0) {
    whereClause += ` AND T0.CardCode IN (${cardCodes.map((code) => `'${code}'`).join(",")})`;
  }

  // ✅ Use contactCodes for salesperson login
  if (!isAdmin && cardCodes.length === 0 && contactCodes.length > 0) {
    whereClause += ` AND T0.SlpCode IN (${contactCodes.map((code) => `'${code}'`).join(",")})`;
  }

//  

  const query = `
    SELECT 
        -- Customer & Reference
        T0.NumAtCard AS [CustomerRefNo],
        
        -- Item Information
        T1.ItemCode AS [Item_No],
        T1.Dscription AS [Item_Service_Description],
        
        -- GRN Information
        CASE 
            WHEN OPDN.DocNum IS NULL THEN 'N/A'
            ELSE CAST(OPDN.DocNum AS VARCHAR(20))
        END AS [GRN_No],
        OPDN.DocDate AS [GRN_Date],
        
        -- Sales / Customer Information
        T5.SlpName AS [Sales_Person],
        T5.SlpCode AS [SlpCode],
        T0.CardName AS [Customer],
        T0.CardCode AS [CardCode],
        T6.Name AS [Contact_Person],
        T6.CntctCode AS [Contact_Person_Code],
        
        -- Vendor Information
        OPDN.CardName AS [Vendor_Name],
        OPDN.CardCode AS [Vendor_Code],
        
        -- SO Information
        T0.DocNum AS [SO_No],
        T0.DocDate AS [SO_Date],
        
        -- Chemical Information
        ISNULL(T1.U_CasNo, T3.U_CasNo) AS [Cas_No],
        
        -- Batch Information
        ISNULL(T15.BatchNum, '') AS [Batch_No],
        ISNULL(T15.U_VendorBatchNo, '') AS [VendorBatchNum],
        
        -- Vendor Catalog
        T3.SuppCatNum AS [Vendor_Catalog_No],
        T1.UnitMsr AS [PKZ],
        
        -- Pricing & Quantity
        T1.Quantity AS [Quantity],
        T1.Price AS [Unit_Price],
        T1.LineTotal AS [Total_Price],
        ISNULL(INV1.VatSum, T1.VatSum) AS [VatSum],
        (ISNULL(INV1.LineTotal, T1.LineTotal) + ISNULL(INV1.VatSum,0)) AS [Grand_Total],
        T4.ItmsGrpNam AS [Category],
        
        -- Invoice Information
        CASE 
            WHEN OINV.DocNum IS NULL THEN 'N/A'
            ELSE CAST(OINV.DocNum AS VARCHAR(20))
        END AS [Invoice_No],
        OINV.DocDate AS [Invoice_Date],
        
        -- Dispatch & Transport
        OINV.U_DispatchDate AS [Dispatch_Date],
        SHP.TrnspName AS [Transport],
        OINV.TrackNo AS [Tracking_No],
        
        -- Marketing
        T1.U_mkt_feedback AS [MKT_Feedback],

        -- PO Information (latest one, optional)
        (SELECT TOP 1 A.DocNum
         FROM OPOR A 
         INNER JOIN POR1 B ON A.DocEntry = B.DocEntry
         WHERE A.DocNum = PDN1.BaseRef AND PDN1.BaseLine = B.LineNum
         ORDER BY A.DocDate DESC
        ) AS [PO_No],

        (SELECT TOP 1 A.DocDate
         FROM OPOR A 
         INNER JOIN POR1 B ON A.DocEntry = B.DocEntry
         WHERE A.DocNum = PDN1.BaseRef AND PDN1.BaseLine = B.LineNum
         ORDER BY A.DocDate DESC
        ) AS [PO_Date],

        -- Date Differences
        ISNULL(DATEDIFF(DAY, 
                 (SELECT TOP 1 A.DocDate
                  FROM OPOR A 
                  INNER JOIN POR1 B ON A.DocEntry = B.DocEntry
                  WHERE A.DocNum = PDN1.BaseRef AND PDN1.BaseLine = B.LineNum
                  ORDER BY A.DocDate DESC
                 ), OPDN.DocDate), NULL) AS [PO_to_GRN_Days],

        ISNULL(DATEDIFF(DAY, OPDN.DocDate, OINV.DocDate), NULL) AS [GRN_to_Invoice_Days],

        ISNULL(DATEDIFF(DAY, OINV.DocDate, OINV.U_DispatchDate), NULL) AS [Invoice_to_Dispatch_Days]

    FROM ORDR T0
    INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry
    INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
    INNER JOIN OCPR T6 ON T0.CntctCode = T6.CntctCode
    LEFT JOIN OITM T3 ON T1.ItemCode = T3.ItemCode
    LEFT JOIN OITB T4 ON T3.ItmsGrpCod = T4.ItmsGrpCod
    LEFT JOIN OLCT T2 ON T1.LocCode = T2.Code

    -- Delivery Note Chain
    LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                  AND T1.LineNum = DLN1.BaseLine 
                  AND DLN1.BaseType = 17
    LEFT JOIN ODLN ON DLN1.DocEntry = ODLN.DocEntry

    -- Invoice Chain
    LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                  AND DLN1.LineNum = INV1.BaseLine 
                  AND INV1.BaseType = 15
    LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry 
                  AND OINV.CANCELED = 'N'

    -- Purchase Order & GRN
    LEFT JOIN POR1 ON T1.ItemCode = POR1.ItemCode  
    LEFT JOIN PDN1 ON POR1.DocEntry = PDN1.BaseEntry 
                  AND POR1.LineNum = PDN1.BaseLine 
                  AND PDN1.BaseType = 22
    LEFT JOIN OPDN ON PDN1.DocEntry = OPDN.DocEntry 
                  AND OPDN.CANCELED = 'N'

    -- Batch Information
    LEFT JOIN IBT1 T4_batch ON T4_batch.BaseEntry = DLN1.DocEntry 
                           AND T4_batch.BaseType = 15 
                           AND T4_batch.BaseLinNum = DLN1.LineNum 
                           AND T4_batch.ItemCode = T1.ItemCode
    LEFT JOIN OIBT T15 ON T4_batch.ItemCode = T15.ItemCode 
                       AND T4_batch.BatchNum = T15.BatchNum

    -- Transport Information
    LEFT JOIN OSHP SHP ON OINV.TrnspCode = SHP.TrnspCode

    WHERE ${whereClause}
    ORDER BY [PO_Date] DESC;
  `;

  try {
    const results = await queryDatabase(query);
    return results;
  } catch (error) {
    console.error("Error fetching sales orders from database:", error);
    throw error;
  }
}
