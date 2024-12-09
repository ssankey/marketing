// pages/api/getAllQuotations.js
import { getAllOpenOrders } from "lib/models/excel-function";

export default async function handler(req, res) {
  try {
    const data = await getAllOpenOrders();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching open orders:", error);
    res.status(500).json({ error: "Failed to open orders." });
  }
}
