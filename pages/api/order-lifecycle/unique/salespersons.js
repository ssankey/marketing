// pages/api/order-lifecycle/unique/salespersons.js
import { queryDatabase } from "../../../../lib/db";

export default async function handler(req, res) {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT DISTINCT T5.SlpName, T5.SlpCode
      FROM OSLP T5
      WHERE T5.SlpName IS NOT NULL
      ORDER BY T5.SlpName
    `;

    // If you want to filter by active sales persons in specific tables:
    if (type === 'po-to-grn') {
      query = `
        SELECT DISTINCT T5.SlpName, T5.SlpCode
        FROM OPOR PO
        JOIN OSLP T5 ON PO.SlpCode = T5.SlpCode
        WHERE T5.SlpName IS NOT NULL
        ORDER BY T5.SlpName
      `;
    } else if (type === 'grn-to-invoice' || type === 'invoice-to-dispatch') {
      query = `
        SELECT DISTINCT T5.SlpName, T5.SlpCode
        FROM OINV
        JOIN OSLP T5 ON OINV.SlpCode = T5.SlpCode
        WHERE T5.SlpName IS NOT NULL
        ORDER BY T5.SlpName
      `;
    }

    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching salespersons:", error);
    res.status(500).json({ error: "Failed to fetch salespersons" });
  }
}