  // //  pages/api/open-orders.js 



  // import { getOpenOrdersFromDatabase } from "../../../lib/models/orders";
  // import { parseISO, isValid } from "date-fns";
  // import { verify } from "jsonwebtoken";
  // // Helper function to validate dates
  // function isValidDate(date) {
  //   return date && isValid(parseISO(date));
  // }

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

  //   // 3) Extract role-based or contactCodes-based logic
  //   const isAdmin = decodedToken.role === "admin";
  //   // If your JWT includes an array of contactCodes, extract it:
  //   const contactCodes = decodedToken.contactCodes || [];
  //     // Fetch open orders from the database
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

  //     // Respond with data
  //     res.status(200).json({
  //       orders,
  //       totalItems,
  //       currentPage: parseInt(page, 10),
  //     });
  //   } catch (error) {
  //     console.error("Error fetching open orders:", error);
  //     res.status(500).json({ error: "Failed to fetch open orders" });
  //   }
  // }


  // // OpenOrdersPage.seo = {
  // //   title: "Open Orders | Density",
  // //   description: "View and manage all your open orders with stock details.",
  // //   keywords: "open orders, sales, stock management",
  // // };


  // pages/api/open-orders.js
import { verify } from "jsonwebtoken";
import { parseISO, isValid } from "date-fns";
import sql from "mssql";
import { getOpenOrdersFromDatabase } from "../../../lib/models/orders";

function isValidDate(date) {
  return date && isValid(parseISO(date));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
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
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ error: "Token verification failed" });
    }

    const isAdmin = decodedToken.role === "admin";
    const contactCodes = decodedToken.contactCodes || [];

    const {
      page = 1,
      search = "",
      status = "all",
      sortField = "DocNum",
      sortDir = "asc",
      fromDate,
      toDate,
      getAll = false,
    } = req.query;

    const ITEMS_PER_PAGE = 20;
    const offset = (page - 1) * ITEMS_PER_PAGE;

    const isFromDateValid = isValidDate(fromDate);
    const isToDateValid = isValidDate(toDate);

    const { orders, totalItems } = await getOpenOrdersFromDatabase({
      search,
      fromDate: isFromDateValid ? fromDate : undefined,
      toDate: isToDateValid ? toDate : undefined,
      sortField,
      status,
      sortDir,
      offset,
      ITEMS_PER_PAGE,
      isAdmin,
      contactCodes,
      getAll,
    });

    // Ensure dates are properly formatted
    const formattedOrders = orders.map((order) => {
      console.log("Raw DocDate:", order.DocDate); // Debugging
      return {
        ...order,
        DocDate: order.DocDate ? new Date(order.DocDate).toISOString() : null,
        DeliveryDate: order.DeliveryDate ? new Date(order.DeliveryDate).toISOString() : null,
      };
    });

    return res.status(200).json({
      orders: Array.isArray(formattedOrders) ? formattedOrders : [],
      totalItems,
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error("Error fetching open orders:", error);
    return res.status(500).json({ error: "Failed to fetch open orders" });
  }
}