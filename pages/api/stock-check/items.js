// pages/api/stock-check/items.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { casNumbers } = req.body;

    if (!casNumbers || !Array.isArray(casNumbers) || casNumbers.length === 0) {
      return res.status(400).json({
        message: "CAS numbers array is required",
      });
    }

    // Filter out empty CAS numbers
    const validCasNumbers = casNumbers.filter(cas => cas && cas.trim() !== '');
    
    if (validCasNumbers.length === 0) {
      return res.status(400).json({
        message: "At least one valid CAS number is required",
      });
    }

    // Create parameters for the query
    const parameters = [];
    let casWhereClause = "";
    
    if (validCasNumbers.length === 1) {
      casWhereClause = "T0.U_CasNo = @casNo0";
      parameters.push({ name: "casNo0", type: sql.NVarChar, value: validCasNumbers[0] });
    } else {
      casWhereClause = validCasNumbers.map((cas, index) => `@casNo${index}`).join(", ");
      casWhereClause = `T0.U_CasNo IN (${casWhereClause})`;
      
      validCasNumbers.forEach((cas, index) => {
        parameters.push({ name: `casNo${index}`, type: sql.NVarChar, value: cas });
      });
    }

    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY T0.ItemCode) AS SLNO,
        T0.U_CasNo AS CAS,
        T0.ItemName AS [Description],
        T0.U_ALTCAT AS Cat_No,
        ISNULL(T4.U_Quantity, 0) AS Quantity,
        T4.U_UOM AS UOM,
        ISNULL(T2.OnHand, 0) AS [Stock In India],
        ISNULL(T0.U_ChinaStock, 0) AS [China Stock],
        CASE 
          WHEN ISNULL(T0.U_SignalWord,'') <> '' 
              OR ISNULL(T0.U_HazardPictograms,'') <> '' 
              OR ISNULL(T0.U_HazardStatement,'') <> '' 
          THEN 'HAZ'
          ELSE 'Non HAZ'
        END AS [HAZ / Non HAZ],
        ISNULL(T4.U_Price, 0) AS Price
      FROM OITM T0
      LEFT JOIN OITW T2 ON T0.ItemCode = T2.ItemCode
      LEFT JOIN [@PRICING_H] T3 ON T0.ItemCode = T3.U_Code
      LEFT JOIN [@PRICING_R] T4 ON T3.DocEntry = T4.DocEntry
      WHERE ${casWhereClause}
      ORDER BY T0.ItemCode;
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