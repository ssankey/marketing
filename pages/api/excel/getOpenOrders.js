// pages/api/getOpenOrders.js
import { getAllOpenOrders } from "lib/models/excel-function";

export default async function handler(req, res) {
  const {
    search = "",
    sortField = "DocNum",
    sortDir = "asc",
    fromDate,
    toDate,
    status="all"
  } = req.query; 

  try {
    const data = await getAllOpenOrders({
      search,
      sortField,
      sortDir,
      fromDate,
      toDate,
      status,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching open orders:", error);
    res.status(500).json({ error: "Failed to open orders." });
  }
}
