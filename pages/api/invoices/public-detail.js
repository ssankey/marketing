
// pages/api/invoices/public-detail.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { docEntry, docNum, refNo } = req.query;

  // First validate docEntry and docNum which are always required
  if (!docEntry || !docNum) {
    return res.status(400).json({ 
      message: 'No dispatch details found' 
    });
  }

  try {
    // First check if the invoice exists and whether it has a refNo in the system
    const checkQuery = `
      SELECT NumAtCard 
      FROM OINV 
      WHERE DocEntry = @docEntry 
        AND DocNum = @docNum
    `;
    
    const checkParams = [
      { name: 'docEntry', type: sql.Int, value: parseInt(docEntry) },
      { name: 'docNum', type: sql.Int, value: parseInt(docNum) }
    ];
    
    const checkResults = await queryDatabase(checkQuery, checkParams);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ 
        message: 'No dispatch details found' 
      });
    }
    
    const systemRefNo = checkResults[0].NumAtCard;
    
    // If the system has a refNo for this invoice, then require it in the query
    if (systemRefNo && systemRefNo.trim() !== '' && (!refNo || refNo.trim() === '')) {
      return res.status(400).json({ 
        message: 'No dispatch details found' 
      });
    }

    // Main query with transport details and batch information
    const query = `
      SELECT
        T0.DocNum                AS InvoiceNo,
        T0.DocDate               AS InvoiceDate,
        T4.DocNum                AS OrderNo,
        T4.DocDate               AS OrderDate,
        T0.TrackNo               AS TrackingNumber,
        T0.U_TrackingNoUpdateDT  AS TrackingUpdatedDate,
        T0.U_DispatchDate        AS DispatchDate,
        T0.U_DeliveryDate        AS DeliveryDate,
        T0.U_AirlineName         AS ShippingMethod,
        SHP.TrnspName            AS TransportName,
        T0.CardName              AS CustomerName,
        T0.CardCode              AS CustomerCode,
        T7.Name                  AS ContactPerson,
        T0.SlpCode               AS SalesPersonID,
        T5.SlpName               AS SalesPersonName,
        T5.Email                 AS SalesPersonEmail,
        T7.E_MailL               AS ContactPersonEmail,
        T6.PymntGroup            AS PaymentTerms,
        T0.NumAtCard             AS CustomerPONo,
        T1.ItemCode              AS ItemNo,
        T1.Dscription            AS ItemDescription,
        T1.U_CasNo               AS CasNo,
        T1.UnitMsr               AS Unit,
        T1.U_PackSize            AS PackSize,
        T1.Price                 AS UnitSalesPrice,
        T1.Quantity              AS Qty,
        T1.LineTotal             AS TotalSalesPrice,
        T9.E_Mail                AS CustomerEmail,
        ISNULL(T10.BatchNum, '') AS BatchNum,
        ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum
      FROM OINV T0
      LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
      INNER JOIN INV1 T1 ON T1.DocEntry = T0.DocEntry
      LEFT JOIN DLN1 T2 ON T2.DocEntry = T1.BaseEntry AND T2.LineNum = T1.BaseLine AND T1.BaseType = 15
      LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
      LEFT JOIN RDR1 T8 ON T8.DocEntry = T2.BaseEntry AND T8.LineNum = T2.BaseLine AND T2.BaseType = 17
      LEFT JOIN ORDR T4 ON T4.DocEntry = T8.DocEntry
      INNER JOIN OCRD T9 ON T9.CardCode = T0.CardCode
      LEFT JOIN OCPR T7 ON T0.CntctCode = T7.CntctCode
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      INNER JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
      -- Batch information joins
      LEFT JOIN IBT1 T10 ON T10.CardCode = T3.CardCode 
        AND T10.ItemCode = T2.ItemCode 
        AND T10.BaseNum = T3.DocNum 
        AND T10.BaseEntry = T3.DocEntry 
        AND T10.BaseType = 15 
        AND T10.BaseLinNum = T2.LineNum 
        AND T10.Direction = 1
      LEFT JOIN OIBT T15 ON T10.ItemCode = T15.ItemCode 
        AND T10.BatchNum = T15.BatchNum
      WHERE T0.DocEntry = @docEntry 
        AND T0.DocNum = @docNum 
        ${systemRefNo && systemRefNo.trim() !== '' ? 'AND T0.NumAtCard = @refNo' : ''}
      ORDER BY T1.LineNum;
    `;

    // Parameters with conditional refNo
    const params = [
      { name: 'docEntry', type: sql.Int, value: parseInt(docEntry) },
      { name: 'docNum', type: sql.Int, value: parseInt(docNum) }
    ];
    
    if (systemRefNo && systemRefNo.trim() !== '') {
      params.push({ name: 'refNo', type: sql.NVarChar, value: refNo.toString() });
    }

    const results = await queryDatabase(query, params);
    
    // Return specific error if no data found
    if (results.length === 0) {
      return res.status(404).json({ 
        message: 'No dispatch details found' 
      });
    }

    // Structure the response with all available fields
    const invoiceHeader = {
      InvoiceNo: results[0].InvoiceNo,
      InvoiceDate: results[0].InvoiceDate,
      OrderNo: results[0].OrderNo,
      OrderDate: results[0].OrderDate,
      CustomerName: results[0].CustomerName,
      CustomerCode: results[0].CustomerCode,
      SalesPersonName: results[0].SalesPersonName,
      PaymentTerms: results[0].PaymentTerms,
      CustomerPONo: results[0].CustomerPONo,
      TrackingNumber: results[0].TrackingNumber,
      TrackingUpdatedDate: results[0].TrackingUpdatedDate,
      DispatchDate: results[0].DispatchDate,
      DeliveryDate: results[0].DeliveryDate,
      ShippingMethod: results[0].ShippingMethod,
      TransportName: results[0].TransportName,
      ContactPerson: results[0].ContactPerson,
      SalesPersonEmail: results[0].SalesPersonEmail,
      ContactPersonEmail: results[0].ContactPersonEmail,
      CustomerEmail: results[0].CustomerEmail
    };

    // Map line items with batch information
    const lineItems = results.map(row => ({
      ItemNo: row.ItemNo,
      ItemDescription: row.ItemDescription,
      CasNo: row.CasNo,
      Unit: row.Unit,
      PackSize: row.PackSize,
      UnitSalesPrice: row.UnitSalesPrice,
      Qty: row.Qty,
      TotalSalesPrice: row.TotalSalesPrice,
      BatchNum: row.BatchNum,
      VendorBatchNum: row.VendorBatchNum
    }));

    res.status(200).json({
      ...invoiceHeader,
      LineItems: lineItems
    });
  } catch (error) {
    console.error('Error fetching public invoice details:', error);
    res.status(500).json({ 
      message: 'Error fetching invoice details', 
      error: error.message,
      stack: error.stack 
    });
  }
}