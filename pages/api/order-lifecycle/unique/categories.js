// pages/api/order-lifecycle/unique/categories.js
import { queryDatabase } from "../../../../lib/db";

export default async function handler(req, res) {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT DISTINCT ItmsGrpNam, ItmsGrpCod
      FROM OITB
      WHERE ItmsGrpNam IS NOT NULL
      ORDER BY ItmsGrpNam
    `;

    if (type === 'po-to-grn') {
      query = `
        SELECT DISTINCT ITB.ItmsGrpNam, ITB.ItmsGrpCod
        FROM OPOR PO
        JOIN POR1 R1 ON PO.DocEntry = R1.DocEntry
        JOIN OITM ITM ON R1.ItemCode = ITM.ItemCode
        JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
        WHERE ITB.ItmsGrpNam IS NOT NULL
        ORDER BY ITB.ItmsGrpNam
      `;
    } else if (type === 'grn-to-invoice' || type === 'invoice-to-dispatch') {
      query = `
        SELECT DISTINCT ITB.ItmsGrpNam, ITB.ItmsGrpCod
        FROM OINV
        JOIN INV1 I1 ON OINV.DocEntry = I1.DocEntry
        JOIN OITM ITM ON I1.ItemCode = ITM.ItemCode
        JOIN OITB ITB ON ITM.ItmsGrpCod = ITB.ItmsGrpCod
        WHERE ITB.ItmsGrpNam IS NOT NULL
        ORDER BY ITB.ItmsGrpNam
      `;
    }

    const results = await queryDatabase(query);
    res.status(200).json({ data: results || [] });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
}