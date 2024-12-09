// pages/api/getAllQuotations.js
import { getAllProducts } from "lib/models/excel-function";

export default async function handler(req, res) {
  try {
    const data = await getAllProducts();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products." });
  }
}
