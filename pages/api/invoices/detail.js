// pages/api/invoices/detail.js
import { getInvoiceDetail } from "../../../lib/models/invoices";

export default async function handler(req, res) {
  const { docEntry, docNum } = req.query;

  if (!docEntry || !docNum) {
    return res.status(400).json({ error: "Missing docEntry or docNum" });
  }

  try {
    const invoice = await getInvoiceDetail(docEntry, docNum);
    return res.status(200).json(invoice);
  } catch (error) {
    console.error("Failed to get invoice detail:", error);
    return res.status(500).json({ error: "Failed to fetch invoice detail" });
  }
}
