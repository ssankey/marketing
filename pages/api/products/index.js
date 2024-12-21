

// pages/api/products/index.js
import { getProductsFromDatabase } from "../../../lib/models/products";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { page = 1, search = "", sortField = "ItemCode", sortDir = "asc" } = req.query;

    const ITEMS_PER_PAGE = 20;
    const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

    try {
      const productsData = await getProductsFromDatabase({ search, sortField, sortDir, offset, ITEMS_PER_PAGE });

      res.status(200).json(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}

