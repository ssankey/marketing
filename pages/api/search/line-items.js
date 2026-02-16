// // pages/api/line-items.js
// import { queryDatabase } from '../../../lib/db'; // Adjust the import path
// import sql from 'mssql';

// export default async function handler(req, res) {
//   if (req.method === 'GET') {
//     const { docNum, category } = req.query;

//     // Validate required parameters
//     if (!docNum || !category) {
//       return res.status(400).json({ error: 'DocNum and category parameters are required' });
//     }

//     try {
//       const params = [{ name: 'docNum', type: sql.Int, value: parseInt(docNum) }];
//       let query = '';
//       let headerData = [];

//       if (category === 'Invoice') {
//         // Invoice line items query
//         query = `
//           SELECT 
//               T13.DocNum AS 'SO No',
//               T1.ItemCode AS 'Item No',
//               T1.Dscription AS 'Description',
//               T1.U_CasNo AS 'Cas No',
//               CASE 
//                   WHEN T0.U_DispatchDate IS NOT NULL THEN 
//                       CONVERT(VARCHAR(10), T0.U_DispatchDate, 120) + ' - ' + ISNULL(T0.TrackNo, 'No Tracking')
//                   ELSE 'Dispatch Pending'
//               END AS 'Status',
//               T1.LineTotal AS 'Total Value'
//           FROM OINV T0
//           INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
//           LEFT JOIN DLN1 T2 ON T1.BaseEntry = T2.DocEntry AND T1.BaseLine = T2.LineNum AND T1.BaseType = 15
//           LEFT JOIN RDR1 T12 ON T2.BaseEntry = T12.DocEntry AND T2.BaseLine = T12.LineNum AND T2.BaseType = 17
//           LEFT JOIN ORDR T13 ON T12.DocEntry = T13.DocEntry
//           WHERE T0.DocNum = @docNum
//           ORDER BY T1.LineNum;
//         `;
        
//         headerData = ['SO No', 'Item No', 'Description', 'Cas No', 'Status', 'Total Value'];
//       } else if (category === 'Order') {
//         // Order line items query
//         query = `
//           SELECT 
//               T1.ItemCode AS 'Item No',
//               T1.Dscription AS 'Description',
//               OITM.U_CasNo AS 'Cas No',
//               CASE 
//                   WHEN OINV.DocNum IS NOT NULL THEN 'Invoiced - ' + CAST(OINV.DocNum AS VARCHAR(20))
//                   ELSE 'Not invoiced'
//               END AS 'Status'
//           FROM RDR1 T1
//           LEFT JOIN OITM ON T1.ItemCode = OITM.ItemCode
//           LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
//                         AND T1.LineNum = DLN1.BaseLine 
//                         AND DLN1.BaseType = 17
//           LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
//                         AND DLN1.LineNum = INV1.BaseLine 
//                         AND INV1.BaseType = 15
//           LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
//           WHERE T1.DocEntry = (SELECT DocEntry FROM ORDR WHERE DocNum = @docNum)
//           ORDER BY T1.LineNum;
//         `;
        
//         headerData = ['Item No', 'Description', 'Cas No', 'Status'];
//       } else {
//         return res.status(400).json({ error: 'Invalid category. Must be Invoice or Order' });
//       }

//       // Execute the query
//       const results = await queryDatabase(query, params);

//       // Format the results
//       const formattedResults = [];

//       // Add header row
//       formattedResults.push({
//         type: 'header',
//         category: category,
//         data: headerData
//       });

//       // Add data rows
//       if (results && results.length > 0) {
//         results.forEach(row => {
//           const dataRow = [];
          
//           if (category === 'Invoice') {
//             dataRow.push(
//               row['SO No'] || '',
//               row['Item No'] || '',
//               row['Description'] || '',
//               row['Cas No'] || '',
//               row['Status'] || '',
//               row['Total Value'] || 0
//             );
//           } else if (category === 'Order') {
//             dataRow.push(
//               row['Item No'] || '',
//               row['Description'] || '',
//               row['Cas No'] || '',
//               row['Status'] || ''
//             );
//           }

//           formattedResults.push({
//             type: 'data',
//             category: category,
//             data: dataRow
//           });
//         });
//       }

//       res.status(200).json(formattedResults);
//     } catch (error) {
//       console.error('Database error:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   } else {
//     res.status(405).json({ error: 'Method Not Allowed' });
//   }
// }


// pages/api/search/line-items.js
import { queryDatabase } from '../../../lib/db';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { docNum, category } = req.query;

    // Validate required parameters
    if (!docNum || !category) {
      return res.status(400).json({ error: 'DocNum and category parameters are required' });
    }

    try {
      const params = [{ name: 'docNum', type: sql.Int, value: parseInt(docNum) }];
      let query = '';
      let headerData = [];

      if (category === 'Invoice') {
        // Invoice line items query - UPDATED
        query = `
          SELECT 
              T13.DocNum AS 'SO No',
              T1.ItemCode AS 'Item No',
              T1.Dscription AS 'Description',
              T1.U_CasNo AS 'Cas No',
              T0.TrackNo AS 'Tracking No',
              T0.U_AirlineName AS 'Courier Service',
              CASE 
                  WHEN T0.U_DispatchDate IS NOT NULL THEN 'Dispatched'
                  ELSE 'Dispatch Pending'
              END AS 'Dispatch Status',
              T0.U_DispatchDate AS 'Dispatch Date',
              T1.LineTotal AS 'Total Value'
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          LEFT JOIN DLN1 T2 ON T1.BaseEntry = T2.DocEntry AND T1.BaseLine = T2.LineNum AND T1.BaseType = 15
          LEFT JOIN RDR1 T12 ON T2.BaseEntry = T12.DocEntry AND T2.BaseLine = T12.LineNum AND T2.BaseType = 17
          LEFT JOIN ORDR T13 ON T12.DocEntry = T13.DocEntry
          WHERE T0.DocNum = @docNum
          ORDER BY T1.LineNum;
        `;
        
        headerData = ['SO No', 'Item No', 'Description', 'Cas No', 'Tracking No', 'Courier Service', 'Dispatch Status', 'Dispatch Date', 'Total Value'];
        
      } else if (category === 'Order') {
        // Order line items query
        query = `
          SELECT 
              T1.ItemCode AS 'Item No',
              T1.Dscription AS 'Description',
              OITM.U_CasNo AS 'Cas No',
              CASE 
                  WHEN OINV.DocNum IS NOT NULL THEN 'Invoiced - ' + CAST(OINV.DocNum AS VARCHAR(20))
                  ELSE 'Not invoiced'
              END AS 'Status'
          FROM RDR1 T1
          LEFT JOIN OITM ON T1.ItemCode = OITM.ItemCode
          LEFT JOIN DLN1 ON T1.DocEntry = DLN1.BaseEntry 
                        AND T1.LineNum = DLN1.BaseLine 
                        AND DLN1.BaseType = 17
          LEFT JOIN INV1 ON DLN1.DocEntry = INV1.BaseEntry 
                        AND DLN1.LineNum = INV1.BaseLine 
                        AND INV1.BaseType = 15
          LEFT JOIN OINV ON INV1.DocEntry = OINV.DocEntry AND OINV.CANCELED = 'N'
          WHERE T1.DocEntry = (SELECT DocEntry FROM ORDR WHERE DocNum = @docNum)
          ORDER BY T1.LineNum;
        `;
        
        headerData = ['Item No', 'Description', 'Cas No', 'Status'];
        
      } else {
        return res.status(400).json({ error: 'Invalid category. Must be Invoice or Order' });
      }

      // Execute the query
      const results = await queryDatabase(query, params);

      // Format the results
      const formattedResults = [];

      // Add header row
      formattedResults.push({
        type: 'header',
        category: category,
        data: headerData
      });

      // Add data rows
      if (results && results.length > 0) {
        results.forEach(row => {
          const dataRow = [];
          
          if (category === 'Invoice') {
            dataRow.push(
              row['SO No'] || '',
              row['Item No'] || '',
              row['Description'] || '',
              row['Cas No'] || '',
              row['Tracking No'] || '',
              row['Courier Service'] || '',
              row['Dispatch Status'] || '',
              row['Dispatch Date'] || '',
              row['Total Value'] || 0
            );
          } else if (category === 'Order') {
            dataRow.push(
              row['Item No'] || '',
              row['Description'] || '',
              row['Cas No'] || '',
              row['Status'] || ''
            );
          }

          formattedResults.push({
            type: 'data',
            category: category,
            data: dataRow
          });
        });
      }

      res.status(200).json(formattedResults);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}