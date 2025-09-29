// pages/api/unique/contact-persons.js
import { queryDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const query = `
      SELECT DISTINCT 
          CntctCode, 
          Name AS ContactPerson
      FROM OCPR
      WHERE Name IS NOT NULL
      ORDER BY ContactPerson;
    `;
    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching contact persons:", error);
    res.status(500).json({ error: "Failed to fetch contact persons" });
  }
}
