// pages/api/products/index.js
import { getProductsFromDatabase } from "../../../lib/models/products";
import { getCache, setCache } from "../../../lib/redis"; // Import caching functions

export default async function handler(req, res) {
  if (req.method === "GET") {
    const {
      page = 1,
      search = "",
      sortField = "ItemCode",
      sortDir = "asc",
      status = "all",
      category = "", // <-- Added category filter
    } = req.query;

    const ITEMS_PER_PAGE = 20;
    const pageNumber = parseInt(page, 10);
    const validPageNumber =
      Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
    const offset = (validPageNumber - 1) * ITEMS_PER_PAGE;

    // Build a unique cache key using the query parameters
    const cacheKey = `products:api:${validPageNumber}:${search}:${sortField}:${sortDir}:${status}:${category}`;

    try {
      // Check if cached data exists
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        console.log("Products API cache hit");
        return res.status(200).json(cachedData);
      }

      // Fetch products from the database
      const productsData = await getProductsFromDatabase({
        search,
        category, // <-- Pass the category parameter here
        sortField,
        sortDir,
        offset,
        ITEMS_PER_PAGE,
        status,
      });

      // Cache the response for 60 seconds
      await setCache(cacheKey, productsData, 60);

      res.status(200).json(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
