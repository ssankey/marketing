// pages/api/products/customers/[itemCode].js
import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

// Lists the actual customers behind a product's "No. of Customers" count on
// the Product Master table — same INV1/OINV join as the count itself
// (getProductsFromDatabase's salesStatsQuery), just returning names instead
// of a COUNT(DISTINCT ...).
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { itemCode } = req.query;
  if (!itemCode) {
    return res.status(400).json({ message: "itemCode is required" });
  }

  try {
    const query = `
      SELECT DISTINCT OINV.CardCode, OCRD.CardName
      FROM INV1
      INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
      LEFT JOIN OCRD ON OINV.CardCode = OCRD.CardCode
      WHERE INV1.ItemCode = @itemCode
      ORDER BY OCRD.CardName ASC;
    `;
    const params = [{ name: "itemCode", type: sql.NVarChar, value: itemCode }];

    const customers = await queryDatabase(query, params);
    res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching product customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
}
