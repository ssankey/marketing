// pages/api/order-lifecycle/unique/customers.js
import { queryDatabase } from "../../../../lib/db";

export default async function handler(req, res) {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT DISTINCT CardName, CardCode
      FROM OCRD
      WHERE CardType = 'C' AND CardName IS NOT NULL
      ORDER BY CardName
    `;

    if (type === 'po-to-grn') {
      query = `
        SELECT DISTINCT C.CardName, C.CardCode
        FROM OPOR PO
        JOIN OCRD C ON PO.CardCode = C.CardCode
        WHERE C.CardName IS NOT NULL
        ORDER BY C.CardName
      `;
    } else if (type === 'grn-to-invoice' || type === 'invoice-to-dispatch') {
      query = `
        SELECT DISTINCT C.CardName, C.CardCode
        FROM OINV
        JOIN OCRD C ON OINV.CardCode = C.CardCode
        WHERE C.CardName IS NOT NULL
        ORDER BY C.CardName
      `;
    }

    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
}