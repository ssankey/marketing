
import { getAllCustomers } from "lib/models/excel-function";

export default async function handler(req, res) {
  try {
    const data = await getAllCustomers();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers." });
  }
}
