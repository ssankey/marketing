

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

    const query = `
      SELECT 
        'Density Pharmachem' AS [Vendor Name],
        'HYD' AS [VendorLocation],
        T4.[U_Quantity] AS [Packsize],
        T4.[U_Price] AS [Unit Price],
        CASE WHEN T2.[OnHand] > 0 THEN 'Yes' ELSE 'No' END AS [InStock],
        T0.[ItemName],
        T4.[U_UOM],
        T0.[U_CasNo] AS Cas,
        'INR' AS [Vendor Currency],
        'HYD' AS [UniqueIdofItem],
        'China' AS [Country],
        T2.[OnHand] AS [Quantity Available],
        T0.U_ChinaStock AS [China Quantity],
        T0.[U_Smiles],
        '' AS [Expected Delivery Date],
        T0.[U_ALTCAT] AS [Cat No]
      FROM [dbo].[OITM] T0
      INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
      INNER JOIN [dbo].[@PRICING_H] T3 ON T0.ItemCode = T3.U_Code
      INNER JOIN [dbo].[@PRICING_R] T4 ON T3.DocEntry = T4.DocEntry
      WHERE ${whereClause}
      ORDER BY T4.U_Quantity;
    `;

    const items = await queryDatabase(query);
    res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching item data:", error);
    res.status(500).json({ message: "Failed to fetch item data" });
  }
}
