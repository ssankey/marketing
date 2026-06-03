// // pages/api/unique/products.js
// import { queryDatabase } from "../../../lib/db";

// export default async function handler(req, res) {
//   try {
//     const query = `
//       SELECT DISTINCT 
//           ItemCode, 
//           ItemName, 
//           ISNULL(U_CasNo, '') AS CasNo
//       FROM OITM
//       ORDER BY ItemName;
//     `;
//     const results = await queryDatabase(query);
//     res.status(200).json({ data: results || [] });
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     res.status(500).json({ error: "Failed to fetch products" });
//   }
// }


// pages/api/unique/products.js
// Server-side search — never returns all 2L products at once
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const { search = "" } = req.query;

    // Require at least 2 chars to search, else return empty
    if (!search || search.trim().length < 2) {
      return res.status(200).json({ data: [] });
    }

    const term = `%${search.trim()}%`;

    const query = `
      SELECT TOP 50
        ItemCode,
        ItemName,
        ISNULL(U_CasNo, '') AS CasNo
      FROM OITM
      WHERE
        ItemCode  LIKE '${term.replace(/'/g, "''")}'
        OR ItemName LIKE '${term.replace(/'/g, "''")}'
        OR U_CasNo  LIKE '${term.replace(/'/g, "''")}'
      ORDER BY ItemName;
    `;

    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}