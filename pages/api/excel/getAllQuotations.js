// pages/api/getAllQuotations.js
import { getAllQuotations } from "lib/models/excel-function";

export default async function handler(req, res) {
  try {
    const data = await getAllQuotations();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ error: "Failed to fetch quotations." });
  }
}
