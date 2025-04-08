// pages/api/open-orders.js

import { getOpenOrdersFromDatabase } from "../../../lib/models/orders";
import { parseISO, isValid } from "date-fns";
import { verify } from "jsonwebtoken";
import { getCache, setCache } from "../../../lib/redis"; // Import Redis caching functions

// Helper function to validate dates
function isValidDate(date) {
  return date && isValid(parseISO(date));
}

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   try {
//     // 1) Check for Authorization header
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         error: "Missing or malformed Authorization header",
//         received: authHeader,
//       });
//     }

//     // 2) Verify token
//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       console.error("Token verification failed:", err);
//       return res.status(401).json({ error: "Token verification failed" });
//     }

//     // 3) Parse query parameters
//     const {
//       page = 1,
//       search = "",
//       status = "all",
//       sortField = "DocNum",
//       sortDir = "asc",
//       fromDate,
//       toDate,
//     } = req.query;

//     const ITEMS_PER_PAGE = 20;
//     const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

//     console.log("Status filter applied:", status);

//     // Validate and sanitize date filters
//     const validatedFromDate = isValidDate(fromDate) ? fromDate : undefined;
//     const validatedToDate = isValidDate(toDate) ? toDate : undefined;

//     // 4) Extract role-based logic
//     const isAdmin = decodedToken.role === "admin";
//     const contactCodes = decodedToken.contactCodes || [];

//     // 5) Build a unique cache key based on query parameters and user-specific info
//     const cacheKey = `openOrders:api:${contactCodes.join("-")}:${page}:${search}:${status}:${sortField}:${sortDir}:${validatedFromDate || ""}:${validatedToDate || ""}`;

//     // 6) Check if a cached response exists
//     const cachedResponse = await getCache(cacheKey);
//     if (cachedResponse) {
//       console.log("API cache hit for open orders");
//       return res.status(200).json(cachedResponse);
//     }

//     // 7) Fetch open orders from the database
//     const { orders, totalItems } = await getOpenOrdersFromDatabase({
//       search,
//       sortField,
//       sortDir,
//       offset,
//       status,
//       ITEMS_PER_PAGE,
//       fromDate: validatedFromDate,
//       toDate: validatedToDate,
//       isAdmin,
//       contactCodes,
//     });

//     // 8) Build the API response
//     const response = {
//       orders,
//       totalItems,
//       currentPage: parseInt(page, 10),
//     };

//     // 9) Cache the response for 60 seconds
//     await setCache(cacheKey, response, 60);

//     // 10) Return the data
//     res.status(200).json(response);
//   } catch (error) {
//     console.error("Error fetching open orders:", error);
//     res.status(500).json({ error: "Failed to fetch open orders" });
//   }
// }

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 1) Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
        received: authHeader,
      });
    }

    // 2) Verify token
    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ error: "Token verification failed" });
    }

    // 3) Parse query parameters
    const {
      page = 1,
      search = "",
      status = "all",
      sortField = "DocNum",
      sortDir = "asc",
      fromDate,
      toDate,
      getAll = "false", // New query parameter
    } = req.query;

    const ITEMS_PER_PAGE = 20;
    const offset = (parseInt(page, 10) - 1) * ITEMS_PER_PAGE;

    console.log("Status filter applied:", status);

    // Validate and sanitize date filters
    const validatedFromDate = isValidDate(fromDate) ? fromDate : undefined;
    const validatedToDate = isValidDate(toDate) ? toDate : undefined;

    // 4) Extract role-based logic
    const isAdmin = decodedToken.role === "admin";
     const cardCodes = decodedToken.cardCodes || [];
    const contactCodes = decodedToken.contactCodes || [];

    // 5) Fetch open orders from the database
    const { orders, totalItems } = await getOpenOrdersFromDatabase({
      search,
      sortField,
      sortDir,
      offset,
      status,
      ITEMS_PER_PAGE,
      fromDate: validatedFromDate,
      toDate: validatedToDate,
      isAdmin,
      cardCodes,
      contactCodes,
      getAll: getAll === "true", // Convert string to boolean
    });

    // 6) Build the API response
    const response = {
      orders,
      totalItems,
      currentPage: parseInt(page, 10),
    };

    // 7) Return the data
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching open orders:", error);
    res.status(500).json({ error: "Failed to fetch open orders" });
  }
}
