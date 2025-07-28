
// // pages/api/invoices/public-detail.js
// import { queryDatabase } from "../../../lib/db";
// import sql from "mssql";

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   const { docEntry, docNum, refNo } = req.query;

//   // Validate all required parameters
//   if (!docEntry || !docNum || !refNo) {
//     return res.status(400).json({ 
//       message: 'docEntry, docNum, and refNo are required parameters' 
//     });
//   }

//   try {
//     const query = `
//       SELECT
//         T0.DocNum AS InvoiceNo,
//         T0.DocDate AS InvoiceDate,
//         T0.CardName AS CustomerName,
//         T0.CardCode AS CustomerCode,
//         T5.SlpName AS SalesPersonName,
//         T6.PymntGroup AS PaymentTerms,
//         T0.NumAtCard AS CustomerPONo,
//         T1.ItemCode AS ItemNo,
//         T1.Dscription AS ItemDescription,
//         T1.U_CasNo AS CasNo,
//         T1.UnitMsr AS Unit,
//         T1.U_PackSize AS PackSize,
//         T1.Price AS UnitSalesPrice,
//         T1.Quantity AS Qty,
//         T1.LineTotal AS TotalSalesPrice,
//         ISNULL(T4.BatchNum, '') AS BatchNum,
//         ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum
//       FROM OINV T0
//       INNER JOIN INV1 T1 ON T1.DocEntry = T0.DocEntry
//       LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//       LEFT JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
//       -- Complex JOIN chain to get batch information
//       LEFT JOIN DLN1 T2 ON T2.ItemCode = T1.ItemCode 
//         AND T2.DocEntry = T1.BaseEntry 
//         AND T1.BaseType = 15 
//         AND T1.BaseLine = T2.LineNum
//       LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
//       LEFT JOIN IBT1 T4 ON T4.CardCode = T3.CardCode 
//         AND T4.ItemCode = T2.ItemCode 
//         AND T4.BaseNum = T3.DocNum 
//         AND T4.BaseEntry = T3.DocEntry 
//         AND T4.BaseType = 15 
//         AND T4.BaseLinNum = T2.LineNum 
//         AND T4.Direction = 1
//       LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode 
//         AND T4.BatchNum = T15.BatchNum
//       WHERE T0.DocEntry = @docEntry 
//         AND T0.DocNum = @docNum 
//         AND T0.NumAtCard = @refNo
//       ORDER BY T1.LineNum;
//     `;

//     // Parameters with refNo validation
//     const params = [
//       { name: 'docEntry', type: sql.Int, value: parseInt(docEntry) },
//       { name: 'docNum', type: sql.Int, value: parseInt(docNum) },
//       { name: 'refNo', type: sql.NVarChar, value: refNo.toString() }
//     ];

//     const results = await queryDatabase(query, params);
    
//     // Return specific error if no data found
//     if (results.length === 0) {
//       return res.status(404).json({ 
//         message: 'No dispatch details found for the provided parameters' 
//       });
//     }

//     // Structure the response
//     const invoiceHeader = {
//       InvoiceNo: results[0].InvoiceNo,
//       InvoiceDate: results[0].InvoiceDate,
//       CustomerName: results[0].CustomerName,
//       CustomerCode: results[0].CustomerCode,
//       SalesPersonName: results[0].SalesPersonName,
//       PaymentTerms: results[0].PaymentTerms,
//       CustomerPONo: results[0].CustomerPONo
//     };

//     // Map line items
//     const lineItems = results.map(row => ({
//       ItemNo: row.ItemNo,
//       ItemDescription: row.ItemDescription,
//       CasNo: row.CasNo,
//       Unit: row.Unit,
//       PackSize: row.PackSize,
//       UnitSalesPrice: row.UnitSalesPrice,
//       Qty: row.Qty,
//       TotalSalesPrice: row.TotalSalesPrice,
//       BatchNum: row.BatchNum,
//       VendorBatchNum: row.VendorBatchNum
//     }));

//     res.status(200).json({
//       ...invoiceHeader,
//       LineItems: lineItems
//     });
//   } catch (error) {
//     console.error('Error fetching public invoice details:', error);
//     res.status(500).json({ 
//       message: 'Error fetching invoice details', 
//       error: error.message,
//       stack: error.stack 
//     });
//   }
// }


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

    // Main query (same as before)
    const query = `
      SELECT
        T0.DocNum AS InvoiceNo,
        T0.DocDate AS InvoiceDate,
        T0.CardName AS CustomerName,
        T0.CardCode AS CustomerCode,
        T5.SlpName AS SalesPersonName,
        T6.PymntGroup AS PaymentTerms,
        T0.NumAtCard AS CustomerPONo,
        T1.ItemCode AS ItemNo,
        T1.Dscription AS ItemDescription,
        T1.U_CasNo AS CasNo,
        T1.UnitMsr AS Unit,
        T1.U_PackSize AS PackSize,
        T1.Price AS UnitSalesPrice,
        T1.Quantity AS Qty,
        T1.LineTotal AS TotalSalesPrice,
        ISNULL(T4.BatchNum, '') AS BatchNum,
        ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum
      FROM OINV T0
      INNER JOIN INV1 T1 ON T1.DocEntry = T0.DocEntry
      LEFT JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      LEFT JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
      -- Complex JOIN chain to get batch information
      LEFT JOIN DLN1 T2 ON T2.ItemCode = T1.ItemCode 
        AND T2.DocEntry = T1.BaseEntry 
        AND T1.BaseType = 15 
        AND T1.BaseLine = T2.LineNum
      LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
      LEFT JOIN IBT1 T4 ON T4.CardCode = T3.CardCode 
        AND T4.ItemCode = T2.ItemCode 
        AND T4.BaseNum = T3.DocNum 
        AND T4.BaseEntry = T3.DocEntry 
        AND T4.BaseType = 15 
        AND T4.BaseLinNum = T2.LineNum 
        AND T4.Direction = 1
      LEFT JOIN OIBT T15 ON T4.ItemCode = T15.ItemCode 
        AND T4.BatchNum = T15.BatchNum
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

    // Structure the response
    const invoiceHeader = {
      InvoiceNo: results[0].InvoiceNo,
      InvoiceDate: results[0].InvoiceDate,
      CustomerName: results[0].CustomerName,
      CustomerCode: results[0].CustomerCode,
      SalesPersonName: results[0].SalesPersonName,
      PaymentTerms: results[0].PaymentTerms,
      CustomerPONo: results[0].CustomerPONo
    };

    // Map line items
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