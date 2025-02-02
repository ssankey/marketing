// pages/api/invoices.js
import { verify } from "jsonwebtoken";
import { parseISO, isValid } from "date-fns";
import { getInvoicesList } from "../../../lib/models/invoices";

function isValidDate(date) {
  return date && isValid(parseISO(date));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 1) Verify the Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
        received: authHeader,
      });
    }

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
    // If your JWT includes an array of contactCodes, extract it:
    const contactCodes = decodedToken.contactCodes || [];

    // 3) Parse query params
    const {
      page = 1,
      search = "",
      status = "all",
      sortField = "DocDate",
      sortDir = "desc",
      fromDate,
      toDate,
    } = req.query;

    const itemsPerPage = 20;
    const validFromDate = isValidDate(fromDate) ? fromDate : undefined;
    const validToDate = isValidDate(toDate) ? toDate : undefined;

    // 4) Fetch invoices from the model, passing isAdmin & cardCode
    const { totalItems, invoices } = await getInvoicesList({
      page: parseInt(page, 10),
      search,
      status,
      fromDate: validFromDate,
      toDate: validToDate,
      sortField,
      sortDir,
      itemsPerPage,
      isAdmin,
      contactCodes   // pass this down
    });

    // 5) Return data
    return res.status(200).json({
      invoices,
      totalItems,
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
}
