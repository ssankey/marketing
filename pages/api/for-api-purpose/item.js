// import { queryDatabase } from "../../../lib/db";

// // export default async function handler(req, res) {
// //   if (req.method !== "GET") {
// //     return res.status(405).json({ message: "Method not allowed" });
// //   }

// //   const { casNo = "", itemName = "", catNo = "" } = req.query;

// //   try {
// //     let whereClause = "1=1";
// //     if (casNo) whereClause += ` AND T0.U_CasNo LIKE '%${casNo}%'`;
// //     if (itemName) whereClause += ` AND T0.ItemName LIKE '%${itemName}%'`;
// //     if (catNo) whereClause += ` AND T0.U_ALTCAT LIKE '%${catNo}%'`;

// //     const query = `
// //       SELECT
// //         'Density Pharmachem' AS [Vendor Name],
// //         'HYD' AS [VendorLocation],
// //         T4.[U_Quantity] AS [Packsize],
// //         T4.[U_Price] AS [Unit Price],
// //         CASE WHEN T2.[OnHand] > 0 OR T0.[U_ChinaStock] > 0 THEN 'Yes' ELSE 'No' END AS [InStock],
// //         T0.[ItemName],
// //         T4.[U_UOM],
// //         T0.[U_CasNo] AS Cas,
// //         'INR' AS [Vendor Currency],
// //         'HYD' AS [UniqueIdofItem],
// //         'China' AS [Country],
// //         T2.[OnHand] AS [Quantity Available],
// //         T0.U_ChinaStock AS [China Quantity],
// //         T0.[U_Smiles],
// //         '' AS [Expected Delivery Date],
// //         T0.[U_ALTCAT] AS [Cat No]
// //       FROM [dbo].[OITM] T0
// //       INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
// //       INNER JOIN [dbo].[@PRICING_H] T3 ON T0.ItemCode = T3.U_Code
// //       INNER JOIN [dbo].[@PRICING_R] T4 ON T3.DocEntry = T4.DocEntry
// //       WHERE ${whereClause}
// //      ORDER BY T4.U_Quantity;
// //     `;

// //     const items = await queryDatabase(query);
// //     res.status(200).json({ items });
// //   } catch (error) {
// //     console.error("Error fetching item data:", error);
// //     res
// //       .status(500)
// //       .json({ message: "Failed to fetch item data", error: error.message });

// //     // res.status(500).json({ message: "Failed to fetch item data" });
// //   }
// // }

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   const { casNo = "", itemName = "", catNo = "" } = req.query;

//   try {
//     // Build WHERE clause with parameters to prevent SQL injection
//     let whereClause = "1=1";
//     const params = [];

//     if (casNo) {
//       whereClause += ` AND T0.U_CasNo LIKE '%' + @casNo + '%'`;
//       params.push({ name: "casNo", value: casNo });
//     }
//     if (itemName) {
//       whereClause += ` AND T0.ItemName LIKE '%' + @itemName + '%'`;
//       params.push({ name: "itemName", value: itemName });
//     }
//     if (catNo) {
//       whereClause += ` AND T0.U_ALTCAT LIKE '%' + @catNo + '%'`;
//       params.push({ name: "catNo", value: catNo });
//     }

//     const query = `
//       SELECT
//         'Density Pharmachem' AS [Vendor Name],
//         'HYD' AS [VendorLocation],
//         CAST(T4.[U_Quantity] AS DECIMAL(18,2)) AS [Packsize],
//         CAST(T4.[U_Price] AS DECIMAL(18,2)) AS [Unit Price],
//         CASE
//           WHEN CAST(T2.[OnHand] AS DECIMAL(18,2)) > 0 OR CAST(T0.[U_ChinaStock] AS DECIMAL(18,2)) > 0
//           THEN 'Yes'
//           ELSE 'No'
//         END AS [InStock],
//         T0.[ItemName],
//         T4.[U_UOM],
//         T0.[U_CasNo] AS Cas,
//         'INR' AS [Vendor Currency],
//         'HYD' AS [UniqueIdofItem],
//         'China' AS [Country],
//         CAST(T2.[OnHand] AS DECIMAL(18,2)) AS [Quantity Available],
//         CAST(T0.U_ChinaStock AS DECIMAL(18,2)) AS [China Quantity],
//         T0.[U_Smiles],
//         '' AS [Expected Delivery Date],
//         T0.[U_ALTCAT] AS [Cat No]
//       FROM [dbo].[OITM] T0
//       INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
//       INNER JOIN [dbo].[@PRICING_H] T3 ON T0.ItemCode = T3.U_Code
//       INNER JOIN [dbo].[@PRICING_R] T4 ON T3.DocEntry = T4.DocEntry
//       WHERE ${whereClause}
//       ORDER BY CAST(T4.U_Quantity AS DECIMAL(18,2));
//     `;

//     const items = await queryDatabase(query, params);

//     if (items.length === 0) {
//       return res.status(404).json({
//         message: "No items found with the specified criteria",
//         query: req.query,
//       });
//     }

//     res.status(200).json({ items });
//   } catch (error) {
//     console.error("Error fetching item data:", error);
//     res.status(500).json({
//       message: "Failed to fetch item data",
//       error: error.message,
//       details: {
//         query: req.query,
//         stack: error.stack,
//       },
//     });
//   }
// }

import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { casNo = "", itemName = "", catNo = "" } = req.query;

  try {
    let whereClause = "1=1";
    if (casNo) whereClause += ` AND T0.U_CasNo LIKE '%${casNo}%'`;
    if (itemName) whereClause += ` AND T0.ItemName LIKE '%${itemName}%'`;
    if (catNo) whereClause += ` AND T0.U_ALTCAT LIKE '%${catNo}%'`;

    // Cast U_Quantity and U_Price to appropriate types to avoid conversion errors
    const query = `
      SELECT 
        'Density Pharmachem' AS [Vendor Name],
        'HYD' AS [VendorLocation],
        CAST(T4.[U_Quantity] AS DECIMAL(18,2)) AS [Packsize],
        CAST(T4.[U_Price] AS DECIMAL(18,2)) AS [Unit Price],
        CASE WHEN CAST(T2.[OnHand] AS DECIMAL(18,2)) > 0 OR CAST(T0.[U_ChinaStock] AS DECIMAL(18,2)) > 0 THEN 'Yes' ELSE 'No' END AS [InStock],
        T0.[ItemName],
        T4.[U_UOM],
        T0.[U_CasNo] AS Cas,
        'INR' AS [Vendor Currency],
        'HYD' AS [UniqueIdofItem],
        'China' AS [Country],
        CAST(T2.[OnHand] AS DECIMAL(18,2)) AS [Quantity Available],
        CAST(T0.U_ChinaStock AS DECIMAL(18,2)) AS [China Quantity],
        T0.[U_Smiles],
        '' AS [Expected Delivery Date],
        T0.[U_ALTCAT] AS [Cat No]
      FROM [dbo].[OITM] T0
      INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
      INNER JOIN [dbo].[@PRICING_H] T3 ON T0.ItemCode = T3.U_Code
      INNER JOIN [dbo].[@PRICING_R] T4 ON T3.DocEntry = T4.DocEntry
      WHERE ${whereClause}
      ORDER BY CAST(T4.U_Quantity AS DECIMAL(18,2));
    `;

    console.log("Executing query:", query);
    const items = await queryDatabase(query);
    console.log(`Found ${items.length} items`);
    res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching item data:", error);
    res.status(500).json({
      message: "Failed to fetch item data",
      error: error.message, // Return the actual error message for better debugging
    });
  }
}