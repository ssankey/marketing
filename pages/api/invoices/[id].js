// pages/api/invoices/[id].js

import { queryDatabase } from "lib/db";

export default async function handler(req, res) {
  const { id } = req.query;

  const invoiceId = parseInt(id, 10);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  try {
    const query = `
      SELECT t0.*, t1.*
      FROM INV1 t0 
      INNER JOIN OINV t1 ON t0.DocEntry = t1.DocEntry
      WHERE t1.DocNum = @DocNum;
    `;

    const params = [{ name: "DocNum", type: sql.Int, value: invoiceId }];

    const data = await queryDatabase(query, params);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const safeDate = (dateString) => {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.toISOString();
    };

    const invoices = data.map((invoice) => ({
      ...invoice,
      CreateDate: safeDate(invoice.CreateDate),
      TaxDate: safeDate(invoice.TaxDate),
      AssetDate: safeDate(invoice.AssetDate),
      ShipDate: safeDate(invoice.ShipDate),
      DocDate: safeDate(invoice.DocDate),
      DocDueDate: safeDate(invoice.DocDueDate),
      ActDelDate: safeDate(invoice.ActDelDate),
      UpdateDate: safeDate(invoice.UpdateDate),
    }));

    res.status(200).json({ invoices });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
