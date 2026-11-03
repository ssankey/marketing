// pages/api/labels/print.js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { docEntry, docNum } = req.query;

  if (!docEntry || !docNum) {
    return res.status(400).json({ 
      message: 'docEntry and docNum are required' 
    });
  }

  try {
    const query = `
      SELECT 
        T1.ItemCode                            AS [ItemCode],
        ITM.U_ALTCAT                           AS [CatNo],
        T1.U_PackSize                          AS [PackSize],
        ISNULL(T15.U_vendorbatchno, '')        AS [VendorBatchNo],
        ITMGRP.ItmsGrpNam                      AS [CategoryName]
      FROM OINV T0
      INNER JOIN INV1 T1 ON T1.DocEntry = T0.DocEntry
      LEFT JOIN DLN1 T2 ON T2.DocEntry = T1.BaseEntry 
                       AND T2.LineNum = T1.BaseLine 
                       AND T1.BaseType = 15
      LEFT JOIN ODLN T3 ON T3.DocEntry = T2.DocEntry
      LEFT JOIN IBT1 T10 ON T10.CardCode = T3.CardCode 
                        AND T10.ItemCode = T2.ItemCode 
                        AND T10.BaseNum = T3.DocNum 
                        AND T10.BaseEntry = T3.DocEntry 
                        AND T10.BaseType = 15 
                        AND T10.BaseLinNum = T2.LineNum 
                        AND T10.Direction = 1
      LEFT JOIN OIBT T15 ON T10.ItemCode = T15.ItemCode 
                        AND T10.BatchNum = T15.BatchNum
      LEFT JOIN OITM ITM ON T1.ItemCode = ITM.ItemCode
      LEFT JOIN OITB ITMGRP ON ITM.ItmsGrpCod = ITMGRP.ItmsGrpCod
      WHERE T0.DocEntry = @docEntry AND T0.DocNum = @docNum
      ORDER BY T1.LineNum ASC
    `;

    const params = [
      { name: 'docEntry', type: sql.Int, value: parseInt(docEntry) },
      { name: 'docNum', type: sql.Int, value: parseInt(docNum) }
    ];

    const results = await queryDatabase(query, params);

    if (results.length === 0) {
      return res.status(404).json({ 
        message: 'No label data found for this invoice' 
      });
    }

    // Format the data for the modal
    const labelData = results.map(row => ({
      itemCode: row.ItemCode,
      catNo: row.CatNo || 'N/A',
      packSize: row.PackSize || 'N/A',
      batchNum: row.VendorBatchNo || 'N/A',
      category: row.CategoryName || 'N/A'
    }));

    res.status(200).json({
      success: true,
      data: labelData,
      count: labelData.length
    });

  } catch (error) {
    console.error('Error in label print API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}