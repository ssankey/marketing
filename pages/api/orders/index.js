


import { verify } from "jsonwebtoken";
import { parseISO, isValid } from "date-fns";
import { getOrdersFromDatabase } from "../../../lib/models/orders";

/** Utility to validate date strings via date-fns */
function isValidDate(date) {
  return date && isValid(parseISO(date));
}

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

    // 3) Extract role-based or contactCodes-based logic
    const isAdmin = decodedToken.role === "admin";
    const contactCodes = decodedToken.contactCodes || [];
    const cardCodes = decodedToken.cardCodes || [];

    // 4) Parse query params
    const {
      page = 1,
      search = "",
      status = "all",
      sortField = "DocNum",
      sortDir = "asc",
      fromDate,
      toDate,
      getAll = "false"  // New flag for getting all records
    } = req.query;

    const ITEMS_PER_PAGE = 20;

    // Validate date filters
    const validFromDate = isValidDate(fromDate) ? fromDate : undefined;
    const validToDate = isValidDate(toDate) ? toDate : undefined;

    // 5) Fetch from database with role/contact filtering
    const { totalItems, orders } = await getOrdersFromDatabase({
      page: parseInt(page, 10),
      search,
      status,
      sortField,
      sortDir,
      fromDate: validFromDate,
      toDate: validToDate,
      itemsPerPage: ITEMS_PER_PAGE,
      isAdmin,
      cardCodes,
      contactCodes,
      getAll: getAll === "true", // Convert string to boolean
    });

    // 6) Respond
    return res.status(200).json({
      orders,
      totalItems: getAll === "true" ? orders.length : totalItems,
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
}