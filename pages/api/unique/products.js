// pages/api/unique/products.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const query = `
      SELECT DISTINCT 
          ItemCode, 
          ItemName, 
          ISNULL(U_CasNo, '') AS CasNo
      FROM OITM
      ORDER BY ItemName;
    `;
    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}
