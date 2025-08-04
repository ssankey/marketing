// // pages/api/invoices/public-detail.js
// import { queryDatabase } from "../../../lib/db";
// import sql from "mssql";

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   const { docEntry, docNum, refNo } = req.query;

//   if (!docEntry || !docNum) {
//     return res.status(400).json({ message: 'docEntry and docNum are required' });
//   }

//   try {
//     // Check if invoice exists
//     const checkQuery = `
//       SELECT NumAtCard 
//       FROM OINV 
//       WHERE DocEntry = @docEntry AND DocNum = @docNum
//     `;
//     const checkParams = [
//       { name: 'docEntry', type: sql.Int, value: parseInt(docEntry) },
//       { name: 'docNum', type: sql.Int, value: parseInt(docNum) }
//     ];
//     const checkResult = await queryDatabase(checkQuery, checkParams);

//     if (checkResult.length === 0) {
//       return res.status(404).json({ message: 'Invoice not found' });
//     }

//     const systemRefNo = checkResult[0].NumAtCard;

//     if (systemRefNo && systemRefNo.trim() !== '' && (!refNo || refNo.trim() === '')) {
//       return res.status(400).json({ message: 'Reference number required' });
//     }

//     const mainQuery = `
//       SELECT
//         T0.DocNum                  AS InvoiceNo,
//         T0.DocDate                 AS InvoiceDate,
//         T0.NumAtCard               AS CustomerPONo,
//         SHP.TrnspName              AS CarrierName,
//         T0.TrackNo                 AS TrackingNo,
//         T0.U_TrackingNoUpdateDT    AS TrackingUpdatedDate,
//         T0.U_DeliveryDate          AS DeliveryDate,

//         T1.ItemCode                AS Item_No,
//         T1.Dscription              AS ItemDescription,
//         T1.U_CasNo                 AS CasNo,
//         T1.UnitMsr                 AS Unit,
//         T1.U_PackSize              AS PackSize,
//         T1.Price                   AS UnitSalesPrice,
//         T1.Quantity                AS Qty,
//         T1.LineTotal               AS TotalSalesPrice,
//         ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum,

//         CASE 
//           WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND T1.ItemCode <> '' 
//           THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' + 
//                 LEFT(T1.ItemCode, CHARINDEX('-', T1.ItemCode + '-') - 1) + '_' + T15.U_vendorbatchno + '.pdf'
//           ELSE ''
//         END AS COA
//       FROM OINV T0
//       LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
//       INNER JOIN INV1 T1 ON T1.DocEntry = T0.DocEntry
//       LEFT JOIN DLN1 T2 ON T2.DocEntry = T1.BaseEntry AND T2.LineNum = T1.BaseLine AND T1.BaseType = 15
//       LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
//       LEFT JOIN RDR1 T8 ON T8.DocEntry = T2.BaseEntry AND T8.LineNum = T2.BaseLine AND T2.BaseType = 17
//       LEFT JOIN ORDR T4 ON T4.DocEntry = T8.DocEntry
//       LEFT JOIN OCPR T7 ON T0.CntctCode = T7.CntctCode
//       INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
//       INNER JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
//       INNER JOIN OCRD T9 ON T9.CardCode = T0.CardCode
//       LEFT JOIN IBT1 T10 ON T10.CardCode = T3.CardCode 
//         AND T10.ItemCode = T2.ItemCode 
//         AND T10.BaseNum = T3.DocNum 
//         AND T10.BaseEntry = T3.DocEntry 
//         AND T10.BaseType = 15 
//         AND T10.BaseLinNum = T2.LineNum 
//         AND T10.Direction = 1
//       LEFT JOIN OIBT T15 ON T10.ItemCode = T15.ItemCode 
//         AND T10.BatchNum = T15.BatchNum
//       WHERE 
//         T0.DocEntry = @docEntry 
//         AND T0.DocNum = @docNum
//         ${systemRefNo && systemRefNo.trim() !== '' ? 'AND T0.NumAtCard = @refNo' : ''}
//       ORDER BY T1.LineNum
//     `;

//     const params = [
//       { name: 'docEntry', type: sql.Int, value: parseInt(docEntry) },
//       { name: 'docNum', type: sql.Int, value: parseInt(docNum) }
//     ];
//     if (systemRefNo && systemRefNo.trim() !== '') {
//       params.push({ name: 'refNo', type: sql.NVarChar, value: refNo.toString() });
//     }

//     const results = await queryDatabase(mainQuery, params);

//     if (results.length === 0) {
//       return res.status(404).json({ message: 'No matching line items found' });
//     }

//     const header = {
//       InvoiceNo: results[0].InvoiceNo,
//       InvoiceDate: results[0].InvoiceDate,
//       CustomerPONo: results[0].CustomerPONo,
//       CarrierName: results[0].CarrierName,
//       TrackingNo: results[0].TrackingNo,
//       TrackingUpdatedDate: results[0].TrackingUpdatedDate,
//       DeliveryDate: results[0].DeliveryDate
//     };


//     const checkFileExists = async (url) => {
//       if (!url || url.trim() === '') return false;

//       try {
//         const response = await fetch(url, { method: 'HEAD' });
//         return response.ok;
//       } catch (e) {
//         return false;
//       }
//     };

// const lineItems = await Promise.all(
//   results.map(async (row) => {
//     const coaExists = await checkFileExists(row.COA);

//     return {
//       ItemNo: row.Item_No,
//       ItemDescription: row.ItemDescription,
//       CasNo: row.CasNo,
//       Unit: row.Unit,
//       PackSize: row.PackSize,
//       UnitSalesPrice: row.UnitSalesPrice,
//       Qty: row.Qty,
//       TotalSalesPrice: row.TotalSalesPrice,
//       VendorBatchNum: row.VendorBatchNum,
//       COA: coaExists ? row.COA : ''
//     };
//   })
// );

//     res.status(200).json({
//       ...header,
//       LineItems: lineItems
//     });

//   } catch (error) {
//     console.error('Error in COA invoice detail API:', error);
//     res.status(500).json({
//       message: 'Internal server error',
//       error: error.message
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

  if (!docEntry || !docNum) {
    return res.status(400).json({ message: 'docEntry and docNum are required' });
  }

  try {
    // Check if invoice exists
    const checkQuery = `
      SELECT NumAtCard 
      FROM OINV 
      WHERE DocEntry = @docEntry AND DocNum = @docNum
    `;
    const checkParams = [
      { name: 'docEntry', type: sql.Int, value: parseInt(docEntry) },
      { name: 'docNum', type: sql.Int, value: parseInt(docNum) }
    ];
    const checkResult = await queryDatabase(checkQuery, checkParams);

    if (checkResult.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const systemRefNo = checkResult[0].NumAtCard;

    if (systemRefNo && systemRefNo.trim() !== '' && (!refNo || refNo.trim() === '')) {
      return res.status(400).json({ message: 'Reference number required' });
    }

    const mainQuery = `
      SELECT
        T0.DocNum                  AS InvoiceNo,
        T0.DocDate                 AS InvoiceDate,
        T0.NumAtCard               AS CustomerPONo,
        SHP.TrnspName              AS CarrierName,
        T0.TrackNo                 AS TrackingNo,
        T0.U_TrackingNoUpdateDT    AS TrackingUpdatedDate,
        T0.U_DeliveryDate          AS DeliveryDate,

        T1.ItemCode                AS Item_No,
        T1.Dscription              AS ItemDescription,
        T1.U_CasNo                 AS CasNo,
        T1.UnitMsr                 AS Unit,
        T1.U_PackSize              AS PackSize,
        T1.Price                   AS UnitSalesPrice,
        T1.Quantity                AS Qty,
        T1.LineTotal               AS TotalSalesPrice,
        ISNULL(T15.U_vendorbatchno, '') AS VendorBatchNum,

        CASE 
          WHEN ISNULL(T15.U_vendorbatchno, '') <> '' AND T1.ItemCode <> '' 
          THEN 'https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/' + 
                LEFT(T1.ItemCode, CHARINDEX('-', T1.ItemCode + '-') - 1) + '_' + T15.U_vendorbatchno + '.pdf'
          ELSE ''
        END AS COA
      FROM OINV T0
      LEFT JOIN OSHP SHP ON T0.TrnspCode = SHP.TrnspCode
      INNER JOIN INV1 T1 ON T1.DocEntry = T0.DocEntry
      LEFT JOIN DLN1 T2 ON T2.DocEntry = T1.BaseEntry AND T2.LineNum = T1.BaseLine AND T1.BaseType = 15
      LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
      LEFT JOIN RDR1 T8 ON T8.DocEntry = T2.BaseEntry AND T8.LineNum = T2.BaseLine AND T2.BaseType = 17
      LEFT JOIN ORDR T4 ON T4.DocEntry = T8.DocEntry
      LEFT JOIN OCPR T7 ON T0.CntctCode = T7.CntctCode
      INNER JOIN OSLP T5 ON T0.SlpCode = T5.SlpCode
      INNER JOIN OCTG T6 ON T0.GroupNum = T6.GroupNum
      INNER JOIN OCRD T9 ON T9.CardCode = T0.CardCode
      LEFT JOIN IBT1 T10 ON T10.CardCode = T3.CardCode 
        AND T10.ItemCode = T2.ItemCode 
        AND T10.BaseNum = T3.DocNum 
        AND T10.BaseEntry = T3.DocEntry 
        AND T10.BaseType = 15 
        AND T10.BaseLinNum = T2.LineNum 
        AND T10.Direction = 1
      LEFT JOIN OIBT T15 ON T10.ItemCode = T15.ItemCode 
        AND T10.BatchNum = T15.BatchNum
      WHERE 
        T0.DocEntry = @docEntry 
        AND T0.DocNum = @docNum
        ${systemRefNo && systemRefNo.trim() !== '' ? 'AND T0.NumAtCard = @refNo' : ''}
      ORDER BY T1.LineNum
    `;

    const params = [
      { name: 'docEntry', type: sql.Int, value: parseInt(docEntry) },
      { name: 'docNum', type: sql.Int, value: parseInt(docNum) }
    ];
    if (systemRefNo && systemRefNo.trim() !== '') {
      params.push({ name: 'refNo', type: sql.NVarChar, value: refNo.toString() });
    }

    const results = await queryDatabase(mainQuery, params);

    if (results.length === 0) {
      return res.status(404).json({ message: 'No matching line items found' });
    }

    const header = {
      InvoiceNo: results[0].InvoiceNo,
      InvoiceDate: results[0].InvoiceDate,
      CustomerPONo: results[0].CustomerPONo,
      CarrierName: results[0].CarrierName,
      TrackingNo: results[0].TrackingNo,
      TrackingUpdatedDate: results[0].TrackingUpdatedDate,
      DeliveryDate: results[0].DeliveryDate
    };

    const lineItems = results.map((row) => ({
      ItemNo: row.Item_No,
      ItemDescription: row.ItemDescription,
      CasNo: row.CasNo,
      Unit: row.Unit,
      PackSize: row.PackSize,
      UnitSalesPrice: row.UnitSalesPrice,
      Qty: row.Qty,
      TotalSalesPrice: row.TotalSalesPrice,
      VendorBatchNum: row.VendorBatchNum,
      COA: row.COA // Return the URL regardless of whether the file exists
    }));

    res.status(200).json({
      ...header,
      LineItems: lineItems
    });

  } catch (error) {
    console.error('Error in COA invoice detail API:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}