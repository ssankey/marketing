// pages/api/getAllQuotations.js
import { getAllInvoices } from "lib/models/excel-function";

export default async function handler(req, res) {
  try {
    const data = await getAllInvoices();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices." });
  }
}
