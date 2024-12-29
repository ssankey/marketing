// pages/api/getAllQuotations.js
import { getAllQuotations } from "lib/models/excel-function";

export default async function handler(req, res) {
  const {
    status = "all",
    search = "",
    sortField = "DocDate",
    sortDir = "desc",
    fromDate,
    toDate,
  } = req.query;

  try {
    const data = await getAllQuotations({
      status,
      search,
      sortField,
      sortDir,
      fromDate,
      toDate,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ error: "Failed to fetch quotations." });
  }
}
