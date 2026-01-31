

// pages/api/orders.js
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
      sortField = "DocDate",
      sortDir = "desc",
      fromDate,
      toDate,
      month = "", // For month filtering
      getAll = "false",  // Flag for getting all records (for export)
      pageSize = 20 // Allow configurable page size
    } = req.query;

    const ITEMS_PER_PAGE = parseInt(pageSize, 10);

    // Validate date filters
    const validFromDate = isValidDate(fromDate) ? fromDate : undefined;
    const validToDate = isValidDate(toDate) ? toDate : undefined;

    // Handle month filtering
    let monthFromDate, monthToDate;
    if (month && month !== "") {
      const [year, monthNum] = month.split('-');
      if (year && monthNum) {
        monthFromDate = `${year}-${monthNum.padStart(2, '0')}-01`;
        // Last day of the month
        const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
        monthToDate = `${year}-${monthNum.padStart(2, '0')}-${lastDay}`;
      }
    }

    // 5) Fetch from database with role/contact filtering
    const { totalItems, orders } = await getOrdersFromDatabase({
      page: parseInt(page, 10),
      search,
      status,
      sortField,
      sortDir,
      fromDate: validFromDate || monthFromDate,
      toDate: validToDate || monthToDate,
      itemsPerPage: ITEMS_PER_PAGE,
      isAdmin,
      cardCodes,
      contactCodes,
      getAll: getAll === "true", // Convert string to boolean
    });

    // 6) Respond
    return res.status(200).json({
      orders,
      totalItems,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalItems / ITEMS_PER_PAGE),
      pageSize: ITEMS_PER_PAGE,
      hasNextPage: parseInt(page, 10) * ITEMS_PER_PAGE < totalItems,
      hasPrevPage: parseInt(page, 10) > 1,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
}