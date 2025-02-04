// import sql from "mssql";
// import { queryDatabase } from "../../../lib/db";


// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   const { search } = req.query;

//   try {
//     const query = search 
//       ? `
//         SELECT DISTINCT ItemName, ItemCode 
//         FROM OITM 
//         WHERE ItemName LIKE @SearchTerm OR ItemCode LIKE @SearchTerm 
//         ORDER BY ItemName ASC
//       `
//       : `SELECT DISTINCT ItemName, ItemCode FROM OITM ORDER BY ItemName ASC`;

//     const params = search 
//       ? [{ 
//           name: "SearchTerm", 
//           type: sql.NVarChar, 
//           value: `%${search}%` 
//         }] 
//       : [];

//     const results = await queryDatabase(query, params);

//     // Formatting response with value and label
//     const products = results.map((row) => ({
//       value: row.ItemCode, // ItemCode as value
//       label: row.ItemName, // ItemName as label
//     }));

//     res.status(200).json({ products });
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     res.status(500).json({ message: "Failed to fetch products" });
//   }
// }

import sql from "mssql";
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { search } = req.query;

    try {
        // Query to match both ItemCode and ItemName
        const query = search
            ? `
                SELECT DISTINCT ItemName, ItemCode,
                CASE 
                    WHEN ItemCode LIKE @SearchTerm THEN ItemCode
                    WHEN ItemName LIKE @SearchTerm THEN ItemName
                END AS MatchedLabel
                FROM OITM 
                WHERE ItemName LIKE @SearchTerm OR ItemCode LIKE @SearchTerm 
                ORDER BY ItemName ASC
              `
            : `SELECT DISTINCT ItemName, ItemCode FROM OITM ORDER BY ItemName ASC`;

        const params = search
            ? [{ 
                name: "SearchTerm", 
                type: sql.NVarChar, 
                value: `%${search}%` 
            }]
            : [];

        const results = await queryDatabase(query, params);

        // Format response based on match type
        const products = results.map((row) => ({
            value: row.ItemCode,  // Always keep ItemCode as value
            label: row.MatchedLabel, // Show the dynamically matched label
        }));

        res.status(200).json({ products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};
