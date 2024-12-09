// pages/api/getAllQuotations.js
import { getAllOrders } from "lib/models/excel-function";

export default async function handler(req, res) {
  try {
    const data = await getAllOrders();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
}
