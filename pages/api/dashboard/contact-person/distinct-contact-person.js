// pages/api/dashboard/contact-person/distinct-contact-person.js
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
        SELECT CntctCode, Name, E_MailL
        FROM OCPR
        WHERE Name LIKE @SearchTerm
        ORDER BY Name ASC
      `
      : `
        SELECT CntctCode, Name, E_MailL
        FROM OCPR
        ORDER BY Name ASC
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

    const contactPersons = results.map((row) => ({
      value: row.CntctCode,
      label: `${row.Name} (${row.E_MailL || "No Email"})`,
      email: row.E_MailL,
    }));

    res.status(200).json({ contactPersons });
  } catch (error) {
    console.error("Error fetching contact persons:", error);
    res.status(500).json({ message: "Failed to fetch contact persons" });
  }
}
