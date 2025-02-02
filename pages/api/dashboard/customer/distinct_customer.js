import { queryDatabase } from "../../../../lib/db";
import sql from "mssql";


export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { search } = req.query; // Get search term from query parameters
  console.log("Search parameter:", search); // Debug log

  try {
    const query = search
      ? `
        SELECT CardCode, CardName
        FROM OCRD
        WHERE CardCode LIKE @SearchTerm OR CardName LIKE @SearchTerm
        ORDER BY CardCode ASC
      `
      : `
        SELECT CardCode, CardName
        FROM OCRD
        ORDER BY CardCode ASC
      `;

    const params = search
      ? [
          {
            name: "SearchTerm",
            // type: "nvarchar",
            type: sql.NVarChar, // Use sql.NVarChar for nvarchar type
            value: `%${search}%`,
          },
        ]
      : [];

    const results = await queryDatabase(query, params);

    const customers = results.map((row) => ({
      value: row.CardCode,
      label: `${row.CardCode} : ${row.CardName}`,
    }));

    res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
}
