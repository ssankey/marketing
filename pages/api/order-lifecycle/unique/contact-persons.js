// pages/api/order-lifecycle/unique/contact-persons.js
import { queryDatabase } from "../../../../lib/db";

export default async function handler(req, res) {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT DISTINCT Name AS ContactPerson, CntctCode
      FROM OCPR
      WHERE Name IS NOT NULL
      ORDER BY ContactPerson
    `;

    if (type === 'po-to-grn') {
      query = `
        SELECT DISTINCT CP.Name AS ContactPerson, CP.CntctCode
        FROM OPOR PO
        JOIN OCPR CP ON PO.CntctCode = CP.CntctCode
        WHERE CP.Name IS NOT NULL
        ORDER BY CP.Name
      `;
    } else if (type === 'grn-to-invoice' || type === 'invoice-to-dispatch') {
      query = `
        SELECT DISTINCT CP.Name AS ContactPerson, CP.CntctCode
        FROM OINV
        JOIN OCPR CP ON OINV.CntctCode = CP.CntctCode
        WHERE CP.Name IS NOT NULL
        ORDER BY CP.Name
      `;
    }

    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching contact persons:", error);
    res.status(500).json({ error: "Failed to fetch contact persons" });
  }
}