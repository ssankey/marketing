// pages/api/quotations.js
import { verify } from "jsonwebtoken";
import { parseISO, isValid } from "date-fns";
import sql from "mssql"; // only if you need it for param handling, else remove
import { getQuotationsList } from "../../../lib/models/quotations";
import { getCache, setCache } from "../../../lib/redis"; // Import Redis caching functions

function isValidDate(date) {
  return date && isValid(parseISO(date));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 1) Verify Auth Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or malformed Authorization header",
        received: authHeader,
      });
    }

    // 2) Extract and verify JWT
    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ error: "Token verification failed" });
    }

    // 3) Determine user role and contact codes
    const isAdmin = decodedToken.role === "admin";
    const contactCodes = decodedToken.contactCodes || []; 

    // 4) Parse query parameters
    const {
      page = 1,
      search = "",
      status = "all",
      sortField = "DocNum",
      sortDir = "desc",
      fromDate,
      toDate,
    } = req.query;

    const ITEMS_PER_PAGE = 20;

    // 5) Validate date filters if needed
    const isFromDateValid = isValidDate(fromDate);
    const isToDateValid = isValidDate(toDate);
    const validFromDate = isFromDateValid ? fromDate : "";
    const validToDate = isToDateValid ? toDate : "";

    // 6) Build a cache key based on query parameters and user-specific info
    const cacheKey = `quotations:api:${contactCodes.join("-")}:${page}:${search}:${status}:${sortField}:${sortDir}:${validFromDate}:${validToDate}`;

    // 7) Check if a cached response exists
    const cachedResponse = await getCache(cacheKey);
    if (cachedResponse) {
      console.log("API cache hit for quotations");
      return res.status(200).json(cachedResponse);
    }

    // 8) Fetch Quotation data with role-based filtering
    const { totalItems, quotations } = await getQuotationsList({
      page,
      search,
      status,
      sortField,
      sortDir,
      fromDate: isFromDateValid ? fromDate : undefined,
      toDate: isToDateValid ? toDate : undefined,
      itemsPerPage: ITEMS_PER_PAGE,
      isAdmin,      // pass down role info
      contactCodes, // pass down contactCodes
    });

    // 9) Format the results (ISO date strings, etc.)
    const formattedQuotations = quotations.map((quotation) => ({
      ...quotation,
      DocDate: quotation.DocDate ? quotation.DocDate.toISOString() : null,
      DeliveryDate: quotation.DeliveryDate ? quotation.DeliveryDate.toISOString() : null,
    }));

    // 10) Build the API response
    const response = {
      quotations: Array.isArray(formattedQuotations) ? formattedQuotations : [],
      totalItems,
      currentPage: parseInt(page, 10),
    };

    // 11) Cache the API response for 60 seconds
    await setCache(cacheKey, response, 60);

    // 12) Return the data
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return res.status(500).json({ error: "Failed to fetch quotations" });
  }
}
