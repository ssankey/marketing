
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { casNo = "", itemName = "", catNo = "" } = req.query;

  try {
    let whereClause = "1=1";
    const parameters = [];

    // ✅ Require at least one filter
    if (!casNo && !itemName && !catNo) {
      return res.status(400).json({
        message:
          "At least one filter (casNo, itemName, or catNo) must be provided.",
      });
    }

    if (casNo) {
      whereClause += " AND T0.U_CasNo = @casNo";
      parameters.push({ name: "casNo", type: sql.NVarChar, value: casNo });
    }

    if (itemName) {
      whereClause += " AND T0.ItemName = @itemName";
      parameters.push({
        name: "itemName",
        type: sql.NVarChar,
        value: itemName,
      });
    }

    if (catNo) {
      whereClause += " AND T0.U_ALTCAT = @catNo";
      parameters.push({ name: "catNo", type: sql.NVarChar, value: catNo });
    }

    const query = `
      SELECT 
        'Density Pharmachem' AS [Vendor Name],
        'HYD' AS [VendorLocation],
        CASE WHEN ISNUMERIC(T4.[U_Quantity]) = 1 THEN CAST(T4.[U_Quantity] AS DECIMAL(18,2)) ELSE NULL END AS [Packsize],
        CASE WHEN ISNUMERIC(T4.[U_Price]) = 1 THEN CAST(T4.[U_Price] AS DECIMAL(18,2)) ELSE NULL END AS [Unit Price],
        CASE WHEN (CASE WHEN ISNUMERIC(T2.[OnHand]) = 1 THEN CAST(T2.[OnHand] AS DECIMAL(18,2)) ELSE 0 END) > 0 
             
             THEN 'Yes' ELSE 'No' END AS [InStock],
        T0.[ItemName],
        T4.[U_UOM],
        T0.[U_CasNo] AS Cas,
        'INR' AS [Vendor Currency],
        'HYD' AS [UniqueIdofItem],
        'China' AS [Country],
        CASE WHEN ISNUMERIC(T2.[OnHand]) = 1 THEN CAST(T2.[OnHand] AS DECIMAL(18,2)) ELSE NULL END AS [Quantity Available],
       
        T0.[U_Smiles],
        '' AS [Expected Delivery Date],
        T0.[U_ALTCAT] AS [Cat No]
      FROM [dbo].[OITM] T0
      INNER JOIN [dbo].[OITW] T2 ON T0.[ItemCode] = T2.[ItemCode]
      INNER JOIN [dbo].[@PRICING_H] T3 ON T0.ItemCode = T3.U_Code
      INNER JOIN [dbo].[@PRICING_R] T4 ON T3.DocEntry = T4.DocEntry
      WHERE ${whereClause}
      ORDER BY CASE WHEN ISNUMERIC(T4.U_Quantity) = 1 THEN CAST(T4.U_Quantity AS DECIMAL(18,2)) ELSE 0 END;
    `;

    const items = await queryDatabase(query, parameters);
    res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching item data:", error);
    res.status(500).json({
      message: "Failed to fetch item data",
      error: error.message,
    });
  }
}