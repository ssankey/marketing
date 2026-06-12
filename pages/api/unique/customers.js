// // pages/api/unique/customers.js
// import { queryDatabase } from "../../../lib/db";

// export default async function handler(req, res) {
//   try {
//     const query = `
//       SELECT DISTINCT 
//           CardCode, 
//           CardName
//       FROM OCRD
//       WHERE CardType = 'C'
//       ORDER BY CardName;
//     `;
//     const results = await queryDatabase(query);
//     res.status(200).json({ data: results || [] });
//   } catch (error) {
//     console.error("Error fetching customers:", error);
//     res.status(500).json({ error: "Failed to fetch customers" });
//   }
// }


import { queryDatabase } from "../../../lib/db";
import { setCorsHeaders } from "../../../lib/cors";

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  try {
    const query = `
      SELECT DISTINCT CardCode, CardName
      FROM OCRD
      WHERE CardType = 'C'
      ORDER BY CardName;
    `;
    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
}