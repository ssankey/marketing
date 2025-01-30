// // pages/api/dashboard/salesperson/distinct_salesperson.js
// import { queryDatabase } from "../../../../lib/db";
// import sql from "mssql";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   const { search } = req.query;
//   console.log("Search parameter:", search);

//   try {
//     const query = search
//       ? `
//         SELECT CntctCode, Name
//         FROM OCPR
//         WHERE CntctCode LIKE @SearchTerm OR Name LIKE @SearchTerm
//         ORDER BY CntctCode ASC
//       `
//       : `
//         SELECT CntctCode, Name
//         FROM OCPR
//         ORDER BY CntctCode ASC
//       `;

//     const params = search
//       ? [
//           {
//             name: "SearchTerm",
//             type: sql.NVarChar,
//             value: `%${search}%`,
//           },
//         ]
//       : [];

//     const results = await queryDatabase(query, params);

//     const salespersons = results.map((row) => ({
//       value: row.CntctCode,
//       label: `${row.CntctCode} : ${row.Name}`,
//     }));

//     res.status(200).json({ salespersons });
//   } catch (error) {
//     console.error("Error fetching salespersons:", error);
//     res.status(500).json({ message: "Failed to fetch salespersons" });
//   }
// }

import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { search } = req.query;

  try {
    const query = search
      ? `
        SELECT SlpCode, SlpName
        FROM OSLP
        WHERE SlpName LIKE @SearchTerm
        ORDER BY SlpName ASC
      `
      : `
        SELECT SlpCode, SlpName
        FROM OSLP
        ORDER BY SlpName ASC
      `;

    const params = search
      ? [
          {
            name: "SearchTerm",
            type: sql.NVarChar,
            value: `%${search}%`,
          },
        ]
      : [];

    const results = await queryDatabase(query, params);

    const salesEmployees = results.map((row) => ({
      value: row.SlpCode,
      label: `${row.SlpName}`,
    }));

    res.status(200).json({ salesEmployees });
  } catch (error) {
    console.error("Error fetching sales employees:", error);
    res.status(500).json({ message: "Failed to fetch sales employees" });
  }
}














































