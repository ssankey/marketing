// // pages/api/unique/categories.js
// import { queryDatabase } from "../../../lib/db";

// export default async function handler(req, res) {
//   try {
//     const query = `
//       SELECT DISTINCT 
//           ItmsGrpCod, 
//           ItmsGrpNam
//       FROM OITB
//       ORDER BY ItmsGrpNam;
//     `;
//     const results = await queryDatabase(query);
//     res.status(200).json({ data: results || [] });
//   } catch (error) {
//     console.error("Error fetching categories:", error);
//     res.status(500).json({ error: "Failed to fetch categories" });
//   }
// }

import { queryDatabase } from "../../../lib/db";
import { setCorsHeaders } from "../../../lib/cors";

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  try {
    const query = `
      SELECT DISTINCT ItmsGrpCod, ItmsGrpNam
      FROM OITB
      ORDER BY ItmsGrpNam;
    `;
    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
}