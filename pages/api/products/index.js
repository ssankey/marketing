

// pages/api/products/index.js
import { getProductsFromDatabase } from "../../../lib/models/products";
import { getCache, setCache } from "../../../lib/redis";
import { verify } from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const {
      page = 1,
      search = "",
      sortField = "ItemCode",
      sortDir = "asc",
      status,
      category = "",
      getAll = false
    } = req.query;

    const ITEMS_PER_PAGE = 20;
    const pageNumber = parseInt(page, 10);
    const validPageNumber =
      Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
    const offset = (validPageNumber - 1) * ITEMS_PER_PAGE;

    // Get user role from JWT token - FIXED VERSION
    let userRole = "";
    try {
      // Check for token in multiple locations
      let token = null;
      
      // 1. Check Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } 
      // 2. Check cookies as fallback
      else if (req.headers.cookie) {
        const cookieMatch = req.headers.cookie.match(/token=([^;]+)/);
        if (cookieMatch) {
          token = cookieMatch[1];
        }
      }

      if (token) {
        const decoded = verify(token, process.env.JWT_SECRET);
        userRole = decoded.role || "";
        console.log("User role from token:", userRole);
      } else {
        console.log("No token found in request");
      }
    } catch (error) {
      console.error("Token verification error:", error);
    }

    // Build cache key including user role
    const cacheKey = `products:api:${userRole}:${validPageNumber}:${search}:${sortField}:${sortDir}:${status}:${category}:${getAll}`;

    try {
      // Check if cached data exists
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        console.log("Products API cache hit for role:", userRole);
        return res.status(200).json(cachedData);
      }

      // Fetch products from the database with user role
      const productsData = await getProductsFromDatabase({
        search,
        category,
        sortField,
        sortDir,
        offset: getAll ? 0 : offset,
        ITEMS_PER_PAGE,
        status,
        getAll: getAll === 'true',
        userRole // Pass the user role
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