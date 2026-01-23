// // pages/api/invoices.js
// import { verify } from "jsonwebtoken";
// import { parseISO, isValid } from "date-fns";
// import { getInvoicesList } from "../../../lib/models/invoices";
// // Import Redis caching functions (adjust the path as needed)
// import { getCache, setCache } from "../../../lib/redis";

// function isValidDate(date) {
//   return date && isValid(parseISO(date));
// }

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method Not Allowed" });
//   }

//   try {
//     // 1) Verify the Bearer token
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         error: "Missing or malformed Authorization header",
//         received: authHeader,
//       });
//     }

//     const token = authHeader.split(" ")[1];
//     let decodedToken;
//     try {
//       decodedToken = verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       console.error("Token verification failed:", err);
//       return res.status(401).json({ error: "Token verification failed" });
//     }

//     // 2) Role/contactCodes extraction
//     const isAdmin = decodedToken.role === "admin";
//     const contactCodes = decodedToken.contactCodes || [];
//     const cardCodes = decodedToken.cardCodes || [];

//     console.log("isAdmin",isAdmin);
//     console.log("contactCodes",contactCodes);
//     console.log("cardCodes",cardCodes);
//     // 3) Parse query params
//     const {
//       page = 1,
//       search = "",
//       status = "all",
//       sortField = "DocDate",
//       sortDir = "desc",
//       fromDate,
//       toDate,
//       getAll = "false",
//     } = req.query;

//     const itemsPerPage = 20;
//     const validFromDate = isValidDate(fromDate) ? fromDate : undefined;
//     const validToDate = isValidDate(toDate) ? toDate : undefined;

//     // 4) Build a cache key based on query parameters and user-specific info
//     // Using cardCodes as part of the key (if available) to differentiate users
//     // const cacheKey = `invoices:api:${cardCodes.join("-")}:${page}:${search}:${status}:${sortField}:${sortDir}:${validFromDate || ''}:${validToDate || ''}`;

//     const cacheKey = `invoices:api:cc:${contactCodes.join(
//       "-"
//     )}|cd:${cardCodes.join(
//       "-"
//     )}|p:${page}|s:${search}|st:${status}|sf:${sortField}|sd:${sortDir}|fd:${
//       validFromDate || ""
//     }|td:${validToDate || ""}|ga:${getAll}`;

//     // 5) Check if a cached response exists
//     const cachedResponse = await getCache(cacheKey);
//     if (cachedResponse) {
//       console.log("API cache hit for invoices");
//       return res.status(200).json(cachedResponse);
//     }

//     // 6) Fetch invoices from the model
//     const { totalItems, invoices } = await getInvoicesList({
//       page: parseInt(page, 10),
//       search,
//       status,
//       fromDate: validFromDate,
//       toDate: validToDate,
//       sortField,
//       sortDir,
//       itemsPerPage,
//       isAdmin,
//       cardCodes, // pass this down
//       contactCodes,
//       getAll: getAll === "true",
//     });

//     // 7) Build the API response
//     const response = {
//       invoices,
//       totalItems,
//       currentPage: parseInt(page, 10),
//     };

//     // 8) Cache the API response for 60 seconds
//     await setCache(cacheKey, response, 60);

//     // 9) Return data
//     return res.status(200).json(response);
//   } catch (error) {
//     console.error("Error fetching invoices:", error);
//     return res.status(500).json({ error: "Failed to fetch invoices" });
//   }
// }



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

    const itemsPerPage = parseInt(pageSize, 10);

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
    const { totalItems, invoices } = await getInvoicesList({
      page: parseInt(page, 10),
      search,
      status,
      fromDate: validFromDate || monthFromDate,
      toDate: validToDate || monthToDate,
      sortField,
      sortDir,
      itemsPerPage,
      isAdmin,
      cardCodes,
      contactCodes,
      getAll: getAll === "true", // Convert string to boolean
    });

    // 6) Respond
    return res.status(200).json({
      invoices,
      totalItems,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalItems / itemsPerPage),
      pageSize: itemsPerPage,
      hasNextPage: parseInt(page, 10) * itemsPerPage < totalItems,
      hasPrevPage: parseInt(page, 10) > 1,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
}