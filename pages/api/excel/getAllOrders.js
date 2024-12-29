// pages/api/getAllQuotations.js
import { getAllOrders } from "lib/models/excel-function";

export default async function handler(req, res) {
  const {
    status = "all",
    search = "",
    sortField = "DocDate",
    sortDir = "desc",
    fromDate,
    toDate,
  } = req.query; // Extract filters from the query parameters

  try {
    const data = await getAllOrders({
      status,
      search,
      sortField,
      sortDir,
      fromDate,
      toDate,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
}
